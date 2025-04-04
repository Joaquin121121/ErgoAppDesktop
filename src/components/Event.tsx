import React from "react";
import { CalendarEvent } from "./Calendar";
import { formatMinutesToHoursAndMinutes } from "../utils/utils";

function Event({ event }: { event: CalendarEvent }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center py-4 mb-1">
      <div className="flex flex-col items-center min-w-[15vw]">
        <p className="text-xl ">{event.eventName}</p>
        <div className="mt-4 w-3/5 flex gap-x-4 items-center text-darkGray">
          <img src="/schedule.png" alt="" className="h-6 w-6" />
          <p className="text-lg">
            {event.eventDate.toLocaleTimeString("en-US", {
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
  );
}

export default Event;
