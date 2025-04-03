import { useEffect, useState } from "react";
import RandomColorTriangle from "./triangles";

const RandomColorSquare = () => {
  const [color, setColor] = useState("#000000");

  // Generate a random color on component mount
  useEffect(() => {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    setColor(randomColor);
  }, []);

  return <div className="w-10 h-10" style={{ backgroundColor: color }} />;
};

function App() {
  return (
    <div className="text-black flex flex-col">
      Hello world from ZILVER
      <div className="flex flex-row">
        <div>
          {new Array(50).fill(0).map(() => (
            <RandomColorSquare />
          ))}
        </div>
        ------
        <div>
          {new Array(50).fill(0).map(() => (
            <RandomColorSquare />
          ))}
        </div>
      </div>
      <div>
        {new Array(50).fill(0).map(() => {
          return <RandomColorTriangle />;
        })}
      </div>
    </div>
  );
}

export default App;
