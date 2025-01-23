import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import { init } from "i18next";
import { set } from "react-hook-form";

interface AutocompleteDropdownProps<T> {
  data: T[];
  onSelect?: (value: T[keyof T] | T) => void;
  placeholder?: string;
  displayKey?: keyof T;
  valueKey?: keyof T;
  className?: string;
  initialQuery?: string;
  disabled: boolean;
  reset: boolean;
  setReset: (reset: boolean) => void;
  error: string;
  setError: (error: string) => void;
}

const AutocompleteDropdown = <T extends string | Record<string, any>>({
  data = [],
  onSelect,
  placeholder = "Seleccione un item",
  displayKey = null,
  valueKey = null,
  className = "",
  initialQuery = "",
  disabled = false,
  reset = false,
  setReset = (boolean) => {},
  error = "",
  setError = (error: string) => {},
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  // Get display value for an item
  const getDisplayValue = (item) => {
    if (displayKey && typeof item === "object") {
      return item[displayKey];
    }
    return item;
  };

  // Get value for an item
  const getValue = (item) => {
    if (valueKey && typeof item === "object") {
      return item[valueKey];
    }
    return item;
  };

  // Filter items based on input
  useEffect(() => {
    const filtered = data.filter((item) => {
      const displayValue = getDisplayValue(item);
      return displayValue.toLowerCase().includes(query.toLowerCase());
    });
    setFilteredItems(filtered);
    setSelectedIndex(-1); // Reset selection when filter changes
  }, [query, data, displayKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (reset) {
      setQuery("");
      setReset(false);
      setSelectedIndex(-1);
    }
  }, [reset]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const listItems = listRef.current.children;
      if (listItems[selectedIndex]) {
        listItems[selectedIndex].scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item) => {
    setError("");
    setQuery(getDisplayValue(item));
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onSelect) onSelect(getValue(item));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
    }

    if (filteredItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(filteredItems[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <div
      className={`relative w-[440px] shadow-sm ${className}`}
      ref={dropdownRef}
    >
      <div className="relative flex flex-row items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-80 p-2 rounded-2xl bg-offWhite pr-10 ${
            inputStyles.input
          } ${error && inputStyles.focused}`}
          disabled={disabled}
        />
        {!disabled && (
          <img
            src="/arrowDown.png"
            className="absolute left-72 top-1.5 h-8 w-8 cursor-pointer"
            alt=""
            onClick={() => setIsOpen(!isOpen)}
          />
        )}
        {query.length > 0 && (
          <div
            className="ml-4 hover:opacity-70 transition-all duration-200 h-7 w-7 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={() => {
              setReset(true);
            }}
          >
            <img src="/close.png" className="h-5 w-5" alt="" />
          </div>
        )}
      </div>

      {isOpen && filteredItems.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white rounded-2xl shadow-sm"
        >
          {filteredItems.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className={`px-4 py-2 cursor-pointer transition-colors duration-150 rounded-2xl ${
                index === selectedIndex
                  ? "bg-lightRed text-secondary"
                  : "hover:bg-lightRed hover:text-secondary"
              }`}
            >
              {getDisplayValue(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteDropdown;
