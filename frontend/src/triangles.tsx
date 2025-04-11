import { useState, useEffect } from "react";

const RandomColorTriangle = () => {
  const [color, setColor] = useState("#000000");

  // Generate a random color on initial render
  useEffect(() => {
    generateRandomColor();
  }, []);

  // Function to generate a random hex color
  const generateRandomColor = () => {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    setColor(randomColor);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "20px solid transparent",
          borderRight: "20px solid transparent",
          borderBottom: `40px solid ${color}`,
        }}
      />
    </div>
  );
};

export default RandomColorTriangle;
