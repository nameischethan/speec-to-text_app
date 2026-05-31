"use client";

import { useState } from "react";
import Header from "../components/Header";
import RecorderPanel from "../components/RecorderPanel";
import TranscriptPanel from "../components/TranscriptPanel";

export default function Home() {
  const [transcript, setTranscript] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6">
      <Header />

      <nav className="flex flex-wrap gap-3 mt-4 mb-6">
        <a href="/register" className="px-4 py-2 bg-green-500 text-white rounded">
          Register
        </a>

        <a href="/login" className="px-4 py-2 bg-blue-500 text-white rounded">
          Login
        </a>

        <a href="/history" className="px-4 py-2 bg-gray-800 text-white rounded">
          History
        </a>

        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </nav>

      <section className="grid gap-4">
        <RecorderPanel setTranscript={setTranscript} />
        <TranscriptPanel transcript={transcript} />
      </section>
    </main>
  );
}