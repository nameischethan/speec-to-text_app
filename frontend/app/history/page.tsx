"use client";

import { useEffect, useState } from "react";

type Transcript = {
  id: number;
  user_id: number;
  text: string;
  filename: string;
  duration_seconds: number;
  language: string;
  created_at: string;
};

export default function HistoryPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchTranscripts() {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch("https://speech-to-text-app-8p3b.onrender.com/transcripts", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Failed to load transcript history");

          if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }

          return;
        }

        setTranscripts(data.transcripts || []);
      } catch (error) {
        console.error(error);
        setErrorMessage("Backend is not reachable. Check if Flask is running.");
      } finally {
        setLoading(false);
      }
    }

    fetchTranscripts();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const refreshHistory = () => {
    window.location.reload();
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold">Transcript History</h1>

        <div className="flex gap-2">
          <button
            onClick={refreshHistory}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Refresh
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-800 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {loading && <p>Loading transcripts...</p>}

      {!loading && errorMessage && (
        <div className="border border-red-400 rounded-lg p-4 text-red-500 mb-4">
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && transcripts.length === 0 && (
        <div className="border rounded-lg p-4">No transcripts yet.</div>
      )}

      <div className="space-y-4">
        {transcripts.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">
              {new Date(item.created_at).toLocaleString()}
            </p>

            <p className="mb-2">{item.text}</p>

            <p className="text-sm text-gray-500">
              File: {item.filename} | Duration: {item.duration_seconds}s |
              Language: {item.language}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}