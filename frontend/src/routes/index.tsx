import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

const sampleSchema = z.object({
  message: z.string(),
});

function Index() {
  const [msg, setMsg] = useState<string | undefined>(undefined);
  const form = useForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onChange: sampleSchema,
    },
    onSubmit: ({ value }) => {
      setMsg(value.message);
    },
  });

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      {msg && <h3>{msg}</h3>}
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
