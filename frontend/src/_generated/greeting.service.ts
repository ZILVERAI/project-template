import {useQuery, UseQueryOptions} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {z} from "zod"

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

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Greeting",
          procedure: "SayHello",
          data: validationResult.data,
        }),
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
  active?: boolean = true,
  extraOptions?: {
    onError?: (errorMessage: string) => void;
    onClose?: () => void;
  },
) {
  /*Echo's back the given message*/
  const socketRef = useRef<WebSocket>();
  const [messages, setMessages] = useState<Array<GreetingechoOutputType>>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const onErrorRef = useRef(extraOptions?.onError);
  const onCloseRef = useRef(extraOptions?.onClose);

  useEffect(() => {
    onErrorRef.current = extraOptions?.onError;
    onCloseRef.current = extraOptions?.onClose;
  }, [extraOptions]);

  const send = useCallback(
    (data: z.infer<typeof GreetingechoBidirectionalInputSchema>) => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(JSON.stringify(data));
      }
    },
    [],
  );
  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const targetURL = new URL(`${protocol}//${window.location.host}/_api`);
    const fullPayload = {
      service: "Greeting",
      procedure: "echo",
    };
    const stringifiedArguments = JSON.stringify(fullPayload);
    const encodedArguments = encodeURIComponent(stringifiedArguments);
    targetURL.searchParams.set("payload", encodedArguments);

    const socket = new WebSocket(targetURL);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setIsConnected(true);
    });

    socket.addEventListener("error", () => {
      if (onErrorRef.current) {
        onErrorRef.current("WebSocket connection error.");
      }
      setIsConnected(false);
    });

    socket.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setMessages((prev) => [...prev, data]);
      } catch {
        if (onErrorRef.current) {
          onErrorRef.current("Failed to decode data");
        }
      }
    });

    socket.addEventListener("close", () => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
      setIsConnected(false);
    });

    return () => {
      socket.close();
      socketRef.current = undefined;
      setIsConnected(false);
    };
  }, [active]);

  return {
    messages,
    isConnected,
    send,
  };
}
//----