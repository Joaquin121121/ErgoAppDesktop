import { useCallback } from "react";
import { useDatabaseSync } from "./useDatabaseSync";
import { useRecordSync } from "./useRecordSync";
import {
  getTrainingPlansWithModels,
  getTrainingModels,
  getTrainingPlans,
} from "./parseTrainingData";
import { PlanState, TrainingModel } from "../types/trainingPlan";

/**
 * Safe data loading hook that prevents sync operations during data loading
 * to avoid unexpected writes when just reading data.
 */
export function useSafeDataLoading() {
  const { setDataLoadingState, withDataLoading } = useDatabaseSync();
  const { setDataSyncDisabled } = useRecordSync();

  // Safe training plans loading (prevents sync during load)
  const loadTrainingPlans = useCallback(
    async (userId: string): Promise<PlanState[]> => {
      // Disable record sync during loading
      setDataSyncDisabled(true);

      try {
        return await withDataLoading(async () => {
          return await getTrainingPlans(userId, false, true); // isLoadingOperation = true
        });
      } finally {
        // Re-enable record sync after loading
        setDataSyncDisabled(false);
      }
    },
    [withDataLoading, setDataSyncDisabled]
  );

  // Safe training plans with models loading (prevents sync during load)
  const loadTrainingPlansWithModels = useCallback(
    async (userId: string): Promise<PlanState[]> => {
      // Disable record sync during loading
      setDataSyncDisabled(true);

      try {
        return await withDataLoading(async () => {
          return await getTrainingPlansWithModels(userId, true); // isLoadingOperation = true
        });
      } finally {
        // Re-enable record sync after loading
        setDataSyncDisabled(false);
      }
    },
    [withDataLoading, setDataSyncDisabled]
  );

  // Safe training models loading (prevents sync during load)
  const loadTrainingModels = useCallback(async (): Promise<TrainingModel[]> => {
    // Disable record sync during loading
    setDataSyncDisabled(true);

    try {
      return await withDataLoading(async () => {
        return await getTrainingModels(true); // isLoadingOperation = true
      });
    } finally {
      // Re-enable record sync after loading
      setDataSyncDisabled(false);
    }
  }, [withDataLoading, setDataSyncDisabled]);

  // Manual control over loading state for custom operations
  const startDataLoading = useCallback(() => {
    setDataLoadingState(true);
  }, [setDataLoadingState]);

  const endDataLoading = useCallback(() => {
    setDataLoadingState(false);
  }, [setDataLoadingState]);

  // Wrapper for any custom loading operation
  const safeLoad = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      return withDataLoading(operation);
    },
    [withDataLoading]
  );

  return {
    // Safe loading functions
    loadTrainingPlans,
    loadTrainingPlansWithModels,
    loadTrainingModels,

    // Manual control
    startDataLoading,
    endDataLoading,
    safeLoad,
  };
}
