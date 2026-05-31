"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type RecorderPanelProps = {
  setTranscript: (text: string) => void;
};

export default function RecorderPanel({ setTranscript }: RecorderPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [socketStatus, setSocketStatus] = useState("Connecting...");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const chunkIndexRef = useRef(0);

  useEffect(() => {
    const socket = io("http://localhost:5001", {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setSocketStatus("Connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketStatus("Disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setSocketStatus("Connection Failed");
    });

    socket.on("server_message", (data) => {
      console.log(data.message);
    });

    socket.on("partial_transcript", (data) => {
      setPartialTranscript(data.text);
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      chunkIndexRef.current = 0;

      setAudioURL("");
      setTranscript("");
      setPartialTranscript("");

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);

          const arrayBuffer = await event.data.arrayBuffer();

          if (socketRef.current?.connected) {
            socketRef.current.emit("audio_chunk", {
              audio: arrayBuffer,
              index: chunkIndexRef.current,
            });
          }

          chunkIndexRef.current += 1;
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        try {
          setIsLoading(true);

          const file = new File([blob], "speech.webm", {
            type: "audio/webm",
          });

          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("http://localhost:5001/transcribe", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          const data = await response.json();

          if (response.status === 401) {
            localStorage.removeItem("token");
            alert("Session expired. Please login again.");
            window.location.href = "/login";
            return;
          }

          if (data.transcript) {
            setTranscript(data.transcript);
            setPartialTranscript("");
          } else {
            alert(data.message || "No transcript returned");
          }
        } catch (error) {
          console.error(error);
          alert("Transcription failed");
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start(2000);
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      alert("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <section className="p-4 sm:p-6 border rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Recorder</h2>

      <p className="mb-2">Status: {isRecording ? "Recording..." : "Not recording"}</p>

      <p className="mb-4 text-sm">Socket: {socketStatus}</p>

      {partialTranscript && (
        <div className="mb-4 p-3 bg-yellow-100 rounded text-black">
          Partial: {partialTranscript}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startRecording}
          disabled={isRecording || isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          aria-label="Start recording"
        >
          Start Recording
        </button>

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          aria-label="Stop recording"
        >
          Stop Recording
        </button>
      </div>

      {audioURL && (
        <a
          href={audioURL}
          download="recording.webm"
          className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download Audio
        </a>
      )}

      {isLoading && <p className="mt-4 text-blue-500">Transcribing audio...</p>}
    </section>
  );
}