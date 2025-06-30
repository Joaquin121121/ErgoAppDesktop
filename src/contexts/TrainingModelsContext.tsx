import { getTrainingModels } from "../parsers/trainingDataParser";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useUser } from "./UserContext";
import { TrainingModel } from "../types/trainingPlan";
import { useSyncContext } from "./SyncContext";
interface TrainingModelsContextType {
  trainingModels: TrainingModel[];
  setTrainingModels: (models: TrainingModel[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const TrainingModelsContext = createContext<
  TrainingModelsContextType | undefined
>(undefined);

interface TrainingModelsProviderProps {
  children: ReactNode;
}

export const TrainingModelsProvider: React.FC<TrainingModelsProviderProps> = ({
  children,
}) => {
  const [trainingModels, setTrainingModels] = useState<TrainingModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useUser();
  const { syncing } = useSyncContext();
  const value = {
    trainingModels,
    setTrainingModels,
    loading,
    setLoading,
  };
  const loadTrainingModels = async () => {
    setLoading(true);
    try {
      const modelsFromDb = await getTrainingModels(user?.id);
      setTrainingModels(modelsFromDb);
    } catch (err) {
      setTrainingModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && !syncing) {
      loadTrainingModels();
    }
  }, [user?.id, syncing]);

  return (
    <TrainingModelsContext.Provider value={value}>
      {children}
    </TrainingModelsContext.Provider>
  );
};

export const useTrainingModels = (): TrainingModelsContextType => {
  const context = useContext(TrainingModelsContext);
  if (context === undefined) {
    throw new Error(
      "useTrainingModels must be used within a TrainingModelsProvider"
    );
  }
  return context;
};
