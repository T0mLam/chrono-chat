import os
import torch
import json
import jsonschema
from typing import List, Dict, Any, Optional, Callable
from string import Template

from inference.llm_client import OllamaClient
from inference.context_extractor import ContextExtractor
from inference.chat_history import ChatHistory

PROMPT_DIR = "./inference/prompts"

class VideoRAG:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(VideoRAG, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return 
        
        self.ollama_client = OllamaClient()
        self.context_extractor = ContextExtractor()
        self.chat_history = ChatHistory()

        # Load text prompts
        self.planning_text = self._load_text_prompts("planning.txt")
        self.prompts = {
            "timestamps": self._load_text_prompts("timestamps.txt"),
            "summary": self._load_text_prompts("summary.txt"),
            "query": self._load_text_prompts("query.txt"),
            "ignore": self._load_text_prompts("ignore.txt")
        }

        # Initialize easyocr
        # self.easyocr_reader = easyocr.Reader(
        #     lang_list=["en"], 
        #     gpu=torch.cuda.is_available()  
        # )

        self._initialized = True

    def _load_text_prompts(self, prompt_name: str):
        with open(os.path.join(PROMPT_DIR, prompt_name), "r", encoding="utf-8") as f:
            return f.read()
    
    def refresh_chroma_client(self):
        """Refresh the ChromaDB client to ensure it sees newly added embeddings."""
        self.context_extractor.refresh_chroma_client()
        
    async def _plan(self, plan_messages: List[Dict[str, Any]], max_retries: int = 10, **kwargs):
        config = {
                "mode": "summary",
                "timestamp_range": None
        }
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                planner_output = await self.ollama_client.plan(plan_messages)
                print(f"Planner output: \n{planner_output}")

                # Route and validate the planner output
                config = self._route_and_validate(planner_output)
                break
            except Exception as e:
                retry_count += 1
                print(f"Error on attempt {retry_count}: {e}")
                if retry_count >= max_retries:
                    print("Max retries reached, falling back to ignore mode")
                    break

        return config
        
    def _route_and_validate(self, raw_json: str) -> Dict[str, Any]:
        router_schema = {
            "type": "object",
            "properties": {
                "mode": {
                    "type": "string",
                    "enum": ["timestamps", "summary", "query"]
                },
                "timestamp_range": {
                    "anyOf": [
                        {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 2},
                        {"type": "null"}
                    ]
                }
            },
            "required": ["mode", "timestamp_range"]
        }

        try:
            config = json.loads(raw_json)
        except json.JSONDecodeError as e:
            raise ValueError(f"Router output is not valid JSON: {e}")
        
        jsonschema.validate(config, router_schema)
        return config
    
    async def ask_multi_video(self, messages: List[Dict[str, Any]], config: Dict[str, Any], refined_question: str, video_names: List[str], video_metadatas: List[str], send_client: Callable = lambda **kwargs: None):
        video_summaries = []

        for i, video_name in enumerate(video_names):    
            await send_client(status="retrieving_context", video_index=(i + 1), video_name=video_name)
            context = self.context_extractor.format_context(config, refined_question, [video_name])
            await send_client(status="summarizing_context", video_index=(i + 1), video_name=video_name)
            video_summary = await self.ollama_client.get_video_summary(context, refined_question)

            video_summary_message = f"=== Video {i + 1} ===\n"
            video_summary_message += f"Video name: {video_name}\n"
            video_summary_message += f"Video summary: \n{video_summary}\n\n"
            video_summaries.append({"role": "assistant", "content": video_summary_message})
            print(f"Video summary message: \n{video_summary_message}\n\n")

        # output_prompt = Template(self.prompts[config["mode"]]).substitute(context="")

        messages = [
            {"role": "system", "content": self.prompts[config["mode"]]},
            *messages,
            *video_summaries,
            {"role": "user", "content": refined_question}
        ]

        return messages
    
    async def ask_single_video(self, messages: List[Dict[str, Any]], config: Dict[str, Any], refined_question: str, video_names: List[str], send_client: Callable = lambda **kwargs: None):
        await send_client(status="retrieving_context", video_name=video_names[0])
        # Get formatted context from ContextExtractor
        context = self.context_extractor.format_context(config, refined_question, video_names)
        
        messages = [
            {"role": "system", "content": self.prompts[config["mode"]]},
            *messages,
            {"role": "assistant", "content": f"Here is the relevant context of the videos: \n{context}"},
            {"role": "user", "content": refined_question}
        ]

        return messages
    
    async def ask(self, question: str, video_names: List[str], chat_id: int, model: str, think: bool, video_mode: str, send_client: Callable = lambda **kwargs: None):
        # Use planner LLM with loaded prompt
        multi_video = len(video_names) > 1
        summary = ""
        refined_question = question[:]
        print(f"Video names: {video_names}")

        # Get chat history and add new question
        previous_messages = self.chat_history.get_messages_for_llm(chat_id)
        messages = previous_messages
        print(f"Previous messages: \n{previous_messages}")

        # Add summary to messages if there are previous messages and video names
        if previous_messages and video_names and video_mode != "ignore":
            await send_client(status="summarizing_history", message_count=len(previous_messages))
            summary = await self.ollama_client.get_summary(previous_messages)
            print(f"Summary: \n{summary}")
            messages.append({"role": "assistant", "content": summary})

        if video_names and video_mode != "ignore":
            # Use string replacement instead of .format() to avoid conflicts with JSON braces
            video_metadatas = [self.context_extractor.get_video_metadata_context(video_name) for video_name in video_names]
            plan_prompt = Template(self.planning_text).substitute(video_metadatas=repr(video_metadatas))
            plan_messages = [
                {"role": "system", "content": plan_prompt},
                {"role": "user", "content": question}
            ]
            if video_mode:
                config = { "mode": video_mode, "timestamp_range": None }
                print(f"Config: {config}")
            else:
                await send_client(status="selecting_mode")
                config = await self._plan(plan_messages)

            if config["mode"] == "query":
                await send_client(status="refining_query")
                refined_question = await self.ollama_client.refine_question(question, summary)

            if multi_video:
                messages = await self.ask_multi_video(messages, config, refined_question, video_names, video_metadatas, send_client)
            else:
                messages = await self.ask_single_video(messages, config, refined_question, video_names, send_client)
        else:
            messages = [
                {"role": "system", "content": "You are a helpful assistant that can answer questions."},
                *messages,
                {"role": "user", "content": refined_question}
            ]

        self.chat_history.add_message(chat_id, "user", question)
        
        await send_client(status="loading_model", model=model)

        # Get streaming response from LLM
        full_response = ""
        full_thinking = ""
        async for chunk in await self.ollama_client.answer(messages, think=think, stream=True, model=model): # type: ignore
            content = chunk.get("message", {}).get("content", "")
            think_content = chunk.get("message", {}).get("thinking", "")
            done = chunk.get("done", False)
            
            if think_content:
                response_data = {"chat_id": chat_id, "type": "thinking", "content": think_content, "done": done}
                full_thinking += think_content
            else:
                response_data = {"chat_id": chat_id, "type": "markdown", "content": content, "done": done}
                full_response += content

            yield response_data

        # Store complete messages only after streaming is finished
        if full_thinking:
            self.chat_history.add_message(chat_id, "thinking", full_thinking)
        if full_response:
            self.chat_history.add_message(chat_id, "assistant", full_response)

if __name__ == "__main__":
    videorag = VideoRAG()
