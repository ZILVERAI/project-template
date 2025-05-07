import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// Create a client
const queryClient = new QueryClient();

function App() {
  // IMPORTANT: Do NOT use query/mutation hooks in this component since they are not in within the query client provider, doing so WILL RESULT IN ERROR
  return (
    <QueryClientProvider client={queryClient}>
      <ExampleComponent />
    </QueryClientProvider>
  );
}

function ExampleComponent() {
  return (
    <div className="text-black flex flex-col">
      Hello world from ZILVER<Button>This is crazy</Button>
    </div>
  );
}

export default App;
