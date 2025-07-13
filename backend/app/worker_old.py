from celery import Celery
from inference.videorag import VideoRAG
from preprocessing.ingest_video import ingest_video
from preprocessing.store_metadata import update_task_status
from inference.chat_history import ChatHistory

celery = Celery(__name__)
celery.conf.broker_url = "redis://localhost:6379/0"
celery.conf.result_backend = "redis://localhost:6379/1"

# Initialize the VideoRAGPipeline singleton
video_rag = VideoRAG()
chat_history = ChatHistory()

@celery.task(name="process_video", bind=True)
def process_video(self, video_path: str, sample_interval_sec: float = 1.0):
    """
    Process video file: extract frames and generate embeddings
    """
    # Ingest video with progress updates
    video_filename = ingest_video(
        video_path, 
        video_rag.context_extractor.clip_embedder, 
        video_rag.context_extractor.whisper_embedder, 
        sample_interval_sec,
        progress_callback=lambda progress, status: update_task_status(
            video_path=video_path,
            task_id=self.request.id,
            task_status=status,
            task_progress=progress
        )
    )
    
    # Check if video_filename was returned successfully
    if video_filename is None:
        raise ValueError("Video ingestion failed - no video_filename returned")
    
    # Refresh ChromaDB client to ensure it sees newly added embeddings
    video_rag.refresh_chroma_client()
    
    # Update final status
    update_task_status(
        video_path=video_path,
        task_id=self.request.id,
        task_status="Processed",
        task_progress=100
    )
    
    return video_filename

@celery.task(name="name_chat", bind=True)
def name_chat(self, chat_id: int, message: str):
    new_name = video_rag.ollama_client.get_chat_title(message)
    chat_history.update_chat_name(chat_id, new_name)
    print(f"DEBUG: Updated chat name to {new_name}")