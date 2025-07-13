from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
import asyncio
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
import json

# from inference.pipeline import VideoRAGPipeline
from app.worker import name_chat
from inference.llm_client import OllamaClient
from inference.chat_history import ChatHistory
from inference.videorag import VideoRAG
from app.utils.status_updates import getWebSocketMessageSender

router = APIRouter()
video_rag = VideoRAG()

# class ChatRequest(BaseModel):
#     chat_id: int 
#     think: bool
#     video_id: str
#     message: str

# class ChatResponse(BaseModel):
#     chat_id: int
#     response: str

# @router.post("/chat")
# async def test_chat(request: ChatRequest) -> StreamingResponse:
#     """
#     Handle chat requests by processing the video and generating a response.
    
#     Args:
#         request (ChatRequest): The chat request containing chat_id, video_id, and message.
    
#     Returns:
#         ChatResponse: The response containing chat_id and generated response.
#     """
#     sample_messages = [
#         {"role": "system", "content": "You are a helpful assistant."},
#         {"role": "user", "content": request.message}
#     ]

#     def chat_stream():
#         try:
#             stream = llm_runner.answerer_llm.answer(sample_messages, think=request.think)
#             for chunk in stream:
#                 content = chunk.get("message", {}).get("content", "")
#                 # Yield each token/chunk as soon as it is generated, with chat_id
#                 data = {"chat_id": request.chat_id, "token": content}
#                 yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
#         except Exception as e:
#             data = {"chat_id": request.chat_id, "token": f"Error: {str(e)}"}
#             yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

#     return StreamingResponse(
#         chat_stream(),
#         media_type="text/event-stream",
#         headers={"Content-Type": "text/event-stream"}
#     )

@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    send_client = getWebSocketMessageSender(websocket)
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            request_data = json.loads(data)

            chat_id = request_data.get("chat_id")
            message = request_data.get("message")
            think = request_data.get("think", False)
            video_names = request_data.get("video_names", [])
            model = request_data.get("model")
            video_mode = request_data.get("video_mode", "")

            if not chat_id or not message:
                error_data = {"chat_id": chat_id, "type": "error", "content": "Invalid request data: missing chat_id or messages"}
                await send_client(**error_data)
                continue

            if chat_id == video_rag.chat_history.get_new_chat_id():
                video_rag.chat_history.create_chat(chat_id=chat_id)
                # Run name_chat in background (can run simultaneously with video processing)
                asyncio.create_task(name_chat(chat_id, message))
            
            # Get the generator from video_rag.ask() and iterate through it
            response_generator = video_rag.ask(message, video_names, chat_id, model, think, video_mode, send_client=send_client)
            
            async for response_data in response_generator:
                await send_client(**response_data)

    except WebSocketDisconnect:
        print("WebSocket connection closed")

@router.websocket("/ws/test")
async def test_websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat interaction.
    
    Args:
        websocket (WebSocket): The WebSocket connection.
    
    Raises:
        WebSocketDisconnect: If the WebSocket connection is closed.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            request_data = json.loads(data)
            print(f"Received data: {request_data}")
            chat_id = request_data.get("chat_id")
            message = request_data.get("message")
            think = request_data.get("think", True)
            video_ids = request_data.get("video_ids")
            model = request_data.get("model")

            if not chat_id or not message:
                error_data = {"chat_id": chat_id, "type": "error", "content": "Invalid request data: missing chat_id or messages"}
                await websocket.send_text(json.dumps(error_data, ensure_ascii=False))
                continue

            if chat_id == video_rag.chat_history.get_new_chat_id():
                video_rag.chat_history.create_chat(chat_id=chat_id)
                # Run name_chat in background (can run simultaneously with video processing)
                asyncio.create_task(name_chat(chat_id, message))
            
            video_rag.chat_history.add_message(chat_id, "user", message)
            messages = video_rag.chat_history.get_messages_for_llm(chat_id)

            system_prompt = {
                "role": "system",
                "content": "You are a helpful assistant."
            }
            messages.insert(0, system_prompt)

            stream = await video_rag.ollama_client.answer(messages, think=think, model=model, stream=True)

            full_response = ""
            full_thinking = ""
            for chunk in stream:
                content = chunk.get("message", {}).get("content", "")
                think = chunk.get("message", {}).get("thinking", "")
                done = chunk.get("done", False)

                print(f"Sending chunk: {content}, think: {think}, done: {done}")
                
                if think:
                    response_data = {"chat_id": chat_id, "type": "thinking", "content": think, "done": done}
                    full_thinking += think
                else:
                    response_data = {"chat_id": chat_id, "type": "markdown", "content": content, "done": done}
                    full_response += content

                await websocket.send_text(json.dumps(response_data, ensure_ascii=False))

            # Store complete messages only after streaming is finished
            if full_thinking:
                print(f"DEBUG: Adding thinking message to chat {chat_id}: {full_thinking[:50]}...")
                video_rag.chat_history.add_message(chat_id, "thinking", full_thinking)
            if full_response:
                print(f"DEBUG: Adding assistant message to chat {chat_id}: {full_response[:50]}...")
                video_rag.chat_history.add_message(chat_id, "assistant", full_response)

    except WebSocketDisconnect:
        print("WebSocket connection closed")

@router.get("/local_models")
async def get_local_models():
    models = []
    model_list = await video_rag.ollama_client.client.list()
    for model in model_list.models:
        models.append({"name": model.model, "size": model.size})
    return {"models": models}

@router.get("/get_chats")
async def get_chats():  
    chats = video_rag.chat_history.get_chats()
    return {"chats": chats}

@router.get("/get_messages")
async def get_messages(chat_id: int):
    messages = video_rag.chat_history.get_history(chat_id)
    return {"messages": messages}

@router.delete("/delete_chat")
async def delete_chat(chat_id: int):
    video_rag.chat_history.delete_chat(chat_id)
    return {"message": "Chat deleted successfully"}

@router.post("/create_chat")
async def create_chat():
    """Create a new chat session and return its ID."""
    chat_id = video_rag.chat_history.get_new_chat_id()
    return {"chat_id": chat_id, "message": "Chat created successfully"}

@router.put("/update_chat_name")
async def update_chat_name(chat_id: int, new_name: str):
    """Update the name of a chat session."""
    video_rag.chat_history.update_chat_name(chat_id, new_name)
    return {"message": "Chat name updated successfully"}
