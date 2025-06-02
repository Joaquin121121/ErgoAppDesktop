import React, { useState, useRef, useEffect } from "react";
import { CalendarEvent } from "./Calendar";
import { useTranslation } from "react-i18next";
import {
  formatDateString,
  getTimeString,
  validateHHMM,
  createLocalDate,
  createTimezoneIndependentDate,
} from "../utils/utils";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";
import HourPicker from "./HourPicker";
import inputStyles from "../styles/inputStyles.module.css";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { Athlete, transformToAthlete } from "../types/Athletes";
import DatePicker from "./DatePicker";
import { useCalendar } from "../contexts/CalendarContext";
import { useNewEvent } from "../contexts/NewEventContext";
import styles from "../styles/animations.module.css";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { saveEvent, deleteEvent as deleteEventDb } from "../hooks/parseEvents";
import getAthletes from "../hooks/parseAthletes";

type EventType = "competition" | "trainingSession" | "testSession";

// Helper to check network connection in real-time
const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    // Try to reach Supabase with a small request
    const { data, error } = await supabase
      .from("event")
      .select("id")
      .limit(1)
      .maybeSingle();
    return !error;
  } catch (e) {
    return false;
  }
};

function EventInfoModal({
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
  const { t } = useTranslation();
  const { readDirectoryJsons } = useJsonFiles();
  const { eventInfo, setEventInfo, updateEvent, deleteEvent } = useCalendar();
  const {
    formState,
    editMode,
    setEditMode,
    updateEventName,
    updateEventType,
    updateAthleteName,
    updateAthleteId,
    updateStartTime,
    updateDuration,
    setEventNameError,
    setEventTypeError,
    setAthleteNameError,
    setStartTimeError,
    setDurationError,
    resetEvent,
    validationAttempted,
    setValidationAttempted,
    searchTerm,
    setSearchTerm,
    initializeEventEdit,
    saveDraft,
    clearDraft,
    draftEventId,
  } = useNewEvent();

  const [displayDate, setDisplayDate] = useState<Date>(
    new Date(eventInfo.event_date)
  );

  // Get athlete name from loaded athletes
  const [loadedAthletes, setLoadedAthletes] = useState<Athlete[]>([]);
  const athleteForEvent = loadedAthletes.find(
    (a) => a.id === eventInfo.athlete_id
  );
  const athleteNameDisplay = athleteForEvent?.name || "Unknown Athlete";

  // Initialize the event information in local state for display purposes
  const [eventDisplay, setEventDisplay] = useState({
    ...eventInfo,
    time: getTimeString(new Date(eventInfo.event_date)),
  });

  // Effect to save draft whenever form state changes in edit mode
  useEffect(() => {
    if (editMode && eventInfo.id) {
      saveDraft(eventInfo.id);
    }
  }, [formState, editMode, eventInfo.id, saveDraft]);

  useEffect(() => {}, [eventInfo]);

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

  const displayKeys = [
    {
      key: "event_type",
      icon: editMode ? "info" : `${eventDisplay.event_type}Red`,
      value: t(eventDisplay.event_type),
    },
    {
      key: "athlete_name",
      icon: "athletesRed",
      value: athleteNameDisplay,
    },
    {
      key: "event_date",
      icon: "calendar",
      value: formatDateString(new Date(eventDisplay.event_date)),
    },
    {
      key: "time",
      icon: "schedule",
      value: `${getTimeString(new Date(eventDisplay.event_date))} hs`,
    },
    {
      key: "duration",
      icon: "time",
      value: eventDisplay.duration
        ? `${eventDisplay.duration} minutos`
        : "Sin duración cargada",
    },
  ];

  // Athlete search states
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [animation, setAnimation] = useState(styles.popupFadeInTop);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleTimeChange = (time: string) => {
    updateStartTime(time);
  };

  const handleDateChange = (date: Date) => {
    setDisplayDate(date);
  };

  const handleAthleteSelect = (athlete: Athlete) => {
    updateAthleteName(athlete.name);
    updateAthleteId(athlete.id);
    setSearchTerm(athlete.name);
    setShowDropdown(false);
  };

  const addAthlete = () => {
    setAnimation(styles.popupFadeOutTop);
    resetAthlete();
    customNavigate("forward", "dashboard", "newAthlete");
    setTimeout(() => {
      navigate("/newAthlete?from=dashboard");
    }, 200);
  };

  const resetAthlete = () => {
    updateAthleteName("");
    updateAthleteId("");
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

  const selectEventType = (type: EventType) => {
    updateEventType(type);
  };

  const localOnClose = () => {
    cancelEdit();
    setAnimation(styles.popupFadeOutTop);
    // Don't reset the event if in edit mode and we want to keep draft changes
    if (!editMode) {
      resetEvent();
      clearDraft();
    }
    setEditMode(false);
    setValidationAttempted(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setValidationAttempted(false);
    resetEvent();
    clearDraft();
  };

  const handleDelete = async () => {
    // Validate eventInfo exists
    if (!eventInfo || !eventInfo.id) {
      alert("Error: No se pudo identificar el evento a eliminar.");
      return;
    }

    setLoading(true);
    try {
      // Check network connection in real-time before proceeding
      const isCurrentlyOnline = await checkNetworkConnection();
      if (!isCurrentlyOnline) {
        // If offline, we might still proceed with context update,
        // and rely on offline capabilities if implemented, or inform user.
        // Potentially show a specific offline message to the user here
      }

      const eventId = eventInfo.id; // eventId is a string (UUID)

      // Call the deleteEvent function from CalendarContext
      // This function handles the database operation (via parseEvents) and state update.
      await deleteEvent(eventId);

      // Clear any draft when deleting
      clearDraft();
      localOnClose(); // Closes modal and resets states
    } catch (error) {
      // This catch block will handle errors from deleteEvent (context) or checkNetworkConnection
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrió un error desconocido.";
      alert(
        `Error al eliminar el evento: ${errorMessage}. Por favor, verifica tu conexión o intenta de nuevo.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Set validation attempted to true
    setValidationAttempted(true);

    // Add validation before saving
    let hasError = false;

    // Validate Event Name
    if (!formState.eventName.value.trim()) {
      setEventNameError("Event name cannot be empty.");
      hasError = true;
    }

    // Validate Event Type
    if (!formState.eventType.value) {
      setEventTypeError("Please select an event type.");
      hasError = true;
    }

    // Validate Athlete
    if (!formState.selectedAthleteId.value) {
      setAthleteNameError("Please select an athlete.");
      hasError = true;
    }

    // Validate Time
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

    // Continue with saving if validation passes
    setLoading(true);
    try {
      // Check network connection in real-time before proceeding
      const isCurrentlyOnline = await checkNetworkConnection();
      if (!isCurrentlyOnline) {
      }

      // Use the timezone-independent approach to create the event date
      const eventDateString = createTimezoneIndependentDate(
        displayDate.toISOString(),
        formState.startTime.value
      );

      // Create updated event object
      const updatedEvent = {
        event_name: formState.eventName.value,
        event_type: formState.eventType.value as EventType,
        athlete_id: formState.selectedAthleteId.value,
        event_date: eventDateString,
        duration: parseFloat(formState.duration.value),
        coach_id: eventInfo.coach_id,
        last_changed: new Date(),
        id: eventInfo.id,
      };

      // Use the new database function
      const result = await saveEvent(updatedEvent);

      if (result.success) {
        // Also update the calendar context
        await updateEvent(updatedEvent);

        // Update the display event with the new values
        setEventDisplay({
          ...updatedEvent,
          time: formState.startTime.value,
        });

        // Clear draft after successful save
        clearDraft();

        // Reset validation and edit mode
        setValidationAttempted(false);
        setEditMode(false);
        resetEvent();
        localOnClose();
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Load athletes from database
  const loadAthletes = async () => {
    try {
      // Load athletes from database for the current coach
      const athletesFromDb = await getAthletes(eventInfo.coach_id);
      setLoadedAthletes(athletesFromDb);
    } catch (error) {
      setLoadedAthletes([]);
    }
  };

  // Initialize form state when entering edit mode
  useEffect(() => {
    if (editMode && athleteForEvent) {
      initializeEventEdit({
        id: eventInfo.id || "",
        event_name: eventDisplay.event_name,
        event_type: eventDisplay.event_type,
        athlete_name: athleteForEvent.name,
        athlete_id: eventInfo.athlete_id,
        time: eventDisplay.time,
        duration: eventDisplay.duration,
      });
    }
  }, [editMode, athleteForEvent]);

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

  const filteredAthletes = loadedAthletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        Evento:{" "}
        {editMode ? (
          <div className="inline">
            <input
              type="text"
              className={`${
                inputStyles.input
              } bg-offWhite rounded-lg shadow-sm pl-2 ml-2 h-8 text-secondary ${
                validationAttempted &&
                formState.eventName.error &&
                inputStyles.focused
              }`}
              value={formState.eventName.value}
              onChange={(e) => updateEventName(e.target.value)}
            />
          </div>
        ) : (
          <span className="text-secondary">{eventDisplay.event_name}</span>
        )}
      </p>

      <div className="flex flex-col my-8 w-4/5">
        {/* Event Type */}
        <div className="flex items-center gap-x-4 mb-8">
          <img
            src={`/${displayKeys[0].icon}.png`}
            className="h-6 w-6"
            alt={displayKeys[0].key}
          />
          {editMode ? (
            <div className="flex flex-col">
              <div className="flex gap-x-3">
                {eventTypes.map((type) => (
                  <button
                    key={type.name}
                    onClick={() => selectEventType(type.value)}
                    className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                      formState.eventType.value === type.value &&
                      "bg-lightRed text-secondary hover:bg-slate-50 hover:text-darkGray"
                    } ${
                      validationAttempted &&
                      formState.eventType.error &&
                      "border-red-500"
                    }`}
                  >
                    <img
                      src={
                        formState.eventType.value === type.value
                          ? type.selectedIcon
                          : type.defaultIcon
                      }
                      alt=""
                      className="h-6 w-6 mr-2"
                    />
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-lg">{displayKeys[0].value}</p>
          )}
        </div>

        {/* Athlete Name */}
        <div className="flex items-center gap-x-4 mb-8">
          <img
            src={`/${displayKeys[1].icon}.png`}
            className="h-6 w-6"
            alt={displayKeys[1].key}
          />
          {editMode ? (
            <div className="flex flex-col">
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
                              onPointerDown={(e) =>
                                handleAthletePointer(e, athlete)
                              }
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
                  className="flex items-center bg-lightRed rounded-xl px-3 py-1 w-fit cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity"
                  onClick={resetAthlete}
                >
                  <span className="text-secondary font-medium">
                    {formState.selectedAthleteName.value}
                  </span>
                  <img src="/close.png" className="h-4 w-4 ml-1" alt="Remove" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-lg">{displayKeys[1].value}</p>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-x-4 mb-8">
          <img
            src={`/${displayKeys[2].icon}.png`}
            className="h-6 w-6"
            alt={displayKeys[2].key}
          />
          {editMode ? (
            <DatePicker value={displayDate} onChange={handleDateChange} />
          ) : (
            <p className="text-lg">{displayKeys[2].value}</p>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-x-4 mb-8">
          <img
            src={`/${displayKeys[3].icon}.png`}
            className="h-6 w-6"
            alt={displayKeys[3].key}
          />
          {editMode ? (
            <div className="flex flex-col">
              <HourPicker
                value={formState.startTime.value}
                onChange={handleTimeChange}
                error={validationAttempted ? formState.startTime.error : ""}
              />
            </div>
          ) : (
            <p className="text-lg">{displayKeys[3].value}</p>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-x-4 mb-8">
          <img
            src={`/${displayKeys[4].icon}.png`}
            className="h-6 w-6"
            alt={displayKeys[4].key}
          />
          {editMode ? (
            <div className="flex flex-col">
              <div className="flex items-center">
                <input
                  type="number"
                  className={`${
                    inputStyles.input
                  } bg-offWhite rounded-xl shadow-sm pl-2 h-8 text-tertiary w-24 ${
                    validationAttempted &&
                    formState.duration.error &&
                    inputStyles.focused
                  }`}
                  value={formState.duration.value || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (parseFloat(value) < 0) return;
                    updateDuration(e.target.value);
                  }}
                />
                <p className="ml-1">minutos</p>
              </div>
            </div>
          ) : (
            <p className="text-lg">{displayKeys[4].value}</p>
          )}
        </div>
      </div>

      <div className="flex mb-8 justify-between w-3/5 items-center">
        {editMode ? (
          <>
            <OutlinedButton
              title="Deshacer"
              onClick={cancelEdit}
              icon="close"
            />
            {loading && (
              <img src="/loading.gif" className="h-12 w-12" alt="Loading" />
            )}
            <TonalButton
              title="Guardar"
              onClick={handleSave}
              icon="check"
              disabled={loading}
            />
          </>
        ) : (
          <>
            <OutlinedButton
              title="Eliminar"
              onClick={handleDelete}
              icon="delete"
            />
            {loading && (
              <img src="/loading.gif" className="h-12 w-12" alt="Loading" />
            )}
            <TonalButton
              title="Editar"
              onClick={() => setEditMode(true)}
              icon="pencilWhite"
            />
          </>
        )}
      </div>
    </div>
  );
}

export default EventInfoModal;
