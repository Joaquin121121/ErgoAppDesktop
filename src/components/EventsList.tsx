import React, { useEffect, useState } from "react";
import { CalendarEvent } from "./Calendar";
import { isSameDay, isToday, isTomorrow } from "date-fns";
import Event from "./Event";
import { formatMinutesToHoursAndMinutes } from "@/utils/utils";
import TonalButton from "./TonalButton";
import { useBlur } from "../contexts/BlurContext";
import { useCalendar } from "../contexts/CalendarContext";
import styles from "../styles/scrollbar.module.css";

function EventsList() {
  const [relevantEvents, setRelevantEvents] = useState<CalendarEvent[]>([]);
  const { isBlurred, setIsBlurred } = useBlur();
  const { setAddingEvent, setEventInfo, events, selectedDate } = useCalendar();
  const handleAddEvent = () => {
    setAddingEvent(true);
    setIsBlurred(true);
  };

  useEffect(() => {
    setRelevantEvents(
      events
        .filter((event) => isSameDay(event.event_date, selectedDate))
        .sort((a, b) => {
          const dateA = new Date(a.event_date);
          const dateB = new Date(b.event_date);
          return dateA.getTime() - dateB.getTime();
        })
    );
  }, [events, selectedDate]);
  return (
    <div className="flex flex-col items-center ">
      <div
        className={`flex flex-col items-center ml-4 overflow-y-auto p-3 ${styles.customScrollbar}`}
        style={{ maxHeight: "80vh" }}
      >
        {relevantEvents.map((event, index) => (
          <Event
            key={index}
            event={event}
            selectedDate={selectedDate}
            index={index}
            setEventInfo={setEventInfo}
          />
        ))}
        {relevantEvents.length === 0 && (
          <>
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
            <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center py-4 mb-1 w-[16vw]">
              <p className="text-lg my-4 break-words px-4 text-center">
                No hay eventos para esta fecha
              </p>
            </div>
          </>
        )}
      </div>
      <TonalButton
        title="Añadir Evento"
        onClick={handleAddEvent}
        icon="add"
        containerStyles="mb-4 mt-6 ml-6"
      />
    </div>
  );
}

export default EventsList;
