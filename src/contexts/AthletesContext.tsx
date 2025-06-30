import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Athlete } from "../types/Athletes";
import { getAthletes } from "../parsers/athleteDataParser";
import { useUser } from "./UserContext";
import { getTrainingPlans } from "../parsers/trainingDataParser";
import { PlanState } from "../types/trainingPlan";
import { useSyncContext } from "./SyncContext";
import { useStudyContext } from "./StudyContext";

interface AthletesContextType {
  athletes: Athlete[];
  loading: boolean;
  setAthletes: (athletes: Athlete[]) => void;
  loadAthletes: () => Promise<void>;
  syncSpecificAthlete: (newAthlete: Athlete) => void;
}

const AthletesContext = createContext<AthletesContextType | undefined>(
  undefined
);

export const AthletesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { syncing } = useSyncContext();

  const loadAthletes = async () => {
    setLoading(true);

    try {
      const athletesFromDb = await getAthletes(user.id);
      const trainingPlans = await getTrainingPlans(user.id);

      const planByAthleteId = new Map(
        trainingPlans.map((plan: PlanState) => [plan.athleteId, plan])
      );

      const athletesWithPlans = athletesFromDb.map((athlete: Athlete) => ({
        ...athlete,
        currentTrainingPlan: planByAthleteId.get(athlete.id),
      }));

      setAthletes(athletesWithPlans);
    } catch (err) {
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  };

  const syncSpecificAthlete = async (newAthlete: Athlete) => {
    const newAthletes = athletes.map((athlete) =>
      athlete.id === newAthlete.id ? newAthlete : athlete
    );
    setAthletes(newAthletes);
  };

  useEffect(() => {
    if (user?.id && !syncing) {
      loadAthletes();
    }
  }, [user?.id, syncing]);

  const value: AthletesContextType = {
    athletes,
    loading,
    setAthletes,
    loadAthletes,
    syncSpecificAthlete,
  };

  return (
    <AthletesContext.Provider value={value}>
      {children}
    </AthletesContext.Provider>
  );
};

export const useAthletes = (): AthletesContextType => {
  const context = useContext(AthletesContext);
  if (context === undefined) {
    throw new Error("useAthletes must be used within an AthletesProvider");
  }
  return context;
};
