import React, { useEffect, useState } from "react";
import { EventType } from "../types/Events";

function CalendarEvent({
  eventType,
  eventName,
  onClick,
}: {
  eventType: EventType;
  eventName: string;
  onClick: () => void;
}) {
  const [showIcon, setShowIcon] = useState(true);

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
      case "test":
        return "bg-blue";
    }
  };

  const getEventIcon = () => {
    switch (eventType) {
      case "test":
        return "/testSessionBlack.png";
      case "trainingSession":
        return "/trainingSession.png";
      case "competition":
        return "/competitionBlack.png";
    }
  };

  return (
    <div
      className={`${getEventColor()} mt-1 px-2 py-1 rounded-2xl flex items-center transition-all duration-300 ease-in-out hover:cursor-pointer hover:scale-105 bg-opacity-60 active:opacity-40`}
      onClick={onClick}
    >
      {showIcon && (
        <img
          src={getEventIcon()}
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
