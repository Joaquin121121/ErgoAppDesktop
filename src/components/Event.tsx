import React from "react";
import { CalendarEvent } from "./Calendar";
import { formatMinutesToHoursAndMinutes } from "../utils/utils";
import { isToday } from "date-fns";
import { isTomorrow } from "date-fns";
import { useBlur } from "../contexts/BlurContext";

function Event({
  event,
  selectedDate,
  index,
  setEventInfo,
}: {
  event: CalendarEvent;
  selectedDate: Date;
  index: number;
  setEventInfo: (eventInfo: CalendarEvent | null) => void;
}) {
  const { isBlurred, setIsBlurred } = useBlur();
  const displayName =
    event.event_name.length > 18
      ? `${event.event_name.substring(0, 15)}...`
      : event.event_name;

  return (
    <div
      className=" hover:cursor-pointer hover:scale-105 active:scale-95 active:opacity-40 transition-all duration-300 ease-in-out"
      onClick={() => {
        setEventInfo(event);
        setIsBlurred(true);
      }}
    >
      {index === 0 && (
        <div className="relative min-w-[16vw] rounded-t-2xl bg-lightRed text-secondary flex justify-center items-center text-xl py-2 font-medium -mb-2 z-50">
          {isToday(selectedDate)
            ? "Hoy"
            : isTomorrow(selectedDate)
            ? "Mañana"
            : `${selectedDate.getDate()} de ${selectedDate.toLocaleString(
                "es",
                {
                  month: "long",
                }
              )}`}
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center py-4 mb-1">
        <div className="flex flex-col items-center min-w-[16vw]">
          <p className="text-xl ">{displayName}</p>
          <div className="mt-4 w-3/5 flex gap-x-4 items-center text-darkGray">
            <img src="/schedule.png" alt="" className="h-6 w-6" />
            <p className="text-lg">
              {new Date(event.event_date).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="mt-4 w-3/5 flex gap-x-4 items-center text-darkGray">
            <img src="/time.png" alt="" className="h-6 w-6" />
            <p className="text-lg">
              {formatMinutesToHoursAndMinutes(event.duration)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Event;
