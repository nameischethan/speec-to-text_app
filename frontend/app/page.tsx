"use client";

import { useState } from "react";
import Header from "../components/Header";
import RecorderPanel from "../components/RecorderPanel";
import TranscriptPanel from "../components/TranscriptPanel";

export default function Home() {
  const [transcript, setTranscript] = useState("");

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Header />

      <div className="mt-6">
        <RecorderPanel setTranscript={setTranscript} />
      </div>

      <TranscriptPanel transcript={transcript} />
    </main>
  );
}