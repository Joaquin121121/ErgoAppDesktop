import {
  JumpTime,
  DropJumpResult,
  CMJResult,
  SquatJumpResult,
  AbalakovResult,
  boscoTests,
  initialBoscoResults,
  BoscoResult,
  MultipleDropJumpResult,
  MultipleJumpsResult,
  MultipleAthletesTest,
  studyInfoLookup,
  CompletedStudy,
} from "../types/Studies";
import { TestState, TestAction } from "../types/TestReducer";
import { getPerformanceDrop, getSecondsBetweenDates } from "../utils/utils";
import useSerialMonitor from "./useSerialMonitor";
// Initial state

export const initialTestState: TestState = {
  status: "idle",
  jumpTimes: [],
  dropJumpHeights: [],
  dropJumps: [],
  boscoResults: initialBoscoResults,
  takeoffFoot: "left",
  criterion: "time",
  criterionValue: 0,
  startTime: new Date(),
  ignoreJump: false,
  displayError: false,
  showTable: false,
  showChart: false,
  performanceDrop: 0,
  selectedAthletes: [],
  multipleAthletesTests: [],
  testPointer: 0,
  athletePointer: 0,
  sensitivity: 100,
  testType: "cmj",
  firstJumpFlag: true,
  avgFlightTime: 0,
  avgHeightReached: 0,
  avgStiffness: 0,
  avgPerformance: 0,
  avgFloorTime: 0,
  maxAvgHeightReached: 0,
  bestHeight: "0",
  load: 0,
  loadUnit: "kgs",
  heightUnit: "cm",
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

// Helper function to reset state while preserving specified properties
const createResetState = (
  currentState: TestState,
  overrideProps: Partial<TestState> = {}
): TestState => {
  // Properties that should be preserved during resets
  const preservedProps = {
    selectedAthletes: currentState.selectedAthletes,
    takeoffFoot: currentState.takeoffFoot,
    multipleAthletesTests: currentState.multipleAthletesTests,
    sensitivity: currentState.sensitivity,
    athletePointer: currentState.athletePointer,
    testType: currentState.testType,
    dropJumps: currentState.dropJumps,
    dropJumpHeights: currentState.dropJumpHeights,
    testPointer: currentState.testPointer,
  };

  return {
    ...initialTestState,
    ...preservedProps,
    ...overrideProps,
  };
};

const createTest = (currentState: TestState) => {
  switch (currentState.testType) {
    case "cmj":
    case "abalakov":
    case "squatJump":
      const standardResults: CMJResult | AbalakovResult | SquatJumpResult = {
        times: currentState.boscoResults["cmj"].times,
        avgFlightTime: currentState.avgFlightTime,
        avgHeightReached: currentState.avgHeightReached,
        takeoffFoot: currentState.takeoffFoot,
        sensitivity: currentState.sensitivity,
        type: currentState.testType,
        load: currentState.load,
        loadUnit: currentState.loadUnit,
      };

      const completedStandardTest: CompletedStudy = {
        studyInfo: studyInfoLookup[currentState.testType],
        date: new Date(),
        results: standardResults,
      };

      return completedStandardTest;
    case "bosco":
      const boscoResults: BoscoResult = {
        type: currentState.testType,
        cmj: currentState.boscoResults["cmj"],
        abalakov: currentState.boscoResults["abalakov"],
        squatJump: currentState.boscoResults["squatJump"],
      };

      const completedBoscoTest: CompletedStudy = {
        studyInfo: studyInfoLookup[currentState.testType],
        date: new Date(),
        results: boscoResults,
      };
      return completedBoscoTest;
    case "multipleDropJump":
      const multipleDropJumpResults: MultipleDropJumpResult = {
        type: currentState.testType,
        dropJumps: currentState.dropJumps,
        takeoffFoot: currentState.takeoffFoot,
        heightUnit: currentState.heightUnit,
        maxAvgHeightReached: currentState.maxAvgHeightReached,
        bestHeight: currentState.bestHeight,
      };

      const completedMultipleDropJumpsTest: CompletedStudy = {
        studyInfo: studyInfoLookup[currentState.testType],
        date: new Date(),
        results: multipleDropJumpResults,
      };
      return completedMultipleDropJumpsTest;
    case "multipleJumps":
      const multipleJumpsResults: MultipleJumpsResult = {
        type: currentState.testType,
        times: currentState.jumpTimes,
        avgFlightTime: currentState.avgFlightTime,
        avgHeightReached: currentState.avgHeightReached,
        takeoffFoot: currentState.takeoffFoot,
        sensitivity: currentState.sensitivity,
        criteria: currentState.criterion,
        criteriaValue: currentState.criterionValue,
        avgFloorTime: currentState.avgFloorTime,
        avgStiffness: currentState.avgStiffness,
        avgPerformance: currentState.avgPerformance,
        performanceDrop: currentState.performanceDrop,
      };

      const completedMultipleJumpsTest: CompletedStudy = {
        studyInfo: studyInfoLookup[currentState.testType],
        date: new Date(),
        results: multipleJumpsResults,
      };
      return completedMultipleJumpsTest;
  }
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
      if (state.testType === "bosco") {
        const validJumpTimes = state.boscoResults[
          boscoTests[state.testPointer]
        ].times.filter((jump) => !jump.deleted);

        if (validJumpTimes.length === 0) {
          return {
            ...state,
            avgFlightTime: 0,
            avgHeightReached: 0,
          };
        }

        const avgFlightTime =
          validJumpTimes.reduce((acc, jump) => acc + jump.time, 0) /
          validJumpTimes.length;

        // Calculate heights
        const avgHeightReached = calculateHeight(avgFlightTime);

        return {
          ...state,
          avgFlightTime: avgFlightTime,
          avgHeightReached: avgHeightReached,
        };
      }
      if (state.testType === "multipleDropJump") {
        const validJumpTimes = state.dropJumps[state.testPointer].times.filter(
          (jump) => !jump.deleted
        );

        if (validJumpTimes.length === 0) {
          return {
            ...state,
            avgFlightTime: 0,
            avgHeightReached: 0,
          };
        }
        const avgFlightTime =
          validJumpTimes.reduce((acc, jump) => acc + jump.time, 0) /
          validJumpTimes.length;

        // Calculate heights
        const avgHeightReached = calculateHeight(avgFlightTime);

        return {
          ...state,
          dropJumps: state.dropJumps.map((dropJump, index) =>
            index === state.testPointer
              ? {
                  ...dropJump,
                  avgFlightTime: avgFlightTime,
                  avgHeightReached: avgHeightReached,
                }
              : dropJump
          ),
        };
      }
      const validJumpTimes = state.jumpTimes.filter((jump) => !jump.deleted);

      if (validJumpTimes.length === 0) {
        return {
          ...state,
          avgFlightTime: 0,
          avgHeightReached: 0,
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
          avgFlightTime,
          avgHeightReached,
          avgFloorTime,
          avgPerformance,
          avgStiffness,
        };
      }

      // For standard jumps
      return {
        ...state,
        avgFlightTime,
        avgHeightReached,
      };
    }

    case "FINISH_TEST":
      if (state.jumpTimes.length === 0) {
        return {
          ...state,
          status: "noJumpsError",
        };
      }

      if (state.testType === "multipleDropJump") {
        const processedJumpTimes = state.dropJumps[
          state.testPointer
        ].times.filter((jump) => jump.time !== 0);
        const dropJumpResult: DropJumpResult = {
          type: "dropJump",
          height: state.dropJumpHeights[state.testPointer],
          times: processedJumpTimes,
          avgFlightTime: 0,
          avgHeightReached: 0,
          takeoffFoot: "left",
          sensitivity: state.sensitivity,
        };
        return {
          ...state,
          status: "finished",
          dropJumps: [...state.dropJumps, dropJumpResult],
        };
      }
      if (state.testType === "bosco") {
        const processedJumpTimes = state.boscoResults[
          boscoTests[state.testPointer]
        ].times.filter((jump) => !jump.deleted);
        const currentBoscoTestResult:
          | CMJResult
          | SquatJumpResult
          | AbalakovResult = {
          type: boscoTests[state.testPointer] as
            | "cmj"
            | "squatJump"
            | "abalakov",
          load: 0,
          loadUnit: "kgs",
          times: processedJumpTimes,
          avgFlightTime: 0,
          avgHeightReached: 0,
          takeoffFoot: "left",
          sensitivity: state.sensitivity,
        };

        const updatedBoscoResults = {
          ...state.boscoResults,
          [boscoTests[state.testPointer]]: currentBoscoTestResult,
        };
        return {
          ...state,
          status: "finished",
          boscoResults: updatedBoscoResults,
        };
      }
      const processedJumpTimes = state.jumpTimes.filter(
        (jump) => jump.time !== 0
      );
      return {
        ...state,
        status: "finished",
        jumpTimes: processedJumpTimes,
      };

    case "RESET_TEST":
      if (state.testType === "bosco") {
        const resetBoscoResults = {
          ...initialBoscoResults,
          [boscoTests[state.testPointer]]: {
            ...initialBoscoResults[boscoTests[state.testPointer]],
          },
        };
        return createResetState(state, {
          startTime: new Date(),
          boscoResults: resetBoscoResults,
        });
      }

      if (state.testType === "multipleDropJump") {
        const resetDropJumps = state.dropJumps.map((dropJump, index) =>
          index === state.testPointer
            ? dropJump
            : { ...dropJump, avgFlightTime: 0, avgHeightReached: 0, times: [] }
        );
        return createResetState(state, {
          startTime: new Date(),
          dropJumps: resetDropJumps,
        });
      }

      return createResetState(state, {
        startTime: new Date(),
      });

    case "PREVIOUS_TEST":
      const previousTestPointer = state.testPointer - 1;

      if (state.testPointer > 0) {
        return createResetState(state, {
          testPointer: previousTestPointer,
          status: "idle",
        });
      }

      return { ...state };

    case "NEXT_TEST":
      const nextTestPointer = state.testPointer + 1;

      if (
        (state.testType === "bosco" && state.testPointer < boscoTests.length) ||
        (state.testType === "multipleDropJump" &&
          state.testPointer < state.dropJumpHeights.length)
      ) {
        return createResetState(state, {
          testPointer: nextTestPointer,
          status: "idle",
        });
      }

      return { ...state };

    case "PREVIOUS_ATHLETE":
      const previousAthletePointer = state.athletePointer - 1;

      if (state.athletePointer === 0 || state.selectedAthletes.length === 0) {
        return { ...state };
      }
      {
        const updatedMultipleAthleteTests: MultipleAthletesTest[] =
          state.multipleAthletesTests.map((test, i) =>
            i === state.athletePointer
              ? {
                  athleteName:
                    state.selectedAthletes[state.athletePointer].name,
                  test: createTest(state),
                  testType: state.testType,
                }
              : test
          );

        return createResetState(state, {
          status: "finished",
          athletePointer: previousAthletePointer,
          multipleAthletesTests: updatedMultipleAthleteTests,
        });
      }

    case "NEXT_ATHLETE":
      const nextAthletePointer = state.athletePointer + 1;

      if (state.athletePointer === state.selectedAthletes.length) {
        return { ...state };
      }
      {
        const updatedMultipleAthleteTests: MultipleAthletesTest[] =
          state.multipleAthletesTests.map((test, i) =>
            i === state.athletePointer
              ? {
                  athleteName:
                    state.selectedAthletes[state.athletePointer].name,
                  test: createTest(state),
                  testType: state.testType,
                }
              : test
          );

        return createResetState(state, {
          status:
            state.multipleAthletesTests.length === state.athletePointer
              ? "idle"
              : "finished",
          athletePointer: nextAthletePointer,
          multipleAthletesTests: updatedMultipleAthleteTests,
        });
      }

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
            index === state.jumpTimes.length - 1
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

        if (state.testType === "bosco") {
          const updatedBoscoTimes = [
            ...state.boscoResults[boscoTests[state.testPointer]].times,
            newJumpTime,
          ];
          return {
            ...state,
            status: "ready",
            startTime: timestamp,
            boscoResults: {
              ...state.boscoResults,
              [boscoTests[state.testPointer]]: {
                ...state.boscoResults[boscoTests[state.testPointer]],
                times: updatedBoscoTimes,
              },
            },
          };
        }

        if (state.testType === "multipleDropJump") {
          const updatedDropJumpTimes = [
            ...state.dropJumps[state.testPointer].times,
            newJumpTime,
          ];
          return {
            ...state,
            status: "ready",
            startTime: timestamp,
            dropJumps: state.dropJumps.map((dropJump, index) =>
              index === state.testPointer
                ? {
                    ...dropJump,
                    times: updatedDropJumpTimes,
                  }
                : dropJump
            ),
          };
        }

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
