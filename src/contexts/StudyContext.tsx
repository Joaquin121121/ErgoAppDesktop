// Import necessary modules and types
import React, { createContext, useContext, useState } from "react";
import { CompletedStudy, Study, Studies } from "../types/Studies";
import { Athlete, PerformanceData } from "../types/Athletes";
import { countTotalExercises } from "../utils/utils";

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
  resetAthlete: () => void;
  fillOutPerformanceData: () => void;
  selectedAthletes: Athlete[];
  setSelectedAthletes: (athletes: Athlete[]) => void;
}

// Create context with initial null values
const StudyContext = createContext<StudyContextType>({
  study: null,
  setStudy: () => {},
  athlete: null,
  setAthlete: () => {},
  resetAthlete: () => {},
  fillOutPerformanceData: () => {},
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

  const fillOutPerformanceData = () => {
    if (!athlete.currentTrainingPlan) return;

    const trainingPlan = athlete.currentTrainingPlan;
    const processedAthlete = { ...athlete };

    const weeks = Array.from(
      new Set(athlete.sessionPerformanceData?.map((spd) => spd.week) || [])
    );

    weeks.forEach((week) => {
      const weekSessions = athlete.sessionPerformanceData?.filter(
        (spd) => spd.week.toISOString() === week.toISOString()
      );
      const completedExercises = weekSessions?.reduce(
        (acc, spd) => acc + spd.completedExercises,
        0
      );
      const performance = weekSessions?.reduce(
        (acc, spd) => acc + spd.performance,
        0
      );
      const totalExercises = trainingPlan.sessions.reduce(
        (acc, s) => acc + countTotalExercises(s),
        0
      );
      const attendance = `${weekSessions?.length} / ${trainingPlan.sessions.length}`;
      const processedPerformance = performance
        ? `${performance}/${completedExercises}`
        : "N/A";
      const processedCompletedExercises = completedExercises
        ? `${completedExercises}/${totalExercises}`
        : "N/A";

      processedAthlete.performanceData?.push({
        week,
        attendance,
        completedExercises: processedCompletedExercises,
        performance: processedPerformance,
      });
    });

    setAthlete({ ...processedAthlete });
  };

  return (
    <StudyContext.Provider
      value={{
        study,
        setStudy: setStudyWithTypeCheck,
        athlete,
        setAthlete,
        resetAthlete,
        fillOutPerformanceData,
        selectedAthletes,
        setSelectedAthletes,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};
