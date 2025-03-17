// contexts/TestContext.tsx

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { TestState, TestAction } from "../types/TestReducer";
import { testReducer, initialTestState } from "../hooks/useTestReducer";
import useSerialMonitor from "../hooks/useSerialMonitor";
// Create context with type information
interface TestContextType {
  state: TestState;
  dispatch: React.Dispatch<TestAction>;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

// Provider component
interface TestProviderProps {
  children: ReactNode;
}

export function TestProvider({ children }: TestProviderProps) {
  const [state, dispatch] = useReducer(testReducer, initialTestState);

  return (
    <TestContext.Provider value={{ state, dispatch }}>
      {children}
    </TestContext.Provider>
  );
}

// Custom hook for using the context
export function useTestContext() {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error("useTestContext must be used within a TestProvider");
  }
  return context;
}

// Action creators hook
export function useTestActions() {
  const { dispatch } = useTestContext();
  const { startSerialListener } = useSerialMonitor();

  return {
    initializeTest: async () => {
      dispatch({ type: "SET_STATUS", payload: "idle" });
      try {
        await startSerialListener(9600);
        dispatch({ type: "SET_STATUS", payload: "ready" });
      } catch (err) {
        dispatch({ type: "SET_STATUS", payload: "deviceError" });
      }
    },

    setStatus: (status: TestState["status"]) => {
      dispatch({ type: "SET_STATUS", payload: status });
    },

    deleteJump: (index: number) => {
      dispatch({ type: "DELETE_JUMP", payload: { index } });
      dispatch({ type: "CALCULATE_AVERAGES" });
    },

    finishTest: () => {
      dispatch({ type: "FINISH_TEST" });
      dispatch({ type: "CALCULATE_AVERAGES" });
    },

    resetTest: () => {
      dispatch({ type: "RESET_TEST" });
    },

    processLog: (logData: number) => {
      dispatch({
        type: "PROCESS_LOG",
        payload: { logData, timestamp: new Date() },
      });
      dispatch({ type: "CALCULATE_AVERAGES" });
    },

    toggleTable: (show: boolean) => {
      dispatch({ type: "TOGGLE_TABLE", payload: show });
    },

    toggleChart: (show: boolean) => {
      dispatch({ type: "TOGGLE_CHART", payload: show });
    },
  };
}
