import { useGreetingStreamedNameSubscription } from "@/_generated/greeting.service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { messages } = useGreetingStreamedNameSubscription(
    {
      name: "Fabrizio",
    },
    {
      onError: (msg) => {
        console.error(msg);
      },
    },
  );
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      {messages.map((m) => {
        return <h1>{m}</h1>;
      })}
    </div>
  );
}
