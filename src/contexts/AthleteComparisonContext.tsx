import React, { createContext, useContext, useState } from "react";
import { Athlete } from "../types/Athletes";

interface AthleteComparisonContextType {
  athleteToCompare1: Athlete | null;
  athleteToCompare2: Athlete | null;
  setAthleteToCompare1: (athlete: Athlete | null) => void;
  setAthleteToCompare2: (athlete: Athlete | null) => void;
  resetAthletes: () => void;
}

const AthleteComparisonContext = createContext<
  AthleteComparisonContextType | undefined
>(undefined);

export function AthleteComparisonProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [athleteToCompare1, setAthleteToCompare1] = useState<Athlete | null>(
    null
  );
  const [athleteToCompare2, setAthleteToCompare2] = useState<Athlete | null>(
    null
  );

  const resetAthletes = () => {
    setAthleteToCompare1(null);
    setAthleteToCompare2(null);
  };

  const value = {
    athleteToCompare1,
    athleteToCompare2,
    setAthleteToCompare1,
    setAthleteToCompare2,
    resetAthletes,
  };

  return (
    <AthleteComparisonContext.Provider value={value}>
      {children}
    </AthleteComparisonContext.Provider>
  );
}

export function useAthleteComparison() {
  const context = useContext(AthleteComparisonContext);
  if (context === undefined) {
    throw new Error(
      "useAthleteComparison must be used within an AthleteComparisonProvider"
    );
  }
  return context;
}
