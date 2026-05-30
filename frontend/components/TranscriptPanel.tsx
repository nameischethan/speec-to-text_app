type TranscriptPanelProps = {
  transcript: string;
};

export default function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  return (
    <div className="p-4 border rounded-lg mt-4">
      <h2 className="text-xl font-semibold mb-4">
        Live Transcript
      </h2>

      <div className="min-h-40 p-4 bg-gray-100 rounded text-gray-700">
        {transcript || "Transcript will appear here..."}
      </div>
    </div>
  );
}