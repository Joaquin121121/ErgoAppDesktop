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
  createTest,
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
  athlete: {
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
  },
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
    athlete: currentState.athlete,
  };

  return {
    ...initialTestState,
    ...preservedProps,
    ...overrideProps,
  };
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
          avgFlightTime: avgFlightTime,
          avgHeightReached: avgHeightReached,
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
          Number((time / maxFlightTime) * 100)
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
      const processedJumpTimes = state.jumpTimes.filter(
        (jump) => jump.time !== 0
      );
      return {
        ...state,
        status: "finished",
        jumpTimes: processedJumpTimes,
      };

    case "RESET_TEST":
      return createResetState(state, {
        startTime: new Date(),
      });

    case "PREVIOUS_TEST":
      const previousTestPointer = state.testPointer - 1;

      if (state.testPointer === 0) {
        return { ...state };
      }
      if (state.testType === "bosco") {
        const newBoscoResults = {
          ...state.boscoResults,
          [boscoTests[previousTestPointer]]: {
            ...state.boscoResults[boscoTests[previousTestPointer]],
            times: state.jumpTimes,
          },
        };
        return createResetState(state, {
          testPointer: previousTestPointer,
          status: "finished",
          avgFlightTime:
            state.boscoResults[boscoTests[previousTestPointer]].avgFlightTime,
          avgHeightReached:
            state.boscoResults[boscoTests[previousTestPointer]]
              .avgHeightReached,
          jumpTimes: state.boscoResults[boscoTests[previousTestPointer]].times,
          boscoResults: newBoscoResults,
        });
      }
      if (state.testType === "multipleDropJump") {
        const newDropJumps = state.dropJumps.map((dropJump, index) =>
          index === previousTestPointer
            ? dropJump
            : {
                ...dropJump,
                times: state.jumpTimes,
                avgFlightTime: state.avgFlightTime,
                avgHeightReached: state.avgHeightReached,
              }
        );
        return createResetState(state, {
          testPointer: previousTestPointer,
          status: "finished",
          avgFlightTime: state.dropJumps[previousTestPointer].avgFlightTime,
          avgHeightReached:
            state.dropJumps[previousTestPointer].avgHeightReached,
          jumpTimes: state.dropJumps[previousTestPointer].times,
          dropJumps: newDropJumps,
        });
      }
      return { ...state };

    case "NEXT_TEST":
      const nextTestPointer = state.testPointer + 1;

      if (
        (state.testType === "bosco" &&
          state.testPointer === boscoTests.length) ||
        (state.testType === "multipleDropJump" &&
          state.testPointer === state.dropJumpHeights.length)
      ) {
        return { ...state };
      }

      if (state.testType === "bosco") {
        const newBoscoResults = {
          ...state.boscoResults,
          [boscoTests[state.testPointer]]: {
            ...state.boscoResults[boscoTests[state.testPointer]],
            times: state.jumpTimes,
            avgFlightTime: state.avgFlightTime,
            avgHeightReached: state.avgHeightReached,
          },
        };

        if (
          state.boscoResults[boscoTests[nextTestPointer]].times.length === 0
        ) {
          return createResetState(state, {
            ...state,
            testPointer: nextTestPointer,
            status: "idle",
            boscoResults: newBoscoResults,
          });
        }
        return createResetState(state, {
          ...state,
          testPointer: nextTestPointer,
          status: "finished",
          avgFlightTime:
            state.boscoResults[boscoTests[nextTestPointer]].avgFlightTime,
          avgHeightReached:
            state.boscoResults[boscoTests[nextTestPointer]].avgHeightReached,
          jumpTimes: state.boscoResults[boscoTests[nextTestPointer]].times,
          boscoResults: newBoscoResults,
        });
      }
      if (state.testType === "multipleDropJump") {
        const newDropJumps = state.dropJumps.map((dropJump, index) =>
          index === state.testPointer
            ? dropJump
            : {
                ...dropJump,
                times: state.jumpTimes,
                avgFlightTime: state.avgFlightTime,
                avgHeightReached: state.avgHeightReached,
              }
        );
        if (newDropJumps[nextTestPointer].times.length === 0) {
          return createResetState(state, {
            ...state,
            testPointer: nextTestPointer,
            status: "idle",
            dropJumps: newDropJumps,
          });
        }
        return createResetState(state, {
          ...state,
          testPointer: nextTestPointer,
          status: "finished",
          avgFlightTime: state.dropJumps[nextTestPointer].avgFlightTime,
          avgHeightReached: state.dropJumps[nextTestPointer].avgHeightReached,
          jumpTimes: state.dropJumps[nextTestPointer].times,
          dropJumps: newDropJumps,
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
        const previousTest =
          updatedMultipleAthleteTests[previousAthletePointer].test;

        if (previousTest.results.type === "multipleJumps") {
          return createResetState(state, {
            status: "finished",
            athletePointer: previousAthletePointer,
            multipleAthletesTests: updatedMultipleAthleteTests,
            avgFlightTime: previousTest.results.avgFlightTime,
            avgHeightReached: previousTest.results.avgHeightReached,
            avgStiffness: previousTest.results.avgStiffness,
            avgPerformance: previousTest.results.avgPerformance,
            avgFloorTime: previousTest.results.avgFloorTime,
            performanceDrop: previousTest.results.performanceDrop,
            athlete: state.selectedAthletes[previousAthletePointer],
          });
        }
        if (previousTest.results.type === "bosco") {
          return createResetState(state, {
            status: "finished",
            athletePointer: previousAthletePointer,
            multipleAthletesTests: updatedMultipleAthleteTests,
            avgFlightTime: previousTest.results.squatJump.avgFlightTime,
            avgHeightReached: previousTest.results.squatJump.avgHeightReached,
            testPointer: 0,
            athlete: state.selectedAthletes[previousAthletePointer],
          });
        }
        if (previousTest.results.type === "multipleDropJump") {
          return createResetState(state, {
            status: "finished",
            athletePointer: previousAthletePointer,
            multipleAthletesTests: updatedMultipleAthleteTests,
            avgFlightTime: previousTest.results.dropJumps[0].avgFlightTime,
            avgHeightReached:
              previousTest.results.dropJumps[0].avgHeightReached,
            testPointer: 0,
            athlete: state.selectedAthletes[previousAthletePointer],
          });
        }

        return createResetState(state, {
          status: "finished",
          athletePointer: previousAthletePointer,
          multipleAthletesTests: updatedMultipleAthleteTests,
          avgHeightReached: previousTest.results.avgHeightReached,
          avgFlightTime: previousTest.results.avgFlightTime,
          athlete: state.selectedAthletes[previousAthletePointer],
        });
      }

    case "NEXT_ATHLETE":
      const nextAthletePointer = state.athletePointer + 1;

      if (state.athletePointer === state.selectedAthletes.length) {
        return { ...state };
      }

      const updatedMultipleAthleteTests: MultipleAthletesTest[] =
        state.multipleAthletesTests.map((test, i) =>
          i === state.athletePointer
            ? {
                athleteName: state.selectedAthletes[state.athletePointer].name,
                test: createTest(state),
                testType: state.testType,
              }
            : test
        );
      if (state.athletePointer === updatedMultipleAthleteTests.length) {
        return createResetState(state, {
          multipleAthletesTests: updatedMultipleAthleteTests,
          status: "idle",
          testPointer: 0,
          athletePointer: nextAthletePointer,
          athlete: state.selectedAthletes[nextAthletePointer],
        });
      }

      const nextTest = updatedMultipleAthleteTests[nextAthletePointer].test;

      if (nextTest.results.type === "multipleJumps") {
        return createResetState(state, {
          status: "finished",
          athletePointer: nextAthletePointer,
          multipleAthletesTests: updatedMultipleAthleteTests,
          jumpTimes: nextTest.results.times,
          avgFlightTime: nextTest.results.avgFlightTime,
          avgHeightReached: nextTest.results.avgHeightReached,
          avgStiffness: nextTest.results.avgStiffness,
          avgPerformance: nextTest.results.avgPerformance,
          avgFloorTime: nextTest.results.avgFloorTime,
          performanceDrop: nextTest.results.performanceDrop,
          athlete: state.selectedAthletes[nextAthletePointer],
        });
      }
      if (nextTest.results.type === "bosco") {
        return createResetState(state, {
          status: "finished",
          athletePointer: nextAthletePointer,
          multipleAthletesTests: updatedMultipleAthleteTests,
          avgFlightTime: nextTest.results.squatJump.avgFlightTime,
          avgHeightReached: nextTest.results.squatJump.avgHeightReached,
          jumpTimes: nextTest.results.squatJump.times,
          testPointer: 0,
          athlete: state.selectedAthletes[nextAthletePointer],
        });
      }
      if (nextTest.results.type === "multipleDropJump") {
        return createResetState(state, {
          status: "finished",
          athletePointer: nextAthletePointer,
          multipleAthletesTests: updatedMultipleAthleteTests,
          avgFlightTime: nextTest.results.dropJumps[0].avgFlightTime,
          avgHeightReached: nextTest.results.dropJumps[0].avgHeightReached,
          jumpTimes: nextTest.results.dropJumps[0].times,
          testPointer: 0,
          athlete: state.selectedAthletes[nextAthletePointer],
        });
      }

      return createResetState(state, {
        status: "finished",
        athletePointer: nextAthletePointer,
        multipleAthletesTests: updatedMultipleAthleteTests,
        avgHeightReached: nextTest.results.avgHeightReached,
        avgFlightTime: nextTest.results.avgFlightTime,
        jumpTimes: nextTest.results.times,
        athlete: state.selectedAthletes[nextAthletePointer],
      });

    case "JUMP_TO_ATHLETE":
      const targetAthletePointer = action.payload;

      if (
        targetAthletePointer >= state.selectedAthletes.length ||
        targetAthletePointer < 0
      ) {
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
        const targetTest =
          updatedMultipleAthleteTests[targetAthletePointer].test;

        if (
          !updatedMultipleAthleteTests.some(
            (test) =>
              test.athleteName ===
              state.selectedAthletes[targetAthletePointer].name
          )
        ) {
          return createResetState(state, {
            multipleAthletesTests: updatedMultipleAthleteTests,
            status: "idle",
            testPointer: 0,
            athletePointer: targetAthletePointer,
            athlete: state.selectedAthletes[targetAthletePointer],
          });
        }

        if (targetTest.results.type === "multipleJumps") {
          return createResetState(state, {
            status: "finished",
            athletePointer: targetAthletePointer,
            multipleAthletesTests: updatedMultipleAthleteTests,
            avgFlightTime: targetTest.results.avgFlightTime,
            avgHeightReached: targetTest.results.avgHeightReached,
            avgStiffness: targetTest.results.avgStiffness,
            avgPerformance: targetTest.results.avgPerformance,
            avgFloorTime: targetTest.results.avgFloorTime,
            performanceDrop: targetTest.results.performanceDrop,
            athlete: state.selectedAthletes[targetAthletePointer],
          });
        }
        if (targetTest.results.type === "bosco") {
          return createResetState(state, {
            status: "finished",
            athletePointer: targetAthletePointer,
            multipleAthletesTests: updatedMultipleAthleteTests,
            avgFlightTime: targetTest.results.squatJump.avgFlightTime,
            avgHeightReached: targetTest.results.squatJump.avgHeightReached,
            testPointer: 0,
            athlete: state.selectedAthletes[previousAthletePointer],
          });
        }
        if (targetTest.results.type === "multipleDropJump") {
          return createResetState(state, {
            status: "finished",
            athletePointer: targetAthletePointer,
            multipleAthletesTests: updatedMultipleAthleteTests,
            avgFlightTime: targetTest.results.dropJumps[0].avgFlightTime,
            avgHeightReached: targetTest.results.dropJumps[0].avgHeightReached,
            testPointer: 0,
            athlete: state.selectedAthletes[targetAthletePointer],
          });
        }

        return createResetState(state, {
          status: "finished",
          athletePointer: targetAthletePointer,
          multipleAthletesTests: updatedMultipleAthleteTests,
          avgHeightReached: targetTest.results.avgHeightReached,
          avgFlightTime: targetTest.results.avgFlightTime,
          athlete: state.selectedAthletes[targetAthletePointer],
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
        const newJumpTime: JumpTime = {
          deleted: false,
          time: flightTime,
          heightReached: Number(((9.81 * flightTime ** 2) / 8) * 100),
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

    case "SET_ATHLETE":
      return {
        ...state,
        athlete: action.payload,
      };

    case "RESET_ATHLETE":
      return {
        ...state,
        athlete: initialTestState.athlete,
      };

    case "SET_SELECTED_ATHLETES":
      return {
        ...state,
        selectedAthletes: action.payload,
      };

    case "SET_TAKEOFF_FOOT":
      return {
        ...state,
        takeoffFoot: action.payload,
      };

    case "SET_LOAD":
      return {
        ...state,
        load: action.payload,
      };

    case "SET_LOAD_UNIT":
      return {
        ...state,
        loadUnit: action.payload,
      };

    case "SET_HEIGHT_UNIT":
      return {
        ...state,
        heightUnit: action.payload,
      };

    case "SET_CRITERION":
      return {
        ...state,
        criterion: action.payload,
      };

    case "SET_CRITERION_VALUE":
      return {
        ...state,
        criterionValue: action.payload,
      };

    case "SET_SENSITIVITY":
      return {
        ...state,
        sensitivity: action.payload,
      };

    case "SET_DROP_JUMPS":
      return {
        ...state,
        dropJumps: action.payload,
      };

    // This action is needed for the multipleDropJump test type
    case "SET_DROP_JUMP_HEIGHTS":
      return {
        ...state,
        dropJumpHeights: action.payload,
      };

    case "SET_TEST_TYPE":
      return {
        ...state,
        testType: action.payload,
      };

    default:
      return state;
  }
}
