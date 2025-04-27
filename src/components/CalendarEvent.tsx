import React, { useEffect, useState } from "react";

function CalendarEvent({
  event_type,
  event_name,
  onClick,
}: {
  event_type: "competition" | "trainingSession" | "testSession";
  event_name: string;
  onClick: () => void;
}) {
  const [showIcon, setShowIcon] = useState(true);

  // Truncate event name if longer than 18 characters
  const displayName =
    event_name.length > 18 ? `${event_name.substring(0, 15)}...` : event_name;

  useEffect(() => {
    setShowIcon(event_name.length < 10);
  }, [event_name]);

  const getEventColor = () => {
    switch (event_type) {
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
          src={`/${event_type}.png`}
          alt={event_type}
          className="w-5 h-5 mr-2 overflow-hidden"
        />
      )}
      <p className="text-xs truncate" title={event_name}>
        {displayName}
      </p>
    </div>
  );
}

export default CalendarEvent;
