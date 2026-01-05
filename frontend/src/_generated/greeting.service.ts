import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  useWebSocket,
  UseWebSocketReturn,
  UseWebSocketOptions,
} from "./useWebsocket";
import { z } from "zod";

// ---- Service Name: Greeting ----
export const GreetingSayHelloQueryInputSchema = z
  .object({ name: z.record(z.string()) })
  .strict();
export type GreetingSayHelloOutputType = {
  greeting: {
    [x: string]: string;
  };
};

export function useGreetingSayHelloQuery(
  args: z.infer<typeof GreetingSayHelloQueryInputSchema>,
  extraOptions?: Omit<
    UseQueryOptions<
      GreetingSayHelloOutputType,
      Error,
      GreetingSayHelloOutputType,
      Array<string | z.infer<typeof GreetingSayHelloQueryInputSchema>>
    >,
    "queryKey" | "queryFn"
  >,
  headers?: HeadersInit,
) {
  /*Says hello and the name.*/
  return useQuery({
    queryKey: ["Greeting", "SayHello", args],
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

      const targetURL = new URL(
        "/_api/Greeting/SayHello",
        window.location.origin,
      );
      const stringifiedArguments = JSON.stringify(validationResult.data);
      const encodedArguments = encodeURIComponent(stringifiedArguments);
      targetURL.searchParams.set("payload", encodedArguments);

      const response = await fetch(targetURL, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        let backendErrorMessage = "";
        try {
          backendErrorMessage = await response.text();
        } catch {
          backendErrorMessage = "No Error message returned from backen";
        }
        throw new Error(
          "Query: SayHello Non ok response: " + backendErrorMessage,
        );
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as GreetingSayHelloOutputType;
    },
    ...extraOptions,
  });
}

export type GreetingSendMessageOutputType = {
  status: boolean;
};
export const GreetingSendMessageInputSchema = z
  .object({ message: z.string() })
  .strict();
export function useGreetingSendMessageMutation(
  extraOptions?: Omit<
    UseMutationOptions<
      GreetingSendMessageOutputType,
      Error,
      z.infer<typeof GreetingSendMessageInputSchema>,
      unknown
    >,
    "mutationFn"
  >,
  headers?: HeadersInit,
) {
  /*Says hello and the name.*/
  return useMutation({
    ...extraOptions,
    mutationFn: async (
      args: z.infer<typeof GreetingSendMessageInputSchema>,
    ) => {
      const validationResult =
        await GreetingSendMessageInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on validating mutation input ",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api/Greeting/SendMessage", {
        method: "POST",
        body: JSON.stringify(validationResult.data),
        headers: headers,
      });

      if (!response.ok) {
        let backendErrorMessage = "";
        try {
          backendErrorMessage = await response.text();
        } catch {
          backendErrorMessage = "No Error message returned from backen";
        }
        throw new Error(
          "Mutation: SendMessage Non ok response: " + backendErrorMessage,
        );
      }

      const rawResponse = await response.json();

      return rawResponse["data"] as GreetingSendMessageOutputType;
    },
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

  const onErrorRef = useRef(extraOptions?.onError);
  const onCloseRef = useRef(extraOptions?.onClose);

  useEffect(() => {
    onErrorRef.current = extraOptions?.onError;
    onCloseRef.current = extraOptions?.onClose;
  }, [extraOptions]);
  useEffect(() => {
    if (sourceRef.current) {
      return;
    }

    const targetURL = new URL(
      "/_api/Greeting/StreamedName",
      window.location.origin,
    );
    const stringifiedArguments = JSON.stringify(args);
    const encodedArguments = encodeURIComponent(stringifiedArguments);
    targetURL.searchParams.set("payload", encodedArguments);

    const source = new EventSource(targetURL);
    sourceRef.current = source;

    source.addEventListener("open", () => {
      setIsConnected(true);
    });

    source.addEventListener("error", () => {
      if (onErrorRef.current) {
        onErrorRef.current("Failed to connect.");
      }
      setIsConnected(false);
    });

    source.addEventListener("content", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setMessages((prev) => [...prev, data]);
      } catch {
        if (onErrorRef.current) {
          onErrorRef.current("Failed to decode data");
        }
      }
    });

    source.addEventListener("close", () => {
      source.close();
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    });

    return () => {
      source.close();
      sourceRef.current = undefined;
      setIsConnected(false);
    };
  }, [args]);

  return {
    messages,
    isConnected,
  };
}

export const GreetingechoBidirectionalInputSchema = z
  .object({ msg: z.string() })
  .strict();
export type GreetingechoOutputType = {
  msg: string;
};

export function useGreetingechoBidirectional(
  options: UseWebSocketOptions = {},
): UseWebSocketReturn<
  z.infer<typeof GreetingechoBidirectionalInputSchema>,
  GreetingechoOutputType
> {
  /*Echo's back the given message*/

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const targetURL = new URL(
    `${protocol}//${window.location.host}/_api/Greeting/echo`,
  );
  return useWebSocket<
    z.infer<typeof GreetingechoBidirectionalInputSchema>,
    GreetingechoOutputType
  >(targetURL.href, options);
}
//----
