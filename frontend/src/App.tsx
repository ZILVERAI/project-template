import { useEffect, useState } from "react";
import { getHelloWorld, getSocket } from "./utils/api";

function App() {
  const [t, setT] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  useEffect(() => {
    void (async function () {
      const res = await getHelloWorld();
      setT(res);
    })();

    // Getting socket.
    const socket = getSocket();
    socket.on("connect", () => {
      setConnected(true);
    });
    socket.on("disconnect", () => {
      setConnected(false);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="text-black flex flex-col">
      Hello world from ZILVER: {t}, socket is{" "}
      {connected ? "connected" : "disconnected"}
    </div>
  );
}

export default App;
