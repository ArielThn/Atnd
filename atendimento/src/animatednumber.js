// frontend/src/templates-folder/animatednumber.js
import React, { useEffect, useState } from 'react';

function AnimatedNumber({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseInt(value, 10);
    if (count === end) return;

    const totalDuration = 1000; // 1 segundo
    const frameRate = 60; // frames por segundo
    const totalFrames = (totalDuration / 1000) * frameRate;
    const increment = end / totalFrames;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        clearInterval(timer);
        setCount(end); // Garante que termine no valor exato
      } else {
        setCount(Math.floor(current));
      }
    }, 1000 / frameRate);

    return () => clearInterval(timer);
  }, [value, count]);

  return <span>{count}</span>;
}

export default AnimatedNumber;
