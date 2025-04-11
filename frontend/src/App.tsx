import { useEffect, useState } from "react";
import RandomColorTriangle from "./triangles";
import { trpc } from "./backendclient";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const [queryClient] = useState(new QueryClient());
  const [trpcClient] = useState(
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "http://localhost:3000/trpc",
          // You can pass any HTTP headers you wish here
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div className="text-black flex flex-col">Hello world from ZILVER</div>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
