import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

import os
import torch
import whisper
import numpy as np 
from typing import Dict, List, Tuple, Any
from sentence_transformers import SentenceTransformer

class WhisperTextEmbedder:
    """Transcribes audio with Whisper and embeds text using a sentence-level model."""

    def __init__(
        self, 
        whisper_model_name: str = "base", 
        embed_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: str = "cuda" if torch.cuda.is_available() else "cpu",
    ):  
        self.whisper_model_name = whisper_model_name
        self.device = device
        self.model = whisper.load_model(whisper_model_name, device=device)
        self.model.eval()
        self.embedder = SentenceTransformer(embed_model_name, device=device)

    def transcribe_audio(self, audio_path: str) -> List[Dict[str, Any]]:
        """
        Transcribe audio using Whisper model and group every 3 segments.

        Args:
            audio_path (str): Path to the audio file.

        Returns:
            List[Dict[str, Any]]: List of {start, end, text, emb} for grouped segments.
        """
        result = self.model.transcribe(audio_path)
        transcriptions = []
        
        # Group segments into chunks of 3
        segments = result["segments"]
        for i in range(0, len(segments), 3):
            # Get the current group of segments (up to 3)
            group_segments = segments[i: i + 3]
            
            # Combine text from all segments in the group
            combined_text = " ".join([seg["text"].strip() for seg in group_segments])
            
            # Get start time from first segment and end time from last segment
            start_time = group_segments[0]["start"]
            end_time = group_segments[-1]["end"]
            
            # Create embedding for the combined text
            embedding = self.embed_query(combined_text)
            
            transcriptions.append({
                "start": start_time,
                "end": end_time,
                "text": combined_text,
                "emb": embedding
            })
        
        return transcriptions 

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.embedder.encode(
            texts,
            normalize_embeddings=True
        ).tolist()

    def embed_query(self, query: str) -> List[float]:
        # Ensure we pass a list with a single string to get a single embedding
        embeddings = self.embedder.encode(
            [query],  # Pass as a list with one element
            normalize_embeddings=True
        )
        # Convert to list and get the first (and only) embedding vector
        embedding_list = embeddings.tolist()
        if len(embedding_list) == 1:
            return embedding_list[0]  # Return the embedding vector (list of floats)
        else:
            raise ValueError(f"Expected 1 embedding, got {len(embedding_list)}")


# def transcribe_audio(
#     audio_path: str,
#     whisper_model_name: str = "base",
#     device: str = "cuda" if torch.cuda.is_available() else "cpu",
# ) -> List[Dict[str, str]]:
#     """
#     Transcribe audio using Whisper model.

#     Args:
#         audio_path (str): Path to the audio file.
#         whisper_model_name (str): Name of the Whisper model to use.
#         device (str): Device to run the model on ("cuda" or "cpu").
#         batch_length_sec (float): Length of each batch in seconds.

#     Returns:
#         List[Dict[str, str]]: List of transcriptions with start and end timestamps.
#     """

#     model = whisper.load_model(whisper_model_name, device=device)

#     result = model.transcribe(audio_path)
#     print(result)

#     transcriptions = []

#     for segment in result["segments"]:
#         transcriptions.append({
#             "start": segment["start"],
#             "end": segment["end"],
#             "text": segment["text"].strip()
#         })
     
#     return transcriptions

if __name__ == "__main__":
    # audio_path = "https://replicate.delivery/mgxm/e5159b1b-508a-4be4-b892-e1eb47850bdc/OSR_uk_000_0050_8k.wav"
    # audio_path = r"C:\Users\admin\Desktop\chrono-chat\data\audio\史達林新雕像重現俄羅斯 政界稱蘇聯未曾合法解體？－ BBC News 中文.m4a"
    # print(transcribe_audio(audio_path))
    pass