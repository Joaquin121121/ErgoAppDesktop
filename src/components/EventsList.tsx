import React, { useEffect, useState } from "react";
import { CalendarEvent } from "./Calendar";
import { isSameDay, isToday, isTomorrow } from "date-fns";
import Event from "./Event";
function EventsList({
  events,
  selectedDate,
}: {
  events: CalendarEvent[];
  selectedDate: Date;
}) {
  const [relevantEvents, setRelevantEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setRelevantEvents(
      events.filter((event) => isSameDay(event.eventDate, selectedDate))
    );
  }, [events, selectedDate]);
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[15vw] rounded-t-2xl bg-lightRed text-secondary flex justify-center items-center text-xl py-2 font-medium -mb-2 z-50">
        {isToday(selectedDate)
          ? "Hoy"
          : isTomorrow(selectedDate)
          ? "Mañana"
          : `${selectedDate.getDate()} de ${selectedDate.toLocaleString("es", {
              month: "long",
            })}`}
      </div>
      {relevantEvents.map((event) => (
        <Event event={event} />
      ))}
    </div>
  );
}

export default EventsList;
