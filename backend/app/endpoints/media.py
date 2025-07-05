from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import shutil
from datetime import datetime

from preprocessing.download_video import is_youtube_video_downloadable, download_youtube_video
from app.worker import process_video
from preprocessing.store_metadata import (
    store_video_metadata, 
    get_video_metadata,
    create_video_metadata_table,
)
from preprocessing.ingest_video import delete_video_files

router = APIRouter()

ALLOWED_EXTENSIONS = {'mp4'}
UPLOAD_DIR = os.path.abspath("./data/videos")
THUMBNAIL_DIR = os.path.abspath("./data/thumbnails")

create_video_metadata_table()

class VideoResponse(BaseModel):
    status: str
    message: str

class VideoDetails(BaseModel):
    filename: str
    upload_time: datetime
    is_processed: bool
    duration: Optional[float] = None
    task_id: Optional[str] = None
    task_status: Optional[str] = None
    task_progress: Optional[int] = None
    thumbnail_path: Optional[str] = None    

class YouTubeCheckResponse(BaseModel):
    downloadable: bool
    url: str

@router.get("/videos", response_model=List[VideoDetails])
async def list_uploaded_videos():
    """
    List all uploaded videos and their processing status
    """
    if not os.path.exists(UPLOAD_DIR):
        return []
        
    videos = []
    for filename in os.listdir(UPLOAD_DIR):
        if not any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            continue
            
        file_path = os.path.join(UPLOAD_DIR, filename)
        file_stat = os.stat(file_path)
        
        # Get metadata from database
        metadata = get_video_metadata(file_path)
        
        video_info = VideoDetails(
            filename=filename,
            upload_time=datetime.fromtimestamp(file_stat.st_mtime),
            is_processed=metadata is not None,
            duration=metadata.get('duration') if metadata else None,
            task_id=metadata.get('task_id') if metadata else None,
            task_status=metadata.get('task_status') if metadata else None,
            task_progress=metadata.get('task_progress') if metadata else None,
            thumbnail_path=get_thumbnail_url(metadata.get('thumbnail_path')) if metadata else None
        )
        videos.append(video_info)

    # Sort by upload time, newest first
    videos.sort(key=lambda x: x.upload_time, reverse=True)
    return videos

@router.post("/upload/local_video", response_model=VideoResponse)
async def upload_local_video(file: UploadFile = File(...)):
    try:
        if not any(file.filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            raise HTTPException(status_code=400, detail="Invalid file extension")
            
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Start video processing task
        task = process_video.delay(file_path)
        
        # Store initial metadata with task info
        store_video_metadata(
            video_path=file_path,
            audio_path="",  # Will be updated during processing
            task_id=task.id,
            task_status="Pending",
            task_progress=0
        )
        
        return VideoResponse(
            status="success",
            message="Video uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check_youtube_video", response_model=YouTubeCheckResponse)
async def check_youtube_video(url: str = Query(..., description="YouTube video URL")):
    return {
        "downloadable": is_youtube_video_downloadable(url), 
        "url": url
    }

@router.post("/upload/youtube_video", response_model=VideoResponse)
async def upload_youtube_video(url: str = Query(..., description="YouTube video URL")):
    try:
        file_path = download_youtube_video(url, output_video_path=UPLOAD_DIR)
        
        # Start video processing task
        task = process_video.delay(file_path)
    
        # Store initial metadata with task info
        store_video_metadata(
            video_path=file_path,
            audio_path="",  # Will be updated during processing
            task_id=task.id,
            task_status="Pending",
            task_progress=0
        )
        
        return VideoResponse(
            status="success",
            message="Video uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_thumbnail_url(thumbnail_path: Optional[str]) -> Optional[str]:
    """Convert thumbnail file path to URL"""
    if not thumbnail_path:
        return None
    
    # Extract filename from path
    filename = os.path.basename(thumbnail_path)
    # Return full URL with backend domain
    return f"http://localhost:8001/media/thumbnails/{filename}"

@router.get("/thumbnails/{filename}", response_class=FileResponse)
async def get_thumbnail(filename: str):
    """Serve thumbnail images"""
    thumbnail_path = os.path.join(THUMBNAIL_DIR, filename)
    if os.path.exists(thumbnail_path):
        return FileResponse(thumbnail_path, media_type="image/jpeg")
    else:
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    
@router.delete("/delete_video/{filename}", response_model=VideoResponse)
async def delete_video(filename: str):
    try:
        video_path = os.path.join(UPLOAD_DIR, filename)
        delete_video_files(video_path)
        return VideoResponse(
            status="success",
            message="Video deleted successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))