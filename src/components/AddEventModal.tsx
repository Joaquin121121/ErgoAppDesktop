import React, { useState, useRef, useEffect } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { Athlete, transformToAthlete } from "../types/Athletes";
import HourPicker from "./HourPicker";
import TonalButton from "./TonalButton";
import {
  formatDateString,
  validateHHMM,
  createLocalDate,
  createTimezoneIndependentDate,
} from "../utils/utils";
import { useCalendar } from "../contexts/CalendarContext";
import { useNewEvent } from "../contexts/NewEventContext";
import styles from "../styles/animations.module.css";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
// Define the specific event types
type EventType = "competition" | "trainingSession" | "testSession";

function AddEventModal({
  onClose,
  customNavigate,
}: {
  onClose: () => void;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const { selectedDate, addEvent, isOnline } = useCalendar();
  const { user } = useUser();
  const {
    formState,
    updateEventName,
    updateEventType,
    updateAthleteName,
    updateStartTime,
    updateDuration,
    setEventNameError,
    setEventTypeError,
    setAthleteNameError,
    setStartTimeError,
    setDurationError,
    resetEvent,
  } = useNewEvent();

  const [animation, setAnimation] = useState(styles.popupFadeInTop);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const eventTypes = [
    {
      name: "Test",
      defaultIcon: "/testDarkGray.png",
      selectedIcon: "/studiesRed.png",
      value: "testSession" as EventType,
    },
    {
      name: "Entrenamiento",
      defaultIcon: "/trainingDarkGray.png",
      selectedIcon: "/trainingRed.png",
      value: "trainingSession" as EventType,
    },
    {
      name: "Competición",
      defaultIcon: "/competitionDarkGray.png",
      selectedIcon: "/competitionRed.png",
      value: "competition" as EventType,
    },
  ];

  // Athlete search states
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadedAthletes, setLoadedAthletes] = useState<Athlete[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { readDirectoryJsons } = useJsonFiles();
  const navigate = useNavigate();

  const selectEventType = (type: EventType) => {
    updateEventType(type);
  };

  const handleTimeChange = (time: string) => {
    updateStartTime(time);
  };

  const addAthlete = () => {
    resetAthlete();
    customNavigate("forward", "dashboard", "newAthlete");
    setAnimation(styles.popupFadeOutTop);
    setTimeout(() => {
      navigate("/newAthlete?from=dashboard");
    }, 200);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (parseFloat(value) < 0) return;
    updateDuration(e.target.value);
  };

  const filteredAthletes = loadedAthletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load athletes from json files
  const loadAthletes = async () => {
    try {
      const result = await readDirectoryJsons("athletes");
      const parsedAthletes = result.files
        .map((item) => {
          const transformed = transformToAthlete(item.content);
          return transformed;
        })
        .filter((athlete) => athlete !== null) as Athlete[];
      setLoadedAthletes(parsedAthletes);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAthleteSelect = (athlete: Athlete) => {
    updateAthleteName(athlete.name);
    setSearchTerm(athlete.name);
    setShowDropdown(false);
  };

  const resetAthlete = () => {
    updateAthleteName("");
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleAthletePointer = (e: React.PointerEvent, athlete: Athlete) => {
    e.preventDefault();
    handleAthleteSelect(athlete);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || !filteredAthletes.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredAthletes.length - 1 ? prev + 1 : prev
        );
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleAthleteSelect(filteredAthletes[selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  const localOnClose = () => {
    setAnimation(styles.popupFadeOutTop);
    setValidationAttempted(false);
    resetEvent();
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleAddEvent = async () => {
    // Set validation attempted to true when submit is clicked
    setValidationAttempted(true);

    // Reset previous errors first
    let hasError = false;

    // Validate Event Name
    if (!formState.eventName.value.trim()) {
      setEventNameError("Event name cannot be empty.");
      hasError = true;
    }

    // Validate Event Type
    if (!formState.eventType.value) {
      setEventTypeError("Por favor, selecciona un tipo de evento.");
      hasError = true;
    }

    // Validate Athlete
    if (!formState.selectedAthleteName.value) {
      setAthleteNameError("Please select an athlete.");
      hasError = true;
    }

    // Validate Start Time
    if (!formState.startTime.value) {
      setStartTimeError("Please select a start time.");
      hasError = true;
    } else if (!validateHHMM(formState.startTime.value)) {
      setStartTimeError("Invalid format");
      hasError = true;
    }

    // Validate Duration
    const durationNum = parseFloat(formState.duration.value);
    if (durationNum < 0) {
      setDurationError("Duration must be a positive number.");
      hasError = true;
    }

    if (hasError) {
      return; // Stop execution if there are errors
    }

    setLoading(true);

    try {
      // Use the timezone-independent approach to create the event date
      const eventDateString = createTimezoneIndependentDate(
        selectedDate,
        formState.startTime.value
      );

      // Check if event type is valid
      if (!formState.eventType.value as unknown) {
        throw new Error("Invalid event type");
      }

      // Create the event object
      const newEvent = {
        event_name: formState.eventName.value,
        event_type: formState.eventType.value as EventType,
        event_date: eventDateString,
        duration: parseFloat(formState.duration.value),
        coach_id: user.id,
        last_changed: new Date(),
        athlete_id: "1",
      };

      // Use the context's addEvent function instead of direct Supabase call
      await addEvent(newEvent);

      // Reset the form and close the modal after successful addition
      resetEvent();
      localOnClose();
    } catch (error) {
      console.error("Error adding event:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ensure selected item is visible in the dropdown
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const selectedElement = dropdown.children[selectedIndex];

      if (selectedElement) {
        const dropdownRect = dropdown.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();

        if (selectedRect.bottom > dropdownRect.bottom) {
          selectedElement.scrollIntoView(false);
        } else if (selectedRect.top < dropdownRect.top) {
          selectedElement.scrollIntoView(true);
        }
      }
    }
  }, [selectedIndex]);

  // Reset selected index when search term changes or dropdown visibility changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm, showDropdown]);

  // Load athletes on component mount
  useEffect(() => {
    loadAthletes();
  }, []);

  return (
    <div
      className={`flex flex-col items-center absolute top-8 left-1/2 -translate-x-1/2 z-50 shadow-sm bg-white rounded-2xl w-1/2 ${animation}`}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={localOnClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="Close" />
      </div>
      <p className="text-xl mt-8">
        Añadir Evento para {formatDateString(selectedDate)}
      </p>
      <div className="flex flex-col pl-20 w-full mt-8">
        <p className=" text-lg">Nombre del evento</p>
        <input
          type="text"
          className={`${
            inputStyles.input
          } bg-offWhite rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
            validationAttempted &&
            formState.eventName.error &&
            inputStyles.focused
          } `}
          value={formState.eventName.value}
          onChange={(e) => updateEventName(e.target.value)}
        />

        <p className=" mt-8 text-lg">Tipo de evento</p>
        <div className="flex gap-x-6 mt-2">
          {eventTypes.map((type) => (
            <button
              key={type.name}
              onClick={() => selectEventType(type.value)}
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                formState.eventType.value === type.value &&
                "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
              }`}
            >
              <img
                src={
                  formState.eventType.value === type.value
                    ? type.selectedIcon
                    : type.defaultIcon
                }
                alt=""
                className="h-6 w-6 mr-4"
              />
              {type.name}
            </button>
          ))}
        </div>
        {formState.eventType.error.length > 0 && (
          <p className="text-red-500 text-sm mt-2">
            {formState.eventType.error}
          </p>
        )}
        <p className="mt-8 text-lg">Atleta</p>

        {!formState.selectedAthleteName.value ? (
          <div className="flex gap-x-8 items-center">
            <div className="relative w-80">
              <div
                className={`${
                  inputStyles.input
                } h-10 rounded-2xl bg-offWhite shadow-sm flex items-center px-4 ${
                  (searchBarFocus ||
                    (validationAttempted &&
                      formState.selectedAthleteName.error.length > 0)) &&
                  inputStyles.focused
                }`}
              >
                <img src="/search.png" className="h-6 w-6 mr-2" alt="Search" />

                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-full focus:outline-none bg-offWhite text-tertiary"
                  onFocus={() => {
                    setSearchBarFocus(true);
                    setShowDropdown(true);
                  }}
                  onBlur={() => {
                    setSearchBarFocus(false);
                    if (selectedIndex === -1) {
                      setTimeout(() => setShowDropdown(false), 200);
                    }
                  }}
                  placeholder="Buscar atleta..."
                />
                {searchTerm && (
                  <img
                    src="/close.png"
                    className="h-6 w-6 hover:opacity-70 cursor-pointer active:opacity-40"
                    onClick={() => {
                      setSearchTerm("");
                      setShowDropdown(false);
                    }}
                    alt="Clear"
                  />
                )}
              </div>

              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute w-full mt-2 bg-white rounded-lg shadow-lg max-h-64 overflow-y-auto z-50"
                  role="listbox"
                  tabIndex={-1}
                  onKeyDown={handleKeyDown}
                >
                  {filteredAthletes.length > 0 ? (
                    filteredAthletes.map((athlete, index) => (
                      <div
                        key={index}
                        role="option"
                        aria-selected={selectedIndex === index}
                        className={`px-4 py-2 cursor-pointer ${
                          selectedIndex === index
                            ? "bg-lightRed text-secondary"
                            : "text-tertiary hover:bg-lightRed hover:text-secondary"
                        }`}
                        onPointerDown={(e) => handleAthletePointer(e, athlete)}
                        style={{ touchAction: "none" }}
                      >
                        {athlete.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-darkGray">
                      {searchTerm
                        ? `No hay ningún atleta de nombre '${searchTerm}'`
                        : "No hay atletas disponibles"}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p
              className="text-secondary hover:opacity-70 hover:cursor-pointer active:opacity-40"
              onClick={addAthlete}
            >
              Añadir nuevo atleta
            </p>
          </div>
        ) : (
          <div
            className="flex items-center bg-lightRed rounded-2xl px-4 py-1 w-fit mt-2 cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity"
            onClick={resetAthlete}
          >
            <span className="text-secondary font-medium">
              {formState.selectedAthleteName.value}
            </span>
            <img src="/close.png" className="h-5 w-5 ml-2" alt="Remove" />
          </div>
        )}
        <p className=" text-lg mt-8">Hora de Inicio</p>
        <HourPicker
          value={formState.startTime.value}
          onChange={handleTimeChange}
          error={validationAttempted ? formState.startTime.error : ""}
        />
        <p className="text-lg mt-8">Duracion</p>
        <div className="flex items-center">
          <input
            type="number"
            className={`${
              inputStyles.input
            } bg-offWhite rounded-2xl shadow-sm pl-2 h-10 text-tertiary w-40 ${
              validationAttempted &&
              formState.duration.error &&
              inputStyles.focused
            }`}
            value={formState.duration.value}
            onChange={handleDurationChange}
          />
          <p className="ml-2">minutos</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-between items-center mt-12 mb-4 w-2/5">
          <div className="w-12 h-12" />
          <TonalButton
            title="Añadir Evento"
            onClick={handleAddEvent}
            icon="add"
            disabled
          />
          <img src="/loading.gif" className="h-12 w-12" alt="Loading" />
        </div>
      ) : (
        <div className="h-12 mt-12 mb-4">
          <TonalButton
            title="Añadir Evento"
            onClick={handleAddEvent}
            icon="add"
          />
        </div>
      )}
    </div>
  );
}

export default AddEventModal;
