import React, { useState, useRef, useEffect } from "react";
import {
  format,
  addDays,
  startOfDay,
  isToday,
  subDays,
  Locale,
  isSameDay,
  startOfWeek,
  getDay,
  differenceInDays,
  isPast,
} from "date-fns";
import { es } from "date-fns/locale";
import CalendarEvent from "./CalendarEvent";
import styles from "../styles/animations.module.css";
import AddEventModal from "./AddEventModal";

export interface CalendarEvent {
  eventType: "competition" | "trainingSession" | "testSession";
  eventName: string;
  athleteName: string;
  eventDate: Date;
  duration: number;
}

interface CalendarProps {
  locale?: Locale;
  className?: string;
  events: CalendarEvent[];
  setSelectedDate: (date: Date) => void;
  setTargetDate: (date: Date) => void;
  setAddingEvent: (addingEvent: boolean) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  locale = es,
  className = "",
  events,
  setSelectedDate,
  setTargetDate,
  setAddingEvent,
}) => {
  // Reference date for consistent period calculation
  const [referenceDate] = useState<Date>(
    startOfWeek(new Date(), { locale, weekStartsOn: 1 })
  );
  // Period offset from reference date (multiples of 14 days)
  const [periodOffset, setPeriodOffset] = useState<number>(0);
  const [hoveredElementIndex, setHoveredElementIndex] = useState<number | null>(
    null
  );
  const [translateX, setTranslateX] = useState("0%");
  const [isNavigating, setIsNavigating] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        goToNext();
      } else if (event.key === "ArrowLeft") {
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [periodOffset, isNavigating]); // Re-run effect when periodOffset or isNavigating changes

  // Show date picker directly when the calendar icon is clicked
  const togglePicker = () => {
    if (datePickerRef.current) {
      datePickerRef.current.showPicker();
    }
  };

  // Handle date selection from the picker
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const selectedDate = new Date(e.target.value);

      // Calculate which period this date belongs to relative to reference date
      const days = differenceInDays(selectedDate, referenceDate) + 1;
      // Integer division to get period number
      const newPeriodOffset = Math.floor(days / 14);

      // Update period offset
      setPeriodOffset(newPeriodOffset);
    }
  };

  // Generate calendar days based on period offset
  const generateDays = () => {
    // Calculate the start date for the current period
    const startDateOfView = addDays(referenceDate, periodOffset * 14);
    const days = [];
    for (let i = 0; i < 14; i++) {
      days.push(addDays(startDateOfView, i));
    }
    return days;
  };

  // Current days
  const currentDays = generateDays();

  // Get month name and range for the header
  const getHeaderText = (days: Date[]) => {
    if (!days.length) return "";

    const firstDay = days[0];
    const lastDay = days[days.length - 1];

    // Helper function to capitalize first letter
    const capitalizeMonth = (date: Date) => {
      const month = format(date, "MMMM", { locale });
      return month.charAt(0).toUpperCase() + month.slice(1);
    };

    // If all days are in the same month
    if (
      format(firstDay, "MMMM", { locale }) ===
      format(lastDay, "MMMM", { locale })
    ) {
      return `${format(firstDay, "d")} - ${format(
        lastDay,
        "d"
      )} de ${capitalizeMonth(firstDay)}`;
    }

    // If days span across two months
    return `${format(firstDay, "d")} de ${capitalizeMonth(firstDay)} - ${format(
      lastDay,
      "d"
    )} de ${capitalizeMonth(lastDay)}`;
  };

  const getFooterText = (days: Date[]) => {
    if (!days.length) return "";

    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    return `${format(firstDay, "d", { locale })}-${format(
      lastDay,
      "d"
    )} de ${format(firstDay, "MMMM", { locale })}`;
  };

  // Navigate to the previous two weeks
  const goToPrevious = () => {
    // Prevent multiple rapid navigations
    if (isNavigating) return;

    setIsNavigating(true);
    // Slide current grid out to right
    setTranslateX("100%");
    setTimeout(() => {
      setPeriodOffset(periodOffset - 1);
      if (gridRef.current) {
        gridRef.current.style.transition = "none";
        gridRef.current.style.transform = "translateX(-100%)";
        // Force reflow
        gridRef.current.getBoundingClientRect();
        gridRef.current.style.transition = "transform 0.3s ease-out";
      }
      setTimeout(() => {
        setTranslateX("0%");
        // Reset navigation lock after animation completes
        setTimeout(() => {
          setIsNavigating(false);
        }, 300);
      }, 50);
    }, 100);
  };

  // Navigate to the next two weeks
  const goToNext = () => {
    // Prevent multiple rapid navigations
    if (isNavigating) return;

    setIsNavigating(true);
    // Slide current grid out to left
    setTranslateX("-100%");
    setTimeout(() => {
      setPeriodOffset(periodOffset + 1);
      if (gridRef.current) {
        gridRef.current.style.transition = "none";
        gridRef.current.style.transform = "translateX(100%)";
        // Force reflow
        gridRef.current.getBoundingClientRect();
        gridRef.current.style.transition = "transform 0.3s ease-out";
      }
      setTimeout(() => {
        setTranslateX("0%");
        // Reset navigation lock after animation completes
        setTimeout(() => {
          setIsNavigating(false);
        }, 300);
      }, 50);
    }, 100);
  };

  // Map of day indices to day names - rearranged to have Monday first
  const dayOfWeekNames = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const headerText =
    getHeaderText(currentDays).charAt(0).toUpperCase() +
    getHeaderText(currentDays).slice(1);
  const footerText = getFooterText(currentDays);

  return (
    <div
      className={`w-[70vw] rounded-2xl shadow-sm bg-white overflow-hidden ${className}`}
    >
      {/* Calendar header */}
      <div className="bg-red-200 text-red-600 py-4 px-2 text-center text-2xl rounded-t-lg">
        {headerText}
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 text-center py-2">
        {dayOfWeekNames.map((dayName, index) => (
          <div key={index} className="text-darkGray text-lg my-2">
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid with carousel transition */}
      <div
        className="overflow-hidden"
        onMouseLeave={() => {
          setHoveredElementIndex(null);
        }}
      >
        <div
          ref={gridRef}
          className="grid grid-cols-7 grid-rows-2"
          style={{
            transform: `translateX(${translateX})`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {currentDays.map((day, index) => {
            const dayNumber = format(day, "d");
            const isCurrentDay = isToday(day);
            const isPastDay = isPast(day) && !isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[150px] flex flex-col gap-y-1 border border-gray p-2 ${
                  isPastDay ? "bg-offWhite" : ""
                }`}
                onMouseEnter={() => {
                  setHoveredElementIndex(index);
                }}
              >
                <div
                  className="flex items-center"
                  style={{
                    justifyContent:
                      hoveredElementIndex === index && "space-between",
                  }}
                >
                  <p className="text-secondary font-normal text-left">
                    {dayNumber}
                    {isCurrentDay && " - Hoy"}
                  </p>
                  {hoveredElementIndex === index && (
                    <img
                      onClick={() => {
                        setTargetDate(day);
                        setAddingEvent(true);
                      }}
                      src="/addRed.png"
                      alt=""
                      className={`w-5 h-5 self-end hover:cursor-pointer hover:opacity-70 active:opacity-40 ${styles.fadeIn}`}
                    />
                  )}
                </div>
                {events.map((event, eventIndex) => {
                  const eventDate =
                    typeof event.eventDate === "string"
                      ? new Date(event.eventDate)
                      : event.eventDate;
                  if (isSameDay(eventDate, day)) {
                    return (
                      <CalendarEvent
                        key={eventIndex}
                        {...event}
                        onClick={() => {
                          setSelectedDate(day);
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar footer with navigation */}
      <div className="flex justify-center items-center py-4 gap-4">
        <button
          onClick={goToPrevious}
          disabled={isNavigating}
          className={`hover:opacity-70 active:opacity-50 focus:outline-none ${
            isNavigating ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label="Previous two weeks"
        >
          <img src="/back.png" className="w-7 h-7" alt="Previous" />
        </button>
        <div className="w-60 relative">
          <p className="text-darkGray text-center">{footerText}</p>
          <div className="flex justify-center items-center">
            <img
              onClick={togglePicker}
              src="/calendar.png"
              alt="Calendar"
              className="h-8 w-8 mt-2 mx-auto hover:opacity-70 hover:cursor-pointer active:opacity-40 z-10"
            />
            <input
              ref={datePickerRef}
              type="date"
              onChange={handleDateChange}
              className="opacity-0 absolute w-8 h-8"
            />
          </div>
        </div>
        <button
          onClick={goToNext}
          disabled={isNavigating}
          className={`hover:opacity-70 active:opacity-50 focus:outline-none ${
            isNavigating ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label="Next two weeks"
        >
          <img src="/nextRed.png" className="w-7 h-7" alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default Calendar;
