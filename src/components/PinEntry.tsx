import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function PinEntry() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login } = useAuth();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    // Move to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 3) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        handleSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d{1,4}$/.test(pastedData)) {
      const newPin = [...pin];
      pastedData.split('').forEach((digit, i) => {
        if (i < 4) newPin[i] = digit;
      });
      setPin(newPin);
      
      if (pastedData.length === 4) {
        handleSubmit(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleSubmit = async (fullPin: string) => {
    const result = await login(fullPin);
    if (!result.success) {
      setError(result.error || 'Invalid PIN');
      setIsShaking(true);
      setPin(['', '', '', '']);
      setTimeout(() => {
        setIsShaking(false);
        inputRefs.current[0]?.focus();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Greeting */}
        <div className="text-center mb-12">
          <p className="text-muted-foreground text-lg mb-2">
            Ella unnaru chitti garu? 🙏
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Enter PIN to continue
          </h1>
        </div>

        {/* PIN Input */}
        <div 
          className={`flex justify-center gap-3 mb-8 ${isShaking ? 'animate-shake' : ''}`}
          style={{
            animation: isShaking ? 'shake 0.5s ease-in-out' : 'none',
          }}
        >
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="pin-input"
              aria-label={`PIN digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-expense/10 border-2 border-expense rounded-lg p-4 animate-scale-in">
            <p className="text-expense font-bold text-center text-lg">
              {error}
            </p>
          </div>
        )}

        {/* Hint */}
        <p className="text-center text-muted-foreground text-sm mt-8">
          Enter your 4-digit PIN to access the app
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
