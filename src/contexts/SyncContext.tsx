import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface SyncContextType {
  pendingOperations: SyncOperation[];
  enqueueOperation: (operation: SyncOperation) => void;
  syncing: boolean;
  setSyncing: (syncing: boolean) => void;
}

interface SyncOperation {
  name: string;
  execute: () => Promise<void>;
  status: "pending" | "inProgress" | "success" | "error";
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>(
    []
  );

  const [syncing, setSyncing] = useState(true);

  const enqueueOperation = (operation: SyncOperation) => {
    setPendingOperations((ops) => [...ops, operation]);
  };
  useEffect(() => {
    // Only process if nothing is currently in progress
    const inProgress = pendingOperations.some(
      (op) => op.status === "inProgress"
    );
    if (inProgress) return;

    const nextOp = pendingOperations.find((op) => op.status === "pending");
    if (nextOp) {
      setPendingOperations((ops) =>
        ops.map((op) =>
          op.name === nextOp.name ? { ...op, status: "inProgress" } : op
        )
      );

      (async () => {
        try {
          await nextOp.execute();
          setPendingOperations((ops) =>
            ops.map((op) =>
              op.name === nextOp.name ? { ...op, status: "success" } : op
            )
          );
        } catch (error) {
          setPendingOperations((ops) =>
            ops.map((op) =>
              op.name === nextOp.name ? { ...op, status: "error", error } : op
            )
          );
        }
      })();
    }
  }, [pendingOperations]);

  return (
    <SyncContext.Provider
      value={{ pendingOperations, enqueueOperation, syncing, setSyncing }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSyncContext must be used within a SyncProvider");
  }
  return context;
};
