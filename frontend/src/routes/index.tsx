import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useState } from "react";
import {
  GreetingechoOutputType,
  useGreetingechoBidirectional,
  useGreetingStreamedNameSubscription,
} from "@/_generated/greeting.service";

export const Route = createFileRoute("/")({
  component: Index,
});

const sampleSchema = z.object({
  message: z.string(),
});

function StreamedName({ name }: { name: string }) {
  const { messages, isConnected } = useGreetingStreamedNameSubscription(
    { name },
    {
      onError: (error) => console.error("Stream error:", error),
      onClose: () => console.log("Stream closed"),
    },
  );

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        {isConnected ? "Connected" : "Disconnected"}
      </p>
      <p className="text-lg font-mono">{messages.join("")}</p>
    </div>
  );
}

function BidirectionalDemo({
  messages,
}: {
  messages: Array<GreetingechoOutputType>;
}) {
  return (
    <div className="mt-4">
      BidirectionalDemo
      {messages.map((m) => {
        return <p className="text-lg font-mono">{m.msg}</p>;
      })}
    </div>
  );
}

function Index() {
  const [msg, setMsg] = useState<string | undefined>(undefined);
  const echoConnection = useGreetingechoBidirectional();
  const form = useForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onChange: sampleSchema,
    },
    onSubmit: ({ value }) => {
      setMsg(value.message);
      echoConnection.send({
        msg: value.message,
      });
    },
  });

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      {msg && <StreamedName name={msg} />}
      <BidirectionalDemo messages={echoConnection.messages} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="message"
          children={(field) => {
            return (
              <>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </>
            );
          }}
        />
        <Button type="submit">Go</Button>
      </form>
    </div>
  );
}
