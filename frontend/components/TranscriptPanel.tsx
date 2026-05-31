"use client";

type TranscriptPanelProps = {
  transcript: string;
};

export default function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const copyTranscript = async () => {
    if (!transcript) {
      alert("No transcript to copy");
      return;
    }

    await navigator.clipboard.writeText(transcript);
    alert("Transcript copied");
  };

  const downloadTxt = () => {
    if (!transcript) {
      alert("No transcript to download");
      return;
    }

    const blob = new Blob([transcript], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "transcript.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  const shareTranscript = async () => {
    if (!transcript) {
      alert("No transcript to share");
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: "Transcript",
        text: transcript,
      });
    } else {
      await navigator.clipboard.writeText(transcript);
      alert("Sharing is not supported here, so transcript was copied instead");
    }
  };

  return (
    <section className="p-4 sm:p-6 border rounded-xl mt-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold">Live Transcript</h2>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyTranscript}
            className="px-3 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            disabled={!transcript}
            aria-label="Copy transcript"
          >
            Copy
          </button>

          <button
            onClick={downloadTxt}
            className="px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
            disabled={!transcript}
            aria-label="Download transcript as text file"
          >
            Download .txt
          </button>

          <button
            onClick={shareTranscript}
            className="px-3 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
            disabled={!transcript}
            aria-label="Share transcript"
          >
            Share
          </button>
        </div>
      </div>

      <div className="min-h-40 p-4 bg-gray-100 rounded text-gray-700 whitespace-pre-wrap break-words">
        {transcript || "📝 Transcript will appear here..."}
      </div>
    </section>
  );
}