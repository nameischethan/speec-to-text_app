"use client";

import { useRef, useState } from "react";

type RecorderPanelProps = {
  setTranscript: (text: string) => void;
};

const API_URL = "https://speech-to-text-app-8p3b.onrender.com";

export default function RecorderPanel({ setTranscript }: RecorderPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const getMimeType = () => {
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
    if (MediaRecorder.isTypeSupported("audio/ogg")) return "audio/ogg";
    return "";
  };

  const getExtension = (mimeType: string) => {
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("ogg")) return "ogg";
    return "webm";
  };

  const startRecording = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      window.location.href = "/login";
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getMimeType();

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      setAudioURL("");
      setTranscript("");

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalMimeType = mediaRecorder.mimeType || mimeType || "audio/webm";
        const extension = getExtension(finalMimeType);

        const blob = new Blob(chunksRef.current, {
          type: finalMimeType,
        });

        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        try {
          setIsLoading(true);

          const file = new File([blob], `speech.${extension}`, {
            type: finalMimeType,
          });

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

          if (response.status === 401) {
            localStorage.removeItem("token");
            alert("Session expired. Please login again.");
            window.location.href = "/login";
            return;
          }

          if (data.transcript) {
            setTranscript(data.transcript);
          } else {
            alert(data.message || data.details || "No transcript returned");
          }
        } catch (error) {
          console.error(error);
          alert("Transcription failed");
        } finally {
          setIsLoading(false);
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      alert("Microphone permission denied or not supported on this browser");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <section className="p-4 sm:p-6 border rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Recorder</h2>

      <p className="mb-2">
        Status: {isRecording ? "Recording..." : "Not recording"}
      </p>

      <p className="mb-4 text-sm text-gray-500">
        Mobile mode: Socket not required
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startRecording}
          disabled={isRecording || isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Start Recording
        </button>

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Stop Recording
        </button>
      </div>

      {audioURL && (
        <a
          href={audioURL}
          download="recording"
          className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download Audio
        </a>
      )}

      {isLoading && <p className="mt-4 text-blue-500">Transcribing audio...</p>}
    </section>
  );
}