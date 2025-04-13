import React, { useEffect, useState } from "react";

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
  const [showIcon, setShowIcon] = useState(true);

  // Truncate event name if longer than 18 characters
  const displayName =
    eventName.length > 18 ? `${eventName.substring(0, 15)}...` : eventName;

  useEffect(() => {
    setShowIcon(eventName.length < 10);
  }, [eventName]);

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
      className={`${getEventColor()} mt-1 px-2 py-1 rounded-2xl flex items-center transition-all duration-300 ease-in-out hover:cursor-pointer hover:scale-105 bg-opacity-60 active:opacity-40`}
      onClick={onClick}
    >
      {showIcon && (
        <img
          src={`/${eventType}.png`}
          alt={eventType}
          className="w-5 h-5 mr-2 overflow-hidden"
        />
      )}
      <p className="text-xs truncate" title={eventName}>
        {displayName}
      </p>
    </div>
  );
}

export default CalendarEvent;
