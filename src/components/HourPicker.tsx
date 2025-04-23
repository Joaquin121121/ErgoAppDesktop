import React, { useState, useRef, useEffect } from "react";
import inputStyles from "../styles/inputStyles.module.css";

interface HourPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

const HourPicker: React.FC<HourPickerProps> = ({
  value,
  onChange,
  error = "",
  className = "",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate time options in 30-minute intervals
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      timeOptions.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  const localOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const inputEvent = event.nativeEvent as InputEvent;

    // 1. Basic format validation and character type check
    if (newValue.length > 5) {
      return; // Max length is 5 (HH:MM)
    }

    const characterArray = newValue.split("");
    for (let i = 0; i < characterArray.length; i++) {
      if (i === 2) {
        // Allow only ':' at the third position
        if (characterArray[i] !== ":") {
          return;
        }
      } else {
        // Allow only digits elsewhere
        if (isNaN(Number(characterArray[i]))) {
          return;
        }
      }
    }

    // 2. Hours and Minutes validation
    if (newValue.length >= 2) {
      const hours = parseInt(newValue.substring(0, 2), 10);
      if (isNaN(hours) || hours < 0 || hours > 23) {
        return; // Invalid hours
      }
    }
    if (newValue.length === 5) {
      const minutes = parseInt(newValue.substring(3, 5), 10);
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        return; // Invalid minutes
      }
    }

    // 3. Auto-add colon after two digits (if not deleting)
    if (
      value.length === 1 && // Previous value length
      newValue.length === 2 &&
      inputEvent.inputType !== "deleteContentBackward"
    ) {
      onChange(`${newValue}:`);
    } else {
      onChange(newValue);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const selectTime = (time: string) => {
    onChange(time);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-40">
      <div
        className={`${
          inputStyles.input
        } h-10 rounded-2xl bg-offWhite shadow-sm flex items-center px-4 ${
          focused && inputStyles.focused
        } ${error && inputStyles.focused} ${className}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => localOnChange(e)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onClick={() => setShowDropdown(true)}
          className="w-full h-full focus:outline-none bg-offWhite text-tertiary pr-2"
          placeholder="HH:MM"
        />
        <img
          src="/clock.png"
          className="h-6 w-6 cursor-pointer hover:opacity-70 active:opacity-40 absolute right-2 top-1/2 -translate-y-1/2"
          onClick={toggleDropdown}
          alt="Clock icon"
        />
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute w-full mt-2 bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
        >
          {timeOptions.map((time, index) => (
            <div
              key={index}
              className={`px-4 py-2 cursor-pointer ${
                time === value
                  ? "bg-lightRed text-secondary"
                  : "text-tertiary hover:bg-lightRed hover:text-secondary"
              }`}
              onClick={() => selectTime(time)}
            >
              {time}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HourPicker;
