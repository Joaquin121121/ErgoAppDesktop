// Import necessary modules and types
import React, { createContext, useContext, useState } from "react";
import { CompletedStudy, Study, Studies } from "../types/Studies";
import { Athlete } from "../types/Athletes";

// Type for the selected study
type SelectedStudy = Study | null;
type SelectedAthlete = Athlete | null;

// Initial athlete state
const initialAthlete: Athlete = {
  id: "",
  name: "",
  birthDate: new Date(),
  country: "",
  state: "",
  gender: "",
  height: "",
  heightUnit: "cm",
  weight: "",
  weightUnit: "kgs",
  discipline: "",
  category: "",
  institution: "",
  comments: "",
  completedStudies: [],
  deletedAt: null,
};

// Context interface
interface StudyContextType {
  study: SelectedStudy;
  setStudy: (study: SelectedStudy) => void;
  athlete: SelectedAthlete;
  setAthlete: (athlete: SelectedAthlete) => void;
  resetAthlete: () => void; // Added reset function
  selectedAthletes: Athlete[];
  setSelectedAthletes: (athletes: Athlete[]) => void;
}

// Create context with initial null values
const StudyContext = createContext<StudyContextType>({
  study: null,
  setStudy: () => {},
  athlete: null,
  setAthlete: () => {},
  resetAthlete: () => {}, // Added reset function
  selectedAthletes: [],
  setSelectedAthletes: () => {},
});

export const useStudyContext = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error("useStudyContext must be used within a StudyProvider");
  }
  return context;
};

// Provider component
export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [study, setStudy] = useState<SelectedStudy>(null);
  const [athlete, setAthlete] = useState<Athlete>(initialAthlete);
  const [selectedAthletes, setSelectedAthletes] = useState<Athlete[]>([]);
  // Function to set the study with type checking
  const setStudyWithTypeCheck = (newStudy: SelectedStudy) => {
    if (newStudy === null) {
      setStudy(null);
      return;
    }
    setStudy(newStudy);
  };

  // Function to reset athlete to initial state
  const resetAthlete = () => {
    setAthlete(initialAthlete);
  };

  return (
    <StudyContext.Provider
      value={{
        study,
        setStudy: setStudyWithTypeCheck,
        athlete,
        setAthlete,
        resetAthlete, // Added reset function to provider value
        selectedAthletes,
        setSelectedAthletes,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};
