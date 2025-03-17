// hooks/tests/useTestReducer.ts

import { JumpTime } from "../types/Studies";
import { TestState, TestAction } from "../types/TestReducer";
import { getPerformanceDrop, getSecondsBetweenDates } from "../utils/utils";
import useSerialMonitor from "./useSerialMonitor";
// Initial state
export const initialTestState: TestState = {
  status: "idle",
  jumpTimes: [],
  dropJumps: [],
  data: {
    avgFlightTime: 0,
    avgHeightReached: 0,
    avgFloorTime: 0,
    avgPerformance: 0,
    avgStiffness: 0,
  },
  startTime: new Date(),
  ignoreJump: false,
  displayError: false,
  showTable: false,
  showChart: false,
  performanceDrop: 0,
  selectedAthletes: [],
  multipleAthletesTests: [],
  pointer: 0,
  selectedAthletePointer: 0,
  sensitivity: 100,
  testType: null,
  firstJumpFlag: true,
};

// Helper functions for calculations
const calculateHeight = (flightTime: number): number => {
  return ((9.81 * flightTime ** 2) / 8) * 100;
};

const calculateStiffness = (flightTime: number, floorTime: number): number => {
  return (
    (Math.PI * (flightTime + floorTime)) /
    (floorTime * floorTime * (flightTime / floorTime + Math.PI / 4))
  );
};

// The reducer function
export function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case "SET_STATUS":
      return {
        ...state,
        status: action.payload,
      };

    case "DELETE_JUMP": {
      const { index } = action.payload;
      const updatedJumpTimes = state.jumpTimes.map((jump, i) =>
        i === index ? { ...jump, deleted: !jump.deleted } : jump
      );

      return {
        ...state,
        jumpTimes: updatedJumpTimes,
      };
    }

    case "CALCULATE_AVERAGES": {
      const validJumpTimes = state.jumpTimes.filter((jump) => !jump.deleted);

      if (validJumpTimes.length === 0) {
        return {
          ...state,
          data: {
            ...state.data,
            avgFlightTime: 0,
            avgHeightReached: 0,
          },
        };
      }

      // Calculate average flight time
      const avgFlightTime =
        validJumpTimes.reduce((acc, jump) => acc + jump.time, 0) /
        validJumpTimes.length;

      // Calculate heights
      const avgHeightReached = calculateHeight(avgFlightTime);

      // For multiple jumps, calculate additional metrics
      if (state.testType === "multipleJumps") {
        const validFlightTimes = validJumpTimes.map((jump) => jump.time);
        const maxFlightTime = Math.max(...validFlightTimes);

        // Calculate performance percentages
        const performances = validFlightTimes.map((time) =>
          Number(((time / maxFlightTime) * 100).toFixed(2))
        );

        // Calculate stiffness values
        const stiffnesses = validJumpTimes.map((jump) =>
          calculateStiffness(jump.time, jump.floorTime)
        );

        // Calculate averages
        const avgFloorTime =
          validJumpTimes.reduce((acc, jump) => acc + jump.floorTime, 0) /
          validJumpTimes.length;
        const avgPerformance =
          performances.reduce((acc, perf) => acc + perf, 0) /
          performances.length;
        const avgStiffness =
          stiffnesses.reduce((acc, stiff) => acc + stiff, 0) /
          stiffnesses.length;

        // Calculate performance drop
        const performanceDrop = getPerformanceDrop(performances);

        return {
          ...state,
          performanceDrop,
          data: {
            avgFlightTime,
            avgHeightReached,
            avgFloorTime,
            avgPerformance,
            avgStiffness,
          },
        };
      }

      // For standard jumps
      return {
        ...state,
        data: {
          ...state.data,
          avgFlightTime,
          avgHeightReached,
        },
      };
    }

    case "FINISH_TEST":
      if (state.jumpTimes.length === 0) {
        return {
          ...state,
          status: "noJumpsError",
        };
      }

      const processedJumpTimes = state.jumpTimes.filter(
        (jump) => jump.time !== 0
      );
      return {
        ...state,
        status: "finished",
        selectedAthletes: [],
      };

    case "RESET_TEST":
      return {
        ...initialTestState,
        startTime: new Date(),
        selectedAthletes: state.selectedAthletes,
        selectedAthletePointer: state.selectedAthletePointer,
      };

    case "SET_IGNORE_JUMP":
      return {
        ...state,
        ignoreJump: action.payload,
      };

    case "TOGGLE_TABLE":
      return {
        ...state,
        showTable: action.payload,
      };

    case "TOGGLE_CHART":
      return {
        ...state,
        showChart: action.payload,
      };

    case "PROCESS_LOG": {
      const { logData, timestamp } = action.payload;

      // 0 for floor, 1 for jumping
      if (state.status === "ready" && logData === 1) {
        if (state.testType === "multipleJumps") {
          if (state.firstJumpFlag) {
            return {
              ...state,
              status: "jumping",
              ignoreJump: false,
              startTime: timestamp,
            };
          }
          const floorTime = getSecondsBetweenDates(state.startTime, timestamp);
          const newJumpTime = {
            deleted: false,
            time: 0,
            heightReached: 0,
            floorTime,
            performance: 0,
            stiffness: 0,
          };
          return {
            ...state,
            status: "jumping",
            startTime: timestamp,
            ignoreJump: false,
            jumpTimes: [...state.jumpTimes, newJumpTime],
          };
        }
        return {
          ...state,
          status: "jumping",
          ignoreJump: false,
          startTime: timestamp,
        };
      }

      if (state.status === "jumping" && logData === 0) {
        const flightTime = getSecondsBetweenDates(state.startTime, timestamp);

        // Check sensitivity
        if (flightTime < state.sensitivity / 1000) {
          // Replace with actual sensitivity
          return {
            ...state,
            status: "ready",
            ignoreJump: true,
            startTime: timestamp,
          };
        }

        if (state.testType === "multipleJumps") {
          if (state.firstJumpFlag) {
            return {
              ...state,
              status: "ready",
              firstJumpFlag: false,
            };
          }
          const newJumpTimes = state.jumpTimes.map((jumpTime, index) =>
            index === state.jumpTimes.length
              ? { ...jumpTime, time: flightTime }
              : jumpTime
          );

          return {
            ...state,
            status: "ready",
            jumpTimes: newJumpTimes,
            startTime: timestamp,
          };
        }

        // Record the jump
        const newJumpTime = {
          deleted: false,
          time: flightTime,
          heightReached: Number(
            (((9.81 * flightTime ** 2) / 8) * 100).toFixed(2)
          ),
          floorTime: 0,
          performance: 0,
          stiffness: 0,
        };

        return {
          ...state,
          status: "ready",
          jumpTimes: [...state.jumpTimes, newJumpTime],
          startTime: timestamp,
        };
      }

      return state;
    }

    default:
      return state;
  }
}
