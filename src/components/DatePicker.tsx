import { formatDateString } from "../utils/utils";
import { useRef } from "react";
import inputStyles from "../styles/inputStyles.module.css";

function DatePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDisplayDate = (date: Date) => {
    return formatDateString(date);
  };

  const formatInputDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  const handleIconClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix timezone issues by creating a date string with the time set to noon
    // This ensures the date doesn't shift due to timezone conversions
    const dateString = `${e.target.value}T12:00:00`;
    const newDate = new Date(dateString);
    onChange(newDate);
  };

  return (
    <div className="flex items-center gap-x-4">
      <div
        className={`${inputStyles.input} bg-offWhite rounded-xl shadow-sm px-3 h-8 flex items-center text-tertiary`}
      >
        <span>{formatDisplayDate(value)}</span>
        <input
          ref={dateInputRef}
          type="date"
          value={formatInputDate(value)}
          onChange={handleChange}
          className="sr-only"
        />
        <img
          src="/calendar.png"
          alt="Calendar"
          className="ml-2 h-6 w-6 cursor-pointer hover:opacity-70"
          onClick={handleIconClick}
        />
      </div>
    </div>
  );
}

export default DatePicker;
