from ollama import Client, AsyncClient
from typing import List, Dict, Any
import re

class OllamaClient:
    def __init__(self, host: str = "http://localhost:11434"):
        self.client = AsyncClient(host=host)
        self.planner_llm = "qwen3:0.6b"
    
    async def chat(self, *args, **kwargs):
        return await self.client.chat(*args, **kwargs)
    
    def _strip_thinking_tags(self, content: str) -> str:
        return re.sub(r'<think>(.*?)</think>', "", content, flags=re.DOTALL).strip()
    
    def _fetch_json_from_content(self, content: str) -> str:
        match = re.search(r'\{.*?\}', content, flags=re.DOTALL)
        return match.group(0) if match else ""
    
    async def plan(self, messages: List[Dict[str, Any]], **kwargs):
        response = await self.client.chat(
            messages=messages,
            model=self.planner_llm,
            stream=False,
            **kwargs
        )
        return self._fetch_json_from_content(response.message.content)
    
    async def answer(self, messages: List[Dict[str, Any]], **kwargs):
        response = await self.client.chat(
            messages=messages,
            think=kwargs.get("think", False),
            model=kwargs.get("model", self.planner_llm),
            stream=True,
        )
        return response
    
    async def get_chat_title(self, message: str):
        system_prompt = {
            "role": "system",
            "content": "You are a helpful assistant. You are given a message. You need to give a title for the chat based on the message, please keep it short and concise. The title should be preferably around 5 words or less. The title should be a summary of the message itself but not its answer."
        }
        messages = [system_prompt, {"role": "user", "content": message}]
        response = await self.client.chat(
            messages=messages,
            model=self.planner_llm,
            stream=False,
            think=False,
        )
        return response.message.content
    
    async def get_summary(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        system_prompt = """You are an expert conversation analyst and summarizer. Your task is to create comprehensive summaries that capture ALL important information from conversations."""
        
        summary_prompt = """
        Analyze the entire conversation history and create a comprehensive summary following these guidelines:

        **CONVERSATION ANALYSIS:**
        1. Identify ALL distinct topics discussed (even if briefly mentioned)
        2. Note any topic transitions or shifts in focus
        3. Identify key questions asked and their answers
        4. Capture any decisions made, conclusions reached, or solutions provided
        5. Note any important context, examples, or details mentioned

        **SUMMARY STRUCTURE:**
        - **Complete Topic Overview**: List ALL topics discussed in chronological order
        - **Key Points per Topic**: For each topic, summarize the main points, decisions, or insights
        - **Recent Focus**: Highlight what was discussed in the most recent exchanges
        - **Important Details**: Include specific examples, numbers, names, or technical details mentioned
        - **Unresolved Items**: Note any questions that weren't fully answered or topics that need follow-up

        **CRITICAL REQUIREMENTS:**
        - DO NOT omit any topic, even if it was brief
        - Include ALL specific details, examples, and technical information
        - Maintain chronological order to show conversation flow
        - If the conversation covers multiple unrelated topics, clearly separate them
        - Be thorough but concise - prioritize completeness over brevity

        Remember: Your goal is to create a summary that someone could read and understand the ENTIRE conversation without missing any important information.
        """

        messages.insert(0, {"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": summary_prompt})

        response = await self.client.chat(
            messages=messages,
            model=self.planner_llm,
            stream=False,
            think=False,
            **kwargs
        )
        return response.message.content

    async def refine_question(self, question: str, prev_messages: str, **kwargs):
        system_prompt = """
        You are a Query Reformulator for a Retrieval-Augmented Generation system.
        Given:
        - A conversation summary: 
        {conversation_summary}
        - A user question: 
        {user_question}

        Your task is to produce a single, concise search query that captures the user's intent for retrieval. Output *only* the query string without additional commentary.
        """

        messages = [
            {"role": "system", "content": system_prompt.format(conversation_summary=prev_messages, user_question=question)},
            {"role": "user", "content": question}
        ]

        response = await self.client.chat(
            messages=messages,
            model=self.planner_llm,
            stream=False,
            think=False,
            **kwargs
        )
        return response.message.content
    
    async def get_video_summary(self, context: str, question: str, **kwargs):
        system_prompt = """
        You are a helpful assistant that summarizes videos.
        You are given a list of relevant context for a video, including transcript snippets (from audio) and optional visual descriptions.
        Your task is to create a **timestamp-based summary** of the video, covering the full timeline from start to finish.

        Follow these rules:

        1. **Use audio transcripts as the primary source** to understand what is happening at each moment.
        2. **Use visual descriptions only to support or clarify** what is said — do not rely on visuals alone.
        3. Break down the summary into **chronological segments**, and for each, write a **brief description** of what happens.
        4. Each segment must begin with a **start and end timestamp** in seconds (e.g., `0-15s`), covering the full video duration.
        5. Include **quotes from the transcript** when important, and highlight key moments.
        6. Do not hallucinate events not mentioned in the context.
        7. Use metadata if it's relevant, but focus on reconstructing the actual flow of the video.

        The output should look like a **timeline of paragraph-based segments**, each starting with a timestamp range and followed by a concise, audio-focused description.
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {question}"}
        ]

        response = await self.client.chat(
            messages=messages,
            model=self.planner_llm,
            stream=False,
            think=False,
            **kwargs
        )
        return response.message.content
