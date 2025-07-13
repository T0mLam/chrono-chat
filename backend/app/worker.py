from inference.videorag import VideoRAG
from preprocessing.ingest_video import ingest_video
from preprocessing.store_metadata import update_task_status
from inference.chat_history import ChatHistory
import asyncio
import uuid
from typing import Optional, Dict, Any
from collections import deque
from concurrent.futures import ThreadPoolExecutor

video_rag = VideoRAG()
thread_pool = ThreadPoolExecutor(max_workers=1)

class VideoProcessingQueue:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.lock = asyncio.Lock()
        self.is_processing = False

    async def add_task(self, video_path: str, sample_interval_sec: float = 1.0, task_id: Optional[str] = None):
        """
        Add a video processing task to the queue
        """
        if task_id is None:
            task_id = str(uuid.uuid4())
            
        task_info = {
            "video_path": video_path,
            "sample_interval_sec": sample_interval_sec,
            "task_id": task_id,
        }

        await self.queue.put(task_info)
        print(f"Added video {video_path} to processing queue. Queue length: {self.queue.qsize()}")

        async with self.lock:
            if not self.is_processing:
                self.is_processing = True
                asyncio.create_task(self._process_next_task())

    async def _process_next_task(self):
        """
        Process the next task in the queue
        """
        try:
            while True:
                task_info = await self.queue.get()
                if task_info is None:
                    break
                
                print(f"Processing video: {task_info['video_path']}")
                
                try:
                    await self._process_video(
                        task_info["video_path"], 
                        task_info["sample_interval_sec"], 
                        task_info["task_id"]
                    )
                    print(f"Successfully processed video: {task_info['video_path']}")
                except Exception as e:
                    print(f"Failed to process video {task_info['video_path']}: {str(e)}")
                    
        except Exception as e:
            print(f"Error in video processing queue: {e}")
        finally:
            async with self.lock:
                self.is_processing = False

    async def _process_video(self, video_path: str, sample_interval_sec: float = 1.0, task_id: Optional[str] = None):
        """
        Process a single video file
        """
        try:
            # Update status to indicate processing has started
            update_task_status(
                video_path=video_path,
                task_id=task_id,
                task_status="Processing",
                task_progress=0
            )
            
            # Ingest video with progress updates
            loop = asyncio.get_running_loop()
            video_filename = await loop.run_in_executor(
                thread_pool,
                ingest_video,
                video_path,
                video_rag.context_extractor.clip_embedder,
                video_rag.context_extractor.whisper_embedder,
                sample_interval_sec,
                lambda progress, status: update_task_status(
                    video_path=video_path,
                    task_id=task_id,
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
                task_id=task_id,
                task_status="Processed",
                task_progress=100
            )
            
            return video_filename
        except Exception as e:
            # Update status to failed
            update_task_status(
                video_path=video_path,
                task_id=task_id,
                task_status="Failed",
                task_progress=0
            )
            raise e

video_processing_queue = VideoProcessingQueue()

async def process_video(video_path: str, sample_interval_sec: float = 1.0, task_id: Optional[str] = None):
    """
    Add a video to the processing queue
    This function now delegates to the queue system instead of processing directly
    """
    await video_processing_queue.add_task(video_path, sample_interval_sec, task_id)

async def name_chat(chat_id: int, message: str):
    """
    Generate a name for a chat based on the first message
    This function can run simultaneously with video processing
    """
    try:
        new_name = await video_rag.ollama_client.get_chat_title(message)
        video_rag.chat_history.update_chat_name(chat_id, new_name)
        print(f"DEBUG: Updated chat name to {new_name}")
        return new_name
    except Exception as e:
        print(f"DEBUG: Failed to update chat name: {e}")
        raise e