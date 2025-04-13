import React, { useState } from "react";
import Calendar, { CalendarEvent } from "../components/Calendar";
import EventsList from "../components/EventsList";
import { es } from "date-fns/locale";
import AddEventModal from "../components/AddEventModal";
const Dashboard = ({
  isExpanded,
  animation,
  customNavigate,
  onBlurChange,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
  onBlurChange: (isBlurred: boolean) => void;
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [addingEvent, setAddingEvent] = useState(false);

  const dummyEvents: CalendarEvent[] = [
    {
      eventType: "competition",
      eventName: "Regional Championships",
      athleteName: "John Doe",
      eventDate: new Date(),
      duration: 90,
    },
    {
      eventType: "trainingSession",
      eventName: "Strength Training",
      athleteName: "Jane Smith",
      eventDate: new Date(),
      duration: 180,
    },
    {
      eventType: "testSession",
      eventName: "Fitness Assessment",
      athleteName: "Mike Johnson",
      eventDate: new Date(),
      duration: 70,
    },
  ];

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center ${
          addingEvent && "blur-md pointer-events-none"
        } transition-all duration-300 ease-in-out ${animation}`}
        style={{
          paddingLeft: isExpanded ? "100px" : "32px",
        }}
      >
        <div className="flex mt-8 justify-around ml-16 ">
          <Calendar
            locale={es}
            events={dummyEvents}
            setSelectedDate={setSelectedDate}
            setTargetDate={setTargetDate}
            setAddingEvent={setAddingEvent}
          />
          <EventsList events={dummyEvents} selectedDate={selectedDate} />
        </div>
      </div>

      {addingEvent && (
        <AddEventModal
          onClose={() => {
            setAddingEvent(false);
          }}
          targetDate={selectedDate}
        />
      )}
    </>
  );
};

export default Dashboard;
