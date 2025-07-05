from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.endpoints import chat, media

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(media.router, prefix="/media", tags=["media"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Chrono API. Use /chat for chat functionalities."}