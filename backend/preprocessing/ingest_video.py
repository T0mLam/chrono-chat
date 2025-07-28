import os 
import sqlite3
import chromadb
from typing import List, Dict, Any, Callable, Optional
from PIL import Image
import ffmpeg

from preprocessing.extract_frames import sample_frames
from embedding.clip_embedder import ClipEmbedder
from embedding.whisper_embedder import WhisperTextEmbedder
from preprocessing.store_embeddings import (
    get_chroma_collection,
    store_frame_embeddings,
    store_audio_embeddings,
    delete_all_embeddings
)

from preprocessing.store_metadata import (
    store_video_metadata,
    delete_video_metadata
)

def extract_audio(video_path: str, audio_dir: str = "./data/audio") -> str:
    """
    Extract audio from a video file and save it to the specified path.

    Args:
        video_path (str): Path to the video file.
        audio_dir (str): Directory where the audio file will be saved.

    Returns:
        str: Path to the saved audio file.
    """
    os.makedirs(audio_dir, exist_ok=True)
    filename = os.path.splitext(os.path.basename(video_path))[0] + ".wav"
    audio_path = os.path.join(audio_dir, filename)
    
    (
        ffmpeg
        .input(video_path)
        .output(audio_path, acodec='pcm_s16le', ac=1, ar='16000')
        .run(overwrite_output=True, quiet=True)
    )
    
    return audio_path

def ingest_video(
    video_path: str,
    clip_embedder,
    whisper_embedder,
    sample_interval_sec: float = 1.0,
    progress_callback: Optional[Callable[[int, str], None]] = None
) -> str:
    """
    Ingest a video file by extracting frames, generating embeddings, and storing them.
    
    Args:
        video_path: Path to the video file
        clip_embedder: CLIP embedder instance
        whisper_embedder: Whisper embedder instance
        sample_interval_sec: Interval in seconds to sample frames
        progress_callback: Optional callback function to report progress
        
    Returns:
        str: Filename of the processed video
    """
    try:
        # Create a shared ChromaDB client for the same DB
        client = chromadb.PersistentClient(path="./data/chroma_db")

        # Get/create the Chroma collections
        frame_collection = get_chroma_collection("frames", client)
        audio_collection = get_chroma_collection("asr", client)

        # Extract filename for use as identifier
        video_filename = os.path.basename(video_path)

        # Extract frames
        if progress_callback:
            progress_callback(5, "Sampling frames")
        
        frames = sample_frames(video_path, sample_interval_sec)
        audio_path = extract_audio(video_path)
        
        # Generate CLIP embeddings
        if progress_callback:
            progress_callback(15, "Processing frames")
        
        clip_embeddings = clip_embedder.embed_frames(frames, sample_interval_sec)
        
        # Generate Whisper embeddings
        if progress_callback:
            progress_callback(50, "Processing audio")
        
        audio_embeddings = whisper_embedder.transcribe_audio(audio_path)

        
        # Store embeddings
        if progress_callback:
            progress_callback(80, "Storing embeddings")

        # Store video metadata (still returns video_id for database compatibility)
        store_video_metadata(video_path, audio_path)

        # Store frame embeddings using filename
        store_frame_embeddings(frame_collection, video_filename, clip_embeddings)
        store_audio_embeddings(audio_collection, video_filename, audio_embeddings)
        
        return video_filename
            
    except Exception as e:
        if progress_callback:
            progress_callback(0, f"Error: {str(e)}")
        raise e

def delete_video_files(video_path: str):
    """
    Delete a video file and its associated metadata.
    """
    try:
        video_id, video_path, audio_path, thumbnail_path = delete_video_metadata(video_path)
        video_filename = os.path.basename(video_path)
        
        os.remove(video_path)
        os.remove(audio_path)
        os.remove(thumbnail_path)
        delete_all_embeddings(video_filename)
    except Exception as e:
        raise e
