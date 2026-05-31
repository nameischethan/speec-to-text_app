"use client";

import { useRef, useState } from "react";

type RecorderPanelProps = {
  setTranscript: (text: string) => void;
};

export default function RecorderPanel({ setTranscript }: RecorderPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setAudioURL("");
      setTranscript("");

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
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

          const form = new FormData();
          form.append("file", file);

          const response = await fetch("http://127.0.0.1:5000/transcribe", {
            method: "POST",
            body: form,
          });

          const data = await response.json();

          if (data.transcript) {
            setTranscript(data.transcript);
          } else {
            alert("No transcript returned");
          }
        } catch (error) {
          console.error(error);
          alert("Transcription failed");
        } finally {
          setIsLoading(false);
        }

        console.log("Audio Blob:", blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
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
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Recorder</h2>

      <p className="mb-4 text-gray-600">
        Status: {isRecording ? "Recording..." : "Not recording"}
      </p>

      <div className="flex gap-2">
        <button
          onClick={startRecording}
          disabled={isRecording || isLoading}
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

      {audioURL && (
        <a
          href={audioURL}
          download="recording.webm"
          className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download Audio
        </a>
      )}

      {isLoading && (
        <p className="mt-4 text-blue-600">Transcribing audio...</p>
      )}
    </div>
  );
}