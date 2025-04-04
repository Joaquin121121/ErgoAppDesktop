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
} from "date-fns";
import { es } from "date-fns/locale";
import CalendarEvent from "./CalendarEvent";

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
  onClick: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  locale = es,
  className = "",
  events,
  onClick,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [translateX, setTranslateX] = useState("0%");
  const gridRef = useRef<HTMLDivElement>(null);

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
  }, [currentDate]); // Re-run effect when currentDate changes

  // Generate calendar days based on a date
  const generateDays = (date: Date) => {
    // Get the start of the current week
    const startDateOfView = startOfWeek(startOfDay(date), { locale });
    const days = [];
    for (let i = 0; i < 14; i++) {
      days.push(addDays(startDateOfView, i));
    }
    return days;
  };

  // Current days
  const currentDays = generateDays(currentDate);

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
    // Slide current grid out to right
    setTranslateX("100%");
    setTimeout(() => {
      setCurrentDate(subDays(currentDate, 14));
      if (gridRef.current) {
        gridRef.current.style.transition = "none";
        gridRef.current.style.transform = "translateX(-100%)";
        // Force reflow
        gridRef.current.getBoundingClientRect();
        gridRef.current.style.transition = "transform 0.3s ease-out";
      }
      setTimeout(() => {
        setTranslateX("0%");
      }, 50);
    }, 100);
  };

  // Navigate to the next two weeks
  const goToNext = () => {
    // Slide current grid out to left
    setTranslateX("-100%");
    setTimeout(() => {
      setCurrentDate(addDays(currentDate, 14));
      if (gridRef.current) {
        gridRef.current.style.transition = "none";
        gridRef.current.style.transform = "translateX(100%)";
        // Force reflow
        gridRef.current.getBoundingClientRect();
        gridRef.current.style.transition = "transform 0.3s ease-out";
      }
      setTimeout(() => {
        setTranslateX("0%");
      }, 50);
    }, 100);
  };

  // Map of day indices to day names
  const dayOfWeekNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
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
      <div className="overflow-hidden">
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

            return (
              <div
                key={index}
                className={`min-h-[150px] flex flex-col gap-y-1 border border-gray p-2 ${
                  isCurrentDay ? "bg-blue-50" : ""
                }`}
              >
                <div className="text-secondary font-normal text-left">
                  {dayNumber}
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
                          onClick(day);
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
          className="hover:opacity-70 active:opacity-50 focus:outline-none"
          aria-label="Previous two weeks"
        >
          <img src="/back.png" className="w-7 h-7" alt="Previous" />
        </button>
        <div className="text-darkGray w-60 text-center">{footerText}</div>
        <button
          onClick={goToNext}
          className="hover:opacity-70 active:opacity-50 focus:outline-none"
          aria-label="Next two weeks"
        >
          <img src="/nextRed.png" className="w-7 h-7" alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default Calendar;
