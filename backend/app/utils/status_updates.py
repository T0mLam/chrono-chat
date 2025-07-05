from fastapi import WebSocket
from typing import List
import json
import os

def getWebSocketMessageSender(websocket: WebSocket):
    """
    Returns a function that sends messages to the WebSocket connection.
    
    Args:
        websocket (WebSocket): The WebSocket connection.
    
    Returns:
        Callable: A function that takes a message and sends it to the WebSocket.
    """
    async def send_client(**kwargs):
        await websocket.send_text(json.dumps(kwargs, ensure_ascii=False))
    
    return send_client