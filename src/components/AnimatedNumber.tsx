import React from 'react';
import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ 
  value, 
  prefix = '', 
  className = '',
  duration = 500 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue === value) return;

    setIsAnimating(true);
    const startValue = displayValue;
    const difference = value - startValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + difference * easeOut;
      
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formattedValue = new Intl.NumberFormat('en-IN').format(displayValue);

  return (
    <span className={`${className} ${isAnimating ? 'animate-number-pop' : ''}`}>
      {prefix}{formattedValue}
    </span>
  );
}
