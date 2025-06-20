import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

type EventType = "competition" | "trainingSession" | "test";

interface EventFormState {
  eventName: {
    value: string;
    error: string;
  };
  eventType: {
    value: EventType | "";
    error: string;
  };
  selectedAthleteName: {
    value: string;
    error: string;
  };
  selectedAthleteId: {
    value: string;
    error: string;
  };
  startTime: {
    value: string;
    error: string;
  };
  duration: {
    value: string;
    error: string;
  };
}

interface DraftEvent {
  eventId: number | string;
  formState: EventFormState;
}

interface NewEventContextType {
  formState: EventFormState;
  editMode: boolean;
  validationAttempted: boolean;
  searchTerm: string;
  draftEventId: number | string | null;
  updateEventName: (value: string) => void;
  updateEventType: (value: EventType) => void;
  updateAthleteName: (value: string) => void;
  updateAthleteId: (value: string) => void;
  updateStartTime: (value: string) => void;
  updateDuration: (value: string) => void;
  setEventNameError: (error: string) => void;
  setEventTypeError: (error: string) => void;
  setAthleteNameError: (error: string) => void;
  setAthleteIdError: (error: string) => void;
  setStartTimeError: (error: string) => void;
  setDurationError: (error: string) => void;
  setEditMode: (mode: boolean) => void;
  setValidationAttempted: (attempted: boolean) => void;
  setSearchTerm: (term: string) => void;
  resetEvent: () => void;
  saveDraft: (eventId: number | string) => void;
  clearDraft: () => void;
  initializeEventEdit: (eventData: {
    id: number | string;
    name: string;
    eventType: string;
    athleteName: string;
    athleteId: string;
    time: string;
    duration?: number;
  }) => void;
}

const initialFormState: EventFormState = {
  eventName: {
    value: "",
    error: "",
  },
  eventType: {
    value: "",
    error: "",
  },
  selectedAthleteName: {
    value: "",
    error: "",
  },
  selectedAthleteId: {
    value: "",
    error: "",
  },
  startTime: {
    value: "",
    error: "",
  },
  duration: {
    value: "",
    error: "",
  },
};

const NewEventContext = createContext<NewEventContextType | undefined>(
  undefined
);

export function NewEventProvider({ children }: { children: ReactNode }) {
  const [formState, setFormState] = useState<EventFormState>(initialFormState);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [validationAttempted, setValidationAttempted] =
    useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [draftEventId, setDraftEventId] = useState<number | string | null>(
    null
  );

  // Load draft from localStorage on initial render
  useEffect(() => {
    const savedDraft = localStorage.getItem("eventDraft");
    if (savedDraft) {
      try {
        const draft: DraftEvent = JSON.parse(savedDraft);
        setFormState(draft.formState);
        setDraftEventId(draft.eventId);
      } catch (error) {
        console.error("Error loading draft:", error);
        localStorage.removeItem("eventDraft");
      }
    }
  }, []);

  const updateEventName = (value: string) => {
    setFormState((prevState) => ({
      ...prevState,
      eventName: { value, error: "" },
    }));
  };

  const updateEventType = (value: EventType) => {
    setFormState((prevState) => ({
      ...prevState,
      eventType: { value, error: "" },
    }));
  };

  const updateAthleteName = (value: string) => {
    setFormState((prevState) => ({
      ...prevState,
      selectedAthleteName: { value, error: "" },
    }));
  };

  const updateAthleteId = (value: string) => {
    setFormState((prevState) => ({
      ...prevState,
      selectedAthleteId: { value, error: "" },
    }));
  };

  const updateStartTime = (value: string) => {
    setFormState((prevState) => ({
      ...prevState,
      startTime: { value, error: "" },
    }));
  };

  const updateDuration = (value: string) => {
    setFormState((prevState) => ({
      ...prevState,
      duration: { value, error: "" },
    }));
  };

  const setEventNameError = (error: string) => {
    setFormState((prevState) => ({
      ...prevState,
      eventName: { ...prevState.eventName, error },
    }));
  };

  const setEventTypeError = (error: string) => {
    setFormState((prevState) => ({
      ...prevState,
      eventType: { ...prevState.eventType, error },
    }));
  };

  const setAthleteNameError = (error: string) => {
    setFormState((prevState) => ({
      ...prevState,
      selectedAthleteName: { ...prevState.selectedAthleteName, error },
    }));
  };

  const setAthleteIdError = (error: string) => {
    setFormState((prevState) => ({
      ...prevState,
      selectedAthleteId: { ...prevState.selectedAthleteId, error },
    }));
  };

  const setStartTimeError = (error: string) => {
    setFormState((prevState) => ({
      ...prevState,
      startTime: { ...prevState.startTime, error },
    }));
  };

  const setDurationError = (error: string) => {
    setFormState((prevState) => ({
      ...prevState,
      duration: { ...prevState.duration, error },
    }));
  };

  const resetEvent = () => {
    setFormState(initialFormState);
    setDraftEventId(null);
  };

  const saveDraft = (eventId: number | string) => {
    setDraftEventId(eventId);
    const draftData: DraftEvent = {
      eventId,
      formState,
    };
    localStorage.setItem("eventDraft", JSON.stringify(draftData));
  };

  const clearDraft = () => {
    localStorage.removeItem("eventDraft");
    setDraftEventId(null);
  };

  const initializeEventEdit = (eventData: {
    id: number | string;
    name: string;
    eventType: string;
    athleteName: string;
    athleteId: string;
    time: string;
    duration?: number;
  }) => {
    // Check if we have a draft for this event
    if (draftEventId === eventData.id) {
      // Draft already loaded in state, no need to do anything
      setSearchTerm(formState.selectedAthleteName.value);
    } else {
      // No draft or draft for different event, initialize with event data
      setValidationAttempted(false);
      updateEventName(eventData.name);
      updateEventType(eventData.eventType as EventType);
      updateAthleteName(eventData.athleteName);
      updateAthleteId(eventData.athleteId);
      updateStartTime(eventData.time);
      updateDuration(eventData.duration?.toString() || "0");
      setSearchTerm(eventData.athleteName);
    }
  };

  return (
    <NewEventContext.Provider
      value={{
        formState,
        editMode,
        validationAttempted,
        searchTerm,
        draftEventId,
        updateEventName,
        updateEventType,
        updateAthleteName,
        updateAthleteId,
        updateStartTime,
        updateDuration,
        setEventNameError,
        setEventTypeError,
        setAthleteNameError,
        setAthleteIdError,
        setStartTimeError,
        setDurationError,
        setEditMode,
        setValidationAttempted,
        setSearchTerm,
        resetEvent,
        saveDraft,
        clearDraft,
        initializeEventEdit,
      }}
    >
      {children}
    </NewEventContext.Provider>
  );
}

export function useNewEvent() {
  const context = useContext(NewEventContext);
  if (context === undefined) {
    throw new Error("useNewEvent must be used within a NewEventProvider");
  }
  return context;
}
