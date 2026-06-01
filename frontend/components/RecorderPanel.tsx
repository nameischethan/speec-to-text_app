"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type RecorderPanelProps = {
  setTranscript: (text: string) => void;
};

const API_URL = "https://speech-to-text-app-8p3b.onrender.com";

export default function RecorderPanel({ setTranscript }: RecorderPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [socketStatus, setSocketStatus] = useState("Connecting...");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("Connected");
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      setSocketStatus("Disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket error:", error);
      setSocketStatus("Connection Failed");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startRecording = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      window.location.href = "/login";
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      setTranscript("");

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);

          if (socketRef.current?.connected) {
            socketRef.current.emit("audio_chunk", event.data);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "speech.webm", { type: "audio/webm" });

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_URL}/transcribe`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (data.transcript) {
          setTranscript(data.transcript);
        } else {
          alert(data.message || "No transcript returned");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      alert("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <section className="p-4 sm:p-6 border rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Recorder</h2>

      <p>Status: {isRecording ? "Recording..." : "Not recording"}</p>
      <p>Socket: {socketStatus}</p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Start Recording
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Stop Recording
        </button>
      </div>
    </section>
  );
}