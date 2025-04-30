import { getHelloWorld } from "./utils/api";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExampleComponent />
    </QueryClientProvider>
  );
}

function ExampleComponent() {
  const helloWorld = useQuery({
    queryFn: getHelloWorld,
  });
  return (
    <div className="text-black flex flex-col">
      Hello world from ZILVER: {helloWorld.data || "not fetched"}
    </div>
  );
}

export default App;
