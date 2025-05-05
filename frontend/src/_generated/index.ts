import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

// ---- Service Name: Greeting ----
type GreetingSayHelloOutputType = {
  greeting: string;
};

export function useGreetingSayHelloQuery(args: { name: string }) {
  /*Accepts a name and then returns hello to that name*/
  return useQuery({
    queryKey: ["Greeting", "SayHello"],
    queryFn: async () => {
      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Greeting",
          proc: "SayHello",
          data: args,
        }),
      });

      if (!response.ok) {
        throw new Error("Non ok response");
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as GreetingSayHelloOutputType;
    },
  });
}
//----
