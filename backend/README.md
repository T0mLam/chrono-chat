# ChronoChat Backend

ChronoChat is a UI for Ollama that lets users chat with video content. The backend
implements the APIs that power ChronoChat. The server is built on FastAPI
and runs asynchronous workers for ingesting videos and retrieving
multimodal context for LLM responses.

## Directory overview

```
backend/
├── app/                  # FastAPI application
│   ├── main.py           # creates FastAPI app and registers routers
│   ├── endpoints/
│   │   ├── chat.py       # WebSocket chat and chat management endpoints
│   │   └── media.py      # Video upload and management endpoints
│   ├── utils/            # utilities for WebSocket messaging
│   └── worker.py         # runs long‑running ingestion tasks
├── preprocessing/        # scripts for downloading and processing videos
├── embedding/            # CLIP, Whisper and BLIP embedding modules
├── inference/            # VideoRAG engine, context extraction and LLM client
├── data/                 # stores uploaded videos, thumbnails, files, metadata
├── requirements.txt      # Python dependencies
```

## API reference

<img width="70%" alt="fastapi_endpoints" src="https://github.com/user-attachments/assets/0c5ad0df-39e9-419e-b708-464a70d9a43a" />



You can navigate to http://localhost:8001/docs to explore the interactive FastAPI documentation.



