import React from "react";

function CalendarEvent({
  eventType,
  eventName,
  athleteName,
  onClick,
}: {
  eventType: "competition" | "trainingSession" | "testSession";
  eventName: string;
  athleteName: string;
  onClick: () => void;
}) {
  const getEventColor = () => {
    switch (eventType) {
      case "competition":
        return "bg-[#FFd700]";
      case "trainingSession":
        return "bg-green";
      case "testSession":
        return "bg-blue";
    }
  };

  return (
    <div
      className={`${getEventColor()} mt-1 px-2 py-1 rounded-2xl flex items-center transition-all duration-300 ease-in-out hover:cursor-pointer hover:scale-105 bg-opacity-80 active:opacity-40`}
      onClick={onClick}
    >
      <img
        src={`/${eventType}.png`}
        alt={eventType}
        className="w-5 h-5 mr-2 overflow-hidden"
      />
      <div className="flex flex-col items-center gap-y-1">
        <p className="text-xs truncate ">{eventName}</p>
      </div>
    </div>
  );
}

export default CalendarEvent;
