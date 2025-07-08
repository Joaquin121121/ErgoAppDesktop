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
import { es, se } from "date-fns/locale";
import CalendarEvent from "./CalendarEvent";
import styles from "../styles/animations.module.css";
import { useBlur } from "../contexts/BlurContext";
import { useCalendar } from "../contexts/CalendarContext";

interface CalendarProps {
  locale?: Locale;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ locale = es, className = "" }) => {
  const {
    selectedDate,
    setSelectedDate,
    addingEvent,
    setAddingEvent,
    eventInfo,
    setEventInfo,
    events,
  } = useCalendar();
  const { isBlurred, setIsBlurred } = useBlur();
  // Reference date for consistent period calculation
  const [referenceDate] = useState<Date>(
    startOfWeek(new Date(), { locale, weekStartsOn: 1 })
  );
  // Period offset from reference date (multiples of 28 days)
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

    // Only add event listener when not adding event and no event info is displayed
    if (!addingEvent && !eventInfo) {
      window.addEventListener("keydown", handleKeyDown);

      // Cleanup function to remove event listener
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }

    return undefined;
  }, [periodOffset, isNavigating, addingEvent, eventInfo]); // Re-run effect when these values change

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
      const newPeriodOffset = Math.floor(days / 28);

      // Update period offset
      setPeriodOffset(newPeriodOffset);
    }
  };

  // Generate calendar days based on period offset
  const generateDays = () => {
    // Calculate the start date for the current period
    const startDateOfView = addDays(referenceDate, periodOffset * 28);
    const days = [];
    for (let i = 0; i < 28; i++) {
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

    // Check if firstDay and lastDay are in different months
    if (
      format(firstDay, "MMMM", { locale }) !==
      format(lastDay, "MMMM", { locale })
    ) {
      return `${format(firstDay, "d", { locale })} de ${format(
        firstDay,
        "MMMM",
        { locale }
      )} - ${format(lastDay, "d")} de ${format(lastDay, "MMMM", { locale })}`;
    }

    return `${format(firstDay, "d", { locale })}-${format(
      lastDay,
      "d"
    )} de ${format(firstDay, "MMMM", { locale })}`;
  };

  // Navigate to the previous four weeks
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

  // Navigate to the next four weeks
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
      className={`w-[70vw] rounded-2xl shadow-sm bg-white overflow-hidden mt-2 ${className}`}
    >
      {/* Calendar header */}
      <div className="bg-red-200 text-red-600 py-4 px-2 text-center text-2xl rounded-t-lg">
        {headerText}
        {currentDays[0] &&
        new Date().getFullYear() !== currentDays[0].getFullYear()
          ? ` (${format(currentDays[0], "yyyy")})`
          : ""}
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
          className="grid grid-cols-7 grid-rows-4"
          style={{
            transform: `translateX(${translateX})`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {currentDays.map((day, index) => {
            const dayNumber = format(day, "d");
            const isCurrentDay = isToday(day);
            const isPastDay = isPast(day) && !isToday(day);
            const eventsForDay = events.filter((event) =>
              isSameDay(new Date(event.date), day)
            );
            return (
              <div
                key={index}
                className={`h-[130px] flex flex-col gap-y-1 border border-gray p-2 hover:border-lightRed  hover:cursor-pointer ${
                  isPastDay ? "bg-offWhite" : ""
                }`}
                onMouseEnter={() => {
                  setHoveredElementIndex(index);
                }}
                style={{
                  borderColor: isSameDay(selectedDate, day) ? "#FFC1C1" : "",
                }}
                onClick={() => {
                  setSelectedDate(day);
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
                  {hoveredElementIndex === index && !isPastDay && (
                    <div
                      className={`w-1/5 flex justify-center hover:cursor-pointer hover:scale-105 active:scale-95 active:opacity-50 transition-all duration-300 ease-in-out ${styles.fadeIn}`}
                      onClick={() => {
                        setSelectedDate(day);
                        setAddingEvent(true);
                        setIsBlurred(true);
                      }}
                    >
                      <img src="/addRed.png" alt="" className={`w-5 h-5  `} />
                    </div>
                  )}
                </div>
                {eventsForDay.map((event, eventIndex) => {
                  if (eventIndex > 2) return null;
                  if (eventIndex === 2) {
                    return (
                      <p className="self-center text-secondary text-sm">
                        +{eventsForDay.length - 2} más
                      </p>
                    );
                  }
                  return (
                    <CalendarEvent
                      key={eventIndex}
                      eventType={event.eventType}
                      eventName={event.name}
                      onClick={() => {
                        setSelectedDate(day);
                        setEventInfo(event);
                        setIsBlurred(true);
                      }}
                    />
                  );
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
          className={`hover:opacity-70 hover:scale-105 active:scale-95 active:opacity-50 hover:cursor-pointer active:outline-none transition-all duration-300 ease-in-out ${
            isNavigating ? "cursor-not-allowed" : ""
          }`}
          aria-label="Previous four weeks"
        >
          <img src="/back.png" className="w-7 h-7" alt="Previous" />
        </button>
        <div className="w-80 relative">
          <p className="text-darkGray text-center">{footerText}</p>
          <div className="flex justify-center items-center">
            <img
              onClick={togglePicker}
              src="/calendar.png"
              alt="Calendar"
              className="h-8 w-8 mt-2 mx-auto hover:opacity-70 hover:cursor-pointer hover:scale-105 active:scale-95 active:opacity-50 transition-all duration-300 ease-in-out z-10"
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
          className={`hover:opacity-70 hover:scale-105 active:scale-95 active:opacity-50 hover:cursor-pointer active:outline-none transition-all duration-300 ease-in-out ${
            isNavigating ? "cursor-not-allowed" : ""
          }`}
          aria-label="Next four weeks"
        >
          <img src="/nextRed.png" className="w-7 h-7" alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default Calendar;
