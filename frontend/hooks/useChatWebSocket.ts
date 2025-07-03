import { useRef, useEffect, useState, useCallback } from "react";

export function useChatWebSocket(
  onMessage: (data: any) => void,
  shouldConnect: boolean = true
) {
  const ws = useRef<WebSocket | null>(null);
  const [canSend, setCanSend] = useState(false); // Ready state for sending messages
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Only connect if shouldConnect is true
    if (!shouldConnect) {
      return;
    }

    const connectWebSocket = () => {
      try {
        // Clean up any existing connection
        if (ws.current) {
          ws.current.close();
        }

        ws.current = new WebSocket("ws://localhost:8001/chat/ws");
        setIsConnecting(true);
        setError(null);

        ws.current.onopen = () => {
          setCanSend(true);
          setIsConnecting(false);
          console.log("WebSocket connection established for chat");
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
            // Allow sending messages after receiving any message
            if (data.done) {
              setCanSend(true);
            }
          } catch (parseError) {
            console.error("Error parsing WebSocket message:", parseError);
          }
        };

        ws.current.onclose = (event) => {
          setCanSend(false);
          setIsConnecting(false);
          console.log("WebSocket connection closed", event.code, event.reason);

          // Only set error if it wasn't a normal closure
          if (event.code !== 1000) {
            setError("WebSocket connection closed unexpectedly");
          }
        };

        ws.current.onerror = (event) => {
          console.error("WebSocket error:", event);
          setIsConnecting(false);
          setError(
            "Failed to connect to chat server. Please ensure the backend is running."
          );
          setCanSend(false);
        };
      } catch (err) {
        console.error("Error creating WebSocket:", err);
        setError("Failed to create WebSocket connection");
        setIsConnecting(false);
        setCanSend(false);
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
        console.log("WebSocket connection cleaned up");
      }
      setCanSend(false);
      setIsConnecting(false);
    };
  }, [shouldConnect]); // Re-run when shouldConnect changes

  const sendMessage = (
    chatId: number,
    message: any,
    think: boolean,
    model: string,
    videoNames: string[],
    videoMode: string
  ) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current?.send(
        JSON.stringify({
          message: message,
          chat_id: chatId,
          video_names: videoNames,
          think: think,
          model: model,
          video_mode: videoMode,
        })
      );
      console.log("Message sent:", message);
      setCanSend(false); // Disable sending until we receive a response
    } else {
      console.error("WebSocket not open. Ready state:", ws.current?.readyState);
      setError("Cannot send message - WebSocket not connected");
    }
  };

  return {
    sendMessage,
    canSend,
    error,
    isConnecting,
  };
}
