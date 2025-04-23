import React, { useState, useEffect } from "react";
import Calendar from "../components/Calendar";
import EventsList from "../components/EventsList";
import { es } from "date-fns/locale";
import AddEventModal from "../components/AddEventModal";
import { supabase } from "../supabase";
import EventInfoModal from "../components/EventInfoModal";
import { useBlur } from "../contexts/BlurContext";
import { useCalendar } from "../contexts/CalendarContext";

const Dashboard = ({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) => {
  const { isBlurred, setIsBlurred } = useBlur();
  const { addingEvent, setAddingEvent, eventInfo, setEventInfo } =
    useCalendar();

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center ${
          (addingEvent || isBlurred || eventInfo) &&
          "blur-md pointer-events-none"
        } transition-all duration-300 ease-in-out ${animation}`}
        style={{
          paddingLeft: isExpanded ? "100px" : "32px",
        }}
      >
        <div className="flex mt-8 justify-around ml-16 ">
          <Calendar locale={es} />
          <EventsList />
        </div>
      </div>

      {addingEvent && (
        <AddEventModal
          onClose={() => {
            setAddingEvent(false);
            setIsBlurred(false);
          }}
          customNavigate={customNavigate}
        />
      )}
      {eventInfo && (
        <EventInfoModal
          onClose={() => {
            setEventInfo(null);
            setIsBlurred(false);
          }}
          customNavigate={customNavigate}
        />
      )}
    </>
  );
};

export default Dashboard;
