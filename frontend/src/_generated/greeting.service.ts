import {useQuery, UseQueryOptions} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {z} from "zod"

// ---- Service Name: Greeting ----
export const GreetingSayHelloQueryInputSchema = z
  .object({ name: z.string() })
  .strict();
export type GreetingSayHelloOutputType = {
  greeting: string;
};

export function useGreetingSayHelloQuery(
  args: z.infer<typeof GreetingSayHelloQueryInputSchema>,
  extraOptions?: Omit<
    UseQueryOptions<
      GreetingSayHelloOutputType,
      Error,
      GreetingSayHelloOutputType,
      Array<string>
    >,
    "queryKey" | "queryFn"
  >,
) {
  /*Says hello and the name.*/
  return useQuery({
    queryKey: ["Greeting", "SayHello"],
    queryFn: async () => {
      const validationResult =
        await GreetingSayHelloQueryInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on input validation of SayHello",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Greeting",
          procedure: "SayHello",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Non ok response");
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as GreetingSayHelloOutputType;
    },
    ...extraOptions,
  });
}

export const GreetingStreamedNameSubscriptionInputSchema = z
  .object({ name: z.string() })
  .strict();
export type GreetingStreamedNameOutputType = string;

export function useGreetingStreamedNameSubscription(
  args: z.infer<typeof GreetingStreamedNameSubscriptionInputSchema>,
  extraOptions?: {
    onError?: (errorMessage: string) => void; // Callback that executes when there's an error
    onClose?: () => void; // Callback that executes when the connection has been closed by the server
  },
) {
  /*Streams the given name, letter by letter.*/
  const sourceRef = useRef<EventSource>();
  const [messages, setMessages] = useState<
    Array<GreetingStreamedNameOutputType>
  >([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  useEffect(() => {
    if (
      sourceRef.current &&
      sourceRef.current?.readyState === sourceRef.current?.OPEN
    ) {
      // The connection is already stablished.
    } else {
      const targetURL = new URL("/_api", window.location.origin);
      const fullPayload = {
        service: "Greeting",
        procedure: "StreamedName",
        data: args,
      };
      const stringifiedArguments = JSON.stringify(fullPayload);
      const encodedArguments = encodeURIComponent(stringifiedArguments);
      targetURL.searchParams.set("payload", encodedArguments);

      const source = new EventSource(targetURL);
      sourceRef.current = source;
    }

    const aborter = new AbortController();

    sourceRef.current.addEventListener(
      "open",
      () => {
        setIsConnected(true);
      },
      {
        signal: aborter.signal,
      },
    );

    sourceRef.current.addEventListener(
      "error",
      () => {
        if (extraOptions?.onError) {
          extraOptions.onError("Failed to connect.");
        }
        setIsConnected(false);
        console.warn("No errror handler has been set for the event source");
      },
      {
        signal: aborter.signal,
      },
    );

    sourceRef.current.addEventListener(
      "content",
      (ev) => {
        try {
          const data = JSON.parse(ev.data);
          setMessages((prev) => [...prev, data]);
        } catch {
          if (extraOptions?.onError) {
            extraOptions.onError("Failed to decode data");
          }
        }
      },
      {
        signal: aborter.signal,
      },
    );

    sourceRef.current.addEventListener(
      "close",
      () => {
        sourceRef.current?.close();
        if (extraOptions?.onClose) {
          extraOptions.onClose();
        }
      },
      {
        signal: aborter.signal,
      },
    );

    return () => {
      aborter.abort();
    };
  }, [extraOptions, args]);

  return {
    messages,
    isConnected,
  };
}
//----