export default function RecorderPanel() {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">
        Recorder
      </h2>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-green-500 text-white rounded">
          Start Recording
        </button>

        <button className="px-4 py-2 bg-red-500 text-white rounded">
          Stop Recording
        </button>
      </div>
    </div>
  );
}