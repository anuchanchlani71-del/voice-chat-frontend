import React, { useRef, useEffect } from 'react';

export default function OtpInput({ length = 6, value = '', onChange, isError = false, disabled = false }) {
  const inputRefs = useRef([]);

  // Ensure refs array has right size
  if (inputRefs.current.length !== length) {
    inputRefs.current = Array(length).fill().map((_, i) => inputRefs.current[i] || React.createRef());
  }

  // Split current value into array of characters
  const digits = (value || '').padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    // Focus first empty input or first input on mount
    const firstEmptyIndex = digits.findIndex(d => d === ' ');
    const targetIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : 0;
    if (inputRefs.current[targetIndex] && inputRefs.current[targetIndex].current) {
      inputRefs.current[targetIndex].current.focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const val = e.target.value;
    const digit = val.slice(-1); // Get last typed character

    if (digit && !/^\d$/.test(digit)) {
      return; // Only digits allowed
    }

    const newDigits = [...digits];
    newDigits[index] = digit || ' ';
    const newValue = newDigits.join('').trimEnd();
    onChange(newValue);

    // Auto advance to next input if digit entered
    if (digit && index < length - 1) {
      const nextInput = inputRefs.current[index + 1]?.current;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index] === ' ' || digits[index] === '') {
        // Current is already empty, move to previous and clear it
        if (index > 0) {
          const prevInput = inputRefs.current[index - 1]?.current;
          if (prevInput) {
            prevInput.focus();
            const newDigits = [...digits];
            newDigits[index - 1] = ' ';
            onChange(newDigits.join('').trimEnd());
          }
        }
      } else {
        // Clear current
        const newDigits = [...digits];
        newDigits[index] = ' ';
        onChange(newDigits.join('').trimEnd());
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const cleanNumbers = pastedData.replace(/\D/g, '').slice(0, length);
    if (cleanNumbers) {
      onChange(cleanNumbers);
      const focusIndex = Math.min(cleanNumbers.length, length - 1);
      inputRefs.current[focusIndex]?.current?.focus();
    }
  };

  return (
    <div className="otp-inputs-row">
      {Array.from({ length }).map((_, index) => {
        const char = digits[index] && digits[index] !== ' ' ? digits[index] : '';
        return (
          <input
            key={index}
            ref={inputRefs.current[index]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={char}
            disabled={disabled}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`otp-box ${char ? 'filled' : ''} ${isError ? 'error' : ''}`}
            aria-label={`Digit ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
