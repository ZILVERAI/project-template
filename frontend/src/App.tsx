import { useEffect, useState } from "react";
import { getHelloWorld } from "./utils/api";

function App() {
  const [t, setT] = useState<string>("");
  useEffect(() => {
    void (async function () {
      const res = await getHelloWorld();
      setT(res);
    })();
  }, []);

  return (
    <div className="text-black flex flex-col">Hello world from ZILVER: {t}</div>
  );
}

export default App;
