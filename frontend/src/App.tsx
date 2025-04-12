import { client } from "@/utils/trpc";
import { useEffect, useState } from "react";

function App() {
  const [t, setT] = useState<string>("");
  useEffect(() => {
    void (async function () {
      const res = await client.hello.query();
      setT(res);
    })();
  }, []);

  return (
    <div className="text-black flex flex-col">Hello world from ZILVER: {t}</div>
  );
}

export default App;
