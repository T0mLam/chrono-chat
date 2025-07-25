from fastapi import APIRouter, WebSocket, WebSocketDisconnect, File, UploadFile
import asyncio
from typing import Dict, Any, List
import json
import os

from app.worker import name_chat
from inference.videorag import VideoRAG
from app.utils.status_updates import getWebSocketMessageSender

router = APIRouter()
video_rag = VideoRAG()

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
            files = request_data.get("files", [])

            if not chat_id or not message:
                error_data = {"chat_id": chat_id, "type": "error", "content": "Invalid request data: missing chat_id or messages"}
                await send_client(**error_data)
                continue

            if chat_id == video_rag.chat_history.get_new_chat_id():
                video_rag.chat_history.create_chat(chat_id=chat_id)
                # Run name_chat in background (can run simultaneously with video processing)
                asyncio.create_task(name_chat(chat_id, message))
            
            # Get the generator from video_rag.ask() and iterate through it
            if files:
                response_generator = await video_rag.ask_with_files(message, files, chat_id, model, think, send_client=send_client)
            else:
                response_generator = await video_rag.ask(message, video_names, chat_id, model, think, video_mode, send_client=send_client)
            
            async for response_data in response_generator:
                await send_client(**response_data)

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

@router.post("/upload_file")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to the server."""
    await video_rag.save_file(file)
    return {"message": "File uploaded successfully"}

@router.post("/update_planner_model")
async def update_planner_model(model_name: str):
    """Update the planner model in the ollama client."""
    if model_name:
        video_rag.ollama_client.planner_llm = model_name
    print(f"Planner model updated to: {model_name}")
    return {"message": "Planner model updated successfully"}
