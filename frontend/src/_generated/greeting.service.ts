import {useQuery, UseQueryOptions} from "@tanstack/react-query";
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
//----