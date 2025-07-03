erimport os
import json
import datetime
from typing import List, Dict, Any

import torch
import easyocr
from langchain.vectorstores import Chroma
from langchain.schemas import Document
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain, ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.llms import HuggingFacePipeline
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

from inference.llm_runner import QwenChatbot
from embedding.clip_embedder import ClipEmbedder
from embedding.whisper_embedder import WhisperTextEmbedder
from inference.ocr_extractor import extract_text_from_video_frame

class VideoRAGChatbot:
    """
    A single object that:
      1. Loads embedding model + Chroma vector store
      2. Loads a “planner” LLM (small) to pick modalities (optional)
      3. Loads a “final answerer” LLM (large)
    """

    def __init__(
        self,
        chroma_dir: str = "./data/chroma_db",
        retriveal_k: int = 5,
        device: str = "cuda" if torch.cuda.is_available() else "cpu",
    ):
        self.device = device
        self.retriveal_k = retriveal_k
        self.chroma_dir = chroma_dir
        self.default_modalities = ["caption", "ocr", "asr", "object"]
        self.video_ids = []

        # Load ChromaDB collection
        self.whisper_collection = Chroma(
            persist_directory=self.chroma_dir,
            collection_name="whisper_transcriptions",
            embedding_function=WhisperTextEmbedder()
        )
        self.clip_collection = Chroma(
            persist_directory=self.chroma_dir,
            collection_name="clip_captions",
            embedding_function=ClipEmbedder()
        )

        # Read prompt template from external text file
        base_dir = os.path.dirname(__file__)
        prompt_dir = os.path.join(base_dir, "prompts")
        planning_text, answer_text = self._load_text_prompts(prompt_dir)
        
        self.planner_prompt = PromptTemplate(
            input_variables=["question"],
            template=planning_text,
        )
        self.answerer_prompt = PromptTemplate(
            input_variables=["question", "context"],
            template=answer_text,
        )

        # Load planner model
        self._load_planner()

        # Load answerer model
        self.answerer_llm = QwenChatbot(model_name="Qwen/Qwen3-1.7B", device=self.device)

        # Initialize easyocr
        self.easyocr_reader = easyocr.Reader(
            languages=["en"],  
            gpu=torch.cuda.is_available()  
        )

    def _load_text_prompts(self, prompt_path: str):
        planning_text_path = os.path.join(prompt_path, "planning_prompt.txt")
        answer_text_path = os.path.join(prompt_path, "answer_prompt.txt")
        planning_text = open(planning_text_path, "r", encoding="utf-8").read()
        answer_text = open(answer_text_path, "r", encoding="utf-8").read()
        return planning_text, answer_text

    def _load_planner(self):
        """Load a small seq2seq model that returns JSON planning instructions."""
        tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")
        model = AutoModelForCausalLM.from_pretrained(
            "google/flan-t5-small",
            device_map="auto",
            load_in_8bit=True 
        )
        hf_pipeline = pipeline(
            "text2text-generation",
            model=model,
            tokenizer=tokenizer,
            device_map="auto",
            max_length=512,
            temperature=0
        )
        self.planner_llm = HuggingFacePipeline(pipeline=hf_pipeline)
    
    def ask(self, question: str):
        planner_output = self.planner_llm.run(
            self.planner_prompt.format(question=question)
        )
        try:
            plan = json.loads(planner_output)
            modalities = plan.get("modalities", ["caption", "ocr", "asr", "object"])
        except json.JSONDecodeError:
            print(f"Failed to parse planner output: {planner_output}")
            modalities = self.default_modalities

        # 
        

        # Format the question and modalities for the answerer
        formatted_prompt = self.answerer_prompt.format(
            question=question,
            context=context
        )

        # Stream the response from Qwen
        response_stream = self.answerer_llm.generate_response_stream(formatted_prompt)

        return response_stream


        # def _load_answerer(self, model_name: str):
        #     tokenizer = AutoTokenizer.from_pretrained(model_name)
        #     model = AutoModelForCausalLM.from_pretrained(model_name).to(self.device)
        #     hf_pipeline = pipeline(
        #         "text2text-generation",
        #         model=model,
        #         tokenizer=tokenizer,
        #         device=0 if self.device == "cuda" else -1
        #     )
        #     self.answerer_llm = HuggingFacePipeline(pipeline=hf_pipeline)