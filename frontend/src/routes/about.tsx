import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGreetingStreamedNameSubscription } from "@/_generated/greeting.service";

export const Route = createFileRoute("/about")({
  component: About,
});

function StreamedGreeting({ name }: { name: string }) {
  const { messages, isConnected } = useGreetingStreamedNameSubscription(
    { name },
    {
      onError: (error) => console.error("Streaming error:", error),
    }
  );

  return (
    <div className="mt-2">
      <span className="text-xs">{isConnected ? "🟢" : "⚪"}</span>
      <span className="ml-2 font-mono">{messages.join("")}</span>
    </div>
  );
}

function About() {
  const [nameToStream, setNameToStream] = useState("");
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  return (
    <div className="p-2">
      <h3>About Page - Streamed Greeting Demo</h3>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={nameToStream}
          onChange={(e) => setNameToStream(e.target.value)}
          placeholder="Enter a name to stream"
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={() => setSubmittedName(nameToStream)}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Stream
        </button>
      </div>
      {submittedName && <StreamedGreeting name={submittedName} />}
    </div>
  );
}
