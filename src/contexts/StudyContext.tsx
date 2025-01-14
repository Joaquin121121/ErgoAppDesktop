// Import necessary modules and types
import React, { createContext, useContext, useState } from "react";
import { Study, Studies } from "../availableStudies";
import availableStudies from "../availableStudies";

// Type for the selected study
type SelectedStudy = Study | null;

// Type for the study type based on the 'type' property of Study

// Context interface
interface StudyContextType {
  study: SelectedStudy;
  setStudy: (study: SelectedStudy) => void;
}

// Create context with initial null values
const StudyContext = createContext<StudyContextType>({
  study: null,
  setStudy: () => {},
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

  // Function to set the study with type checking
  const setStudyWithTypeCheck = (newStudy: SelectedStudy) => {
    if (newStudy === null) {
      setStudy(null);
      return;
    }
    setStudy(newStudy);
  };

  return (
    <StudyContext.Provider
      value={{
        study,

        setStudy: setStudyWithTypeCheck,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};
