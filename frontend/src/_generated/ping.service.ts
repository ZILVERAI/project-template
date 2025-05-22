import {useQuery, UseQueryOptions} from "@tanstack/react-query";
import {z} from "zod"

// ---- Service Name: Ping ----
export const PingPingRequestQueryInputSchema = z.object({}).strict();
export type PingPingRequestOutputType = "pong";

export function usePingPingRequestQuery(
  args: z.infer<typeof PingPingRequestQueryInputSchema>,
  extraOptions?: Omit<
    UseQueryOptions<
      PingPingRequestOutputType,
      Error,
      PingPingRequestOutputType,
      Array<string>
    >,
    "queryKey" | "queryFn"
  >,
) {
  /*Responds with pong.*/
  return useQuery({
    queryKey: ["Ping", "PingRequest"],
    queryFn: async () => {
      const validationResult =
        await PingPingRequestQueryInputSchema.safeParseAsync(args);
      if (validationResult.error) {
        console.error(
          "Error on input validation of PingRequest",
          validationResult.error,
        );
        throw new Error(validationResult.error.message);
      }

      const response = await fetch("/_api", {
        method: "POST",
        body: JSON.stringify({
          service: "Ping",
          procedure: "PingRequest",
          data: validationResult.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Non ok response");
      }

      const rawResponse = await response.json();
      return rawResponse["data"] as PingPingRequestOutputType;
    },
    ...extraOptions,
  });
}
//----