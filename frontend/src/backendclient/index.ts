import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "backend/src/router";

export const trpc = createTRPCReact<AppRouter>();
// const trpcClient = trpc.createClient({
// 	links: [
// 		httpBatchLink({
// 			url: "/trpc",
// 			// You can pass any HTTP headers you wish here
// 		}),
// 	],
// });

// Create tRPC react hooks
