import React, { useState, useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import TonalButton from "./TonalButton";
import useSerialMonitor from "../hooks/useSerialMonitor";
import { getSecondsBetweenDates } from "../utils/utils";
import OutlinedButton from "./OutlinedButton";
import scrollBarStyles from "../styles/scrollbar.module.css";
import {
  CompletedStudy,
  studyInfoLookup,
  BoscoResult,
  JumpTime,
  StudyData,
  MultipleDropJumpResult,
  DropJumpResult,
  criterionLookup,
  boscoTests,
  multipleJumpsAverageDisplay,
  defaultAverageDisplay,
} from "../types/Studies";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase, getPerformanceDrop } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ErrorDisplay from "./ErrorDisplay";
import ChartDisplay from "./MultipleJumpsChartDisplay";
import MultipleDropJumpChartDisplay from "./MultipleDropJumpChartDisplay";
import navAnimations from "../styles/animations.module.css";
import {
  Bar,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ComposedChart } from "recharts";
import { useBlur } from "../contexts/BlurContext";
import { addResult, addMultipleResults } from "../hooks/parseStudies";
import { useDatabaseSync } from "../hooks/useDatabaseSync";
import { Athlete } from "@/types/Athletes";
interface MultipleAthletesTest {
  athleteName: string;
  test: CompletedStudy;
  testType: string;
}

function TestInProgress({
  setTestInProgress,
  customNavigate,
  tests,
  setSelectedOption,
}: {
  setTestInProgress: (testInProgress: boolean) => void;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
  tests: string[];
  setSelectedOption: (selectedOption: string) => void;
}) {
  const [multipleAthletesTests, setMultipleAthletesTests] = useState<
    MultipleAthletesTest[]
  >([]);
  const [selectedAthletePointer, setSelectedAthletePointer] = useState(0);

  const [data, setData] = useState<StudyData>({
    avgFlightTime: 0,
    avgHeightReached: 0,
  });
  const [pointer, setPointer] = useState(0);
  const [errorTimeout, setErrorTimeout] = useState(null);
  const [displayError, setDisplayError] = useState(false);
  const [displayErrorPopup, setDisplayErrorPopup] = useState(false);
  const [ignoreJump, setIgnoreJump] = useState(false);
  const { serialData, error, startSerialListener, logs, isConnected } =
    useSerialMonitor();
  const {
    study,
    setStudy,
    athlete,
    setAthlete,
    selectedAthletes,
    setSelectedAthletes,
  } = useStudyContext();
  const [status, setStatus] = useState(
    selectedAthletes.length > 0 ? "pendingEvaluation" : "Súbase a la alfombra"
  );
  const { isBlurred, setIsBlurred } = useBlur();
  const { saveJson, readJson } = useJsonFiles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { syncResult } = useDatabaseSync();
  const [skippedAthletes, setSkippedAthletes] = useState<Athlete[]>([]);
  const [startTime, setStartTime] = useState(new Date());
  const [flightTimes, setFlightTimes] = useState<number[]>([]);
  const [floorTimes, setFloorTimes] = useState<number[]>([]);
  const [performance, setPerformance] = useState<number[]>([]);
  const [stiffness, setStiffness] = useState<number[]>([]);
  const [jumpTimes, setJumpTimes] = useState<JumpTime[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [tableAnimation, setTableAnimation] = useState("");
  const [chartAnimation, setChartAnimation] = useState("");
  const [displayMetric, setDisplayMetric] = useState<
    "height" | "time" | "performance"
  >("height");
  const [performanceDrop, setPerformanceDrop] = useState(0);
  const [boscoResults, setBoscoResults] = useState<BoscoResult>({
    type: "bosco",
    cmj: {
      avgFlightTime: 0,
      avgHeightReached: 0,
      times: jumpTimes,
      type: "cmj",
      takeoffFoot: "both",
      sensitivity: study.sensitivity,
      load: 0,
      loadUnit: "kgs",
    },
    squatJump: {
      avgFlightTime: 0,
      avgHeightReached: 0,
      times: jumpTimes,
      type: "squatJump",
      takeoffFoot: "both",
      sensitivity: study.sensitivity,
      load: 0,
      loadUnit: "kgs",
    },
    abalakov: {
      avgFlightTime: 0,
      avgHeightReached: 0,
      times: jumpTimes,
      type: "abalakov",
      takeoffFoot: "both",
      sensitivity: study.sensitivity,
      load: 0,
      loadUnit: "kgs",
    },
  });
  const [criteriaValue, setCriteriaValue] = useState(0);
  const [intervalID, setIntervalID] = useState(null);
  const [multipleDropJumpResults, setMultipleDropJumpResults] =
    useState<MultipleDropJumpResult | null>(
      study.type === "multipleDropJump"
        ? {
            heightUnit: study.heightUnit,
            type: study.type,
            dropJumps: [],
            maxAvgHeightReached: 0,
            bestHeight: "",
            takeoffFoot: study.takeoffFoot,
          }
        : null
    );
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentJumpElapsedTime, setCurrentJumpElapsedTime] = useState(0);
  const [growthTimerInterval, setGrowthTimerInterval] =
    useState<NodeJS.Timeout | null>(null);

  const tableJSX = (
    <table className="w-full mt-8">
      <thead className="w-full">
        <tr className="flex justify-around items-center w-full">
          <th className="text-2xl w-20 font-normal text-tertiary">Saltos</th>
          <th className="text-2xl w-52 font-normal text-tertiary">
            Tiempo de Vuelo
          </th>
          {study.type === "multipleJumps" && (
            <th className="text-2xl w-52 font-normal text-tertiary">
              Tiempo de Piso
            </th>
          )}
          <th className="text-2xl w-36 font-normal text-tertiary">Altura</th>
          {study.type === "multipleJumps" && (
            <>
              <th className="text-2xl w-36 font-normal text-tertiary">
                Stiffness
              </th>
              <th className="text-2xl w-36 font-normal text-tertiary">
                Rendimiento
              </th>
            </>
          )}
          <th className="text-2xl w-24 font-normal text-tertiary">Eliminar</th>
        </tr>
      </thead>
      <tbody
        className={`w-full block ${scrollBarStyles.customScrollbar}`}
        style={{
          maxHeight: showTable ? "600px" : "200px",
          overflowY: "auto",
        }}
      >
        {jumpTimes?.map((e, i) => (
          <tr
            key={i}
            className="text-tertiary border border-transparent text-xl flex rounded-2xl justify-around items-center w-full hover:text-secondary hover:bg-lightRed  hover:border-secondary transition-all 300s ease-linear"
          >
            <td
              className="text-inherit w-20 flex items-center justify-center"
              style={{
                opacity: e.deleted && "60%",
                color: e.deleted && "#9E9E9E",
              }}
            >
              {i + 1}
            </td>
            <td
              className="text-inherit w-52 flex items-center justify-center"
              style={{ opacity: e.deleted && "60%" }}
            >
              {e.time ? `${e.time.toFixed(2)} s` : "-"}
            </td>
            {study.type === "multipleJumps" && (
              <td
                className="text-inherit w-52 flex items-center justify-center"
                style={{ opacity: e.deleted && "60%" }}
              >
                {e.floorTime ? `${e.floorTime.toFixed(2)} s` : "-"}
              </td>
            )}
            <td
              className="text-inherit opacity w-36 flex items-center justify-center"
              style={{ opacity: e.deleted && "60%" }}
            >
              {e.time
                ? `${(((9.81 * e.time ** 2) / 8) * 100).toFixed(2)} cm`
                : "-"}
            </td>
            {study.type === "multipleJumps" && (
              <>
                <td
                  className="text-inherit opacity w-36 flex items-center justify-center"
                  style={{ opacity: e.deleted && "60%" }}
                >
                  {e.stiffness ? `${e.stiffness.toFixed(2)}` : "-"}
                </td>
                <td
                  className="text-inherit opacity w-36 flex items-center justify-center"
                  style={{ opacity: e.deleted && "60%" }}
                >
                  {e.performance ? `${e.performance.toFixed(2)}%` : "-"}
                </td>
              </>
            )}
            <td className="w-24 flex items-center justify-center ">
              <img
                src={`/${e.deleted ? "undo" : "close"}.png`}
                className="h-6 w-6 hover:opacity-70 transition-all cursor-pointer duration-200"
                alt=""
                onClick={() => {
                  handleDelete(i);
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot className="w-full block">
        <tr className="text-darkGray border border-transparent text-xl flex rounded-2xl justify-around items-center w-full hover:text-secondary hover:bg-lightRed hover:border-secondary transition-all 300ms linear">
          <td className="text-secondary w-20 flex items-center justify-center">
            Promedios
          </td>
          <td className="text-secondary w-52 flex items-center justify-center">
            {data?.avgFlightTime && !Number.isNaN(data.avgFlightTime)
              ? `${data.avgFlightTime.toFixed(2)} s`
              : "-"}
          </td>
          {study.type === "multipleJumps" && (
            <td className="text-secondary w-52 flex items-center justify-center">
              {data?.avgFloorTime && !Number.isNaN(data.avgFloorTime)
                ? `${data.avgFloorTime.toFixed(2)} s`
                : "-"}
            </td>
          )}
          <td className="text-secondary w-36 flex items-center justify-center">
            {data?.avgHeightReached && !Number.isNaN(data.avgHeightReached)
              ? `${data.avgHeightReached.toFixed(2)} cm`
              : "-"}
          </td>
          {study.type === "multipleJumps" && (
            <>
              <td className="text-secondary w-36 flex items-center justify-center">
                {data?.avgStiffness && !Number.isNaN(data.avgStiffness)
                  ? `${data.avgStiffness.toFixed(2)}`
                  : "-"}
              </td>
              <td className="text-secondary w-36 flex items-center justify-center">
                {data?.avgPerformance && !Number.isNaN(data.avgPerformance)
                  ? `${data.avgPerformance.toFixed(2)} %`
                  : "-"}
              </td>
            </>
          )}
          <td className="w-24 opacity-0 flex items-center justify-center">
            <img
              src="/close.png"
              className="h-6 w-6 hover:opacity-70 transition-all duration-200"
              alt=""
            />
          </td>
        </tr>
      </tfoot>
    </table>
  );

  const skipAthlete = () => {
    const athleteId = selectedAthletes[selectedAthletePointer].id;
    const newSelectedAthletes = selectedAthletes.filter(
      (athlete) => athlete.id !== athleteId
    );
    if (selectedAthletePointer === newSelectedAthletes.length) {
      saveAllTests(false, newSelectedAthletes);
      return;
    }
    setSelectedAthletes(newSelectedAthletes);
    setSkippedAthletes([
      ...skippedAthletes,
      selectedAthletes[selectedAthletePointer],
    ]);
  };

  const jumpToAthlete = (athleteIndex: number, ommited = false) => {
    if (ommited) {
      const newSelectedAthletes = [
        ...selectedAthletes.slice(0, selectedAthletePointer),
        skippedAthletes[athleteIndex],
        ...selectedAthletes.slice(selectedAthletePointer),
      ];
      const newSkippedAthletes = skippedAthletes.filter(
        (athlete) => athlete.id !== skippedAthletes[athleteIndex].id
      );
      setSelectedAthletes(newSelectedAthletes);
      setSkippedAthletes(newSkippedAthletes);
      setStatus("pendingEvaluation");
      return;
    }

    if (!multipleAthletesTests[athleteIndex]) {
      const newSelectedAthletes = [
        ...selectedAthletes.slice(0, multipleAthletesTests.length),
        selectedAthletes[athleteIndex],
        ...selectedAthletes
          .slice(multipleAthletesTests.length)
          .filter(
            (athlete) => athlete.id !== selectedAthletes[athleteIndex].id
          ),
      ];
      setSelectedAthletes(newSelectedAthletes);

      setStatus("pendingEvaluation");
      return;
    }
    setSelectedAthletePointer(athleteIndex);
    const relevantTest = multipleAthletesTests[athleteIndex].test;
    const parsedJumpTimes =
      relevantTest.results.type === "bosco"
        ? relevantTest.results[boscoTests[pointer]].times
        : relevantTest.results.type === "multipleDropJump"
        ? relevantTest.results.dropJumps[pointer].times
        : relevantTest.results.times;
    setJumpTimes(parsedJumpTimes);
    setFlightTimes(parsedJumpTimes.map((e) => e.time));
    setFloorTimes(parsedJumpTimes.map((e) => e.floorTime));
    setPerformance(parsedJumpTimes.map((e) => e.performance));
    setStiffness(parsedJumpTimes.map((e) => e.stiffness));
    const relevantAverages =
      relevantTest.results.type === "multipleJumps"
        ? multipleJumpsAverageDisplay
        : defaultAverageDisplay;
    setData(
      relevantAverages.reduce((acc, curr) => {
        acc[curr] = relevantTest.results[curr];
        return acc;
      }, {})
    );

    if (relevantTest.results.type === "bosco") {
      setBoscoResults(relevantTest.results);
      setData({
        avgFlightTime: relevantTest.results[boscoTests[0]].avgFlightTime,
        avgHeightReached: relevantTest.results[boscoTests[0]].avgHeightReached,
      });
    }
    if (relevantTest.results.type === "multipleDropJump") {
      setMultipleDropJumpResults(relevantTest.results);
      setData({
        avgFlightTime: relevantTest.results.dropJumps[0].avgFlightTime,
        avgHeightReached: relevantTest.results.dropJumps[0].avgHeightReached,
      });
    }
    setPointer(0);
    setStatus("Finalizado");
  };
  const previousAthlete = () => {
    saveTest();
    const relevantTest = multipleAthletesTests[selectedAthletePointer - 1].test;
    const parsedJumpTimes =
      relevantTest.results.type === "bosco"
        ? relevantTest.results[boscoTests[pointer]].times
        : relevantTest.results.type === "multipleDropJump"
        ? relevantTest.results.dropJumps[pointer].times
        : relevantTest.results.times;
    setJumpTimes(parsedJumpTimes);
    setFlightTimes(parsedJumpTimes.map((e) => e.time));
    setFloorTimes(parsedJumpTimes.map((e) => e.floorTime));
    setPerformance(parsedJumpTimes.map((e) => e.performance));
    setStiffness(parsedJumpTimes.map((e) => e.stiffness));
    const relevantAverages =
      relevantTest.results.type === "multipleJumps"
        ? multipleJumpsAverageDisplay
        : defaultAverageDisplay;
    setData(
      relevantAverages.reduce((acc, curr) => {
        acc[curr] = relevantTest.results[curr];
        return acc;
      }, {})
    );

    if (relevantTest.results.type === "bosco") {
      setBoscoResults(relevantTest.results);
      setData({
        avgFlightTime: relevantTest.results[boscoTests[0]].avgFlightTime,
        avgHeightReached: relevantTest.results[boscoTests[0]].avgHeightReached,
      });
      setPointer(0);
    }
    if (relevantTest.results.type === "multipleDropJump") {
      setMultipleDropJumpResults(relevantTest.results);
      setData({
        avgFlightTime: relevantTest.results.dropJumps[0].avgFlightTime,
        avgHeightReached: relevantTest.results.dropJumps[0].avgHeightReached,
      });
      setPointer(0);
    }

    setSelectedAthletePointer(selectedAthletePointer - 1);
  };

  const nextAthlete = () => {
    saveTest();
    if (!multipleAthletesTests[selectedAthletePointer + 1]) {
      resetTest();
      setSelectedAthletePointer(selectedAthletePointer + 1);
      setPointer(0);
      setBoscoResults({
        type: "bosco",
        cmj: {
          avgFlightTime: 0,
          avgHeightReached: 0,
          times: [],
          type: "cmj",
          takeoffFoot: "both",
          sensitivity: study.sensitivity,
          load: 0,
          loadUnit: "kgs",
        },
        squatJump: {
          avgFlightTime: 0,
          avgHeightReached: 0,
          times: [],
          type: "squatJump",
          takeoffFoot: "both",
          sensitivity: study.sensitivity,
          load: 0,
          loadUnit: "kgs",
        },
        abalakov: {
          avgFlightTime: 0,
          avgHeightReached: 0,
          times: [],
          type: "abalakov",
          takeoffFoot: "both",
          sensitivity: study.sensitivity,
          load: 0,
          loadUnit: "kgs",
        },
      });
      setMultipleDropJumpResults(
        study.type === "multipleDropJump"
          ? {
              heightUnit: study.heightUnit,
              type: study.type,
              dropJumps: [],
              maxAvgHeightReached: 0,
              bestHeight: "",
              takeoffFoot: study.takeoffFoot,
            }
          : null
      );
      setSelectedAthletePointer(selectedAthletePointer + 1);
      setStatus("pendingEvaluation");
      return;
    }
    const relevantTest = multipleAthletesTests[selectedAthletePointer + 1].test;
    const parsedJumpTimes =
      relevantTest.results.type === "bosco"
        ? relevantTest.results[tests[0]].times
        : relevantTest.results.type === "multipleDropJump"
        ? relevantTest.results.dropJumps[0].times
        : relevantTest.results.times;
    setJumpTimes(parsedJumpTimes);
    setFlightTimes(parsedJumpTimes.map((e) => e.time));
    setFloorTimes(parsedJumpTimes.map((e) => e.floorTime));
    setPerformance(parsedJumpTimes.map((e) => e.performance));
    setStiffness(parsedJumpTimes.map((e) => e.stiffness));
    const relevantAverages =
      relevantTest.results.type === "multipleJumps"
        ? multipleJumpsAverageDisplay
        : defaultAverageDisplay;
    setData(
      relevantAverages.reduce((acc, curr) => {
        acc[curr] = relevantTest.results[curr];
        return acc;
      }, {})
    );
    if (relevantTest.results.type === "bosco") {
      setBoscoResults(relevantTest.results);
      setData({
        avgFlightTime: relevantTest.results[boscoTests[0]].avgFlightTime,
        avgHeightReached: relevantTest.results[boscoTests[0]].avgHeightReached,
      });
      setPointer(0);
    }
    if (relevantTest.results.type === "multipleDropJump") {
      setMultipleDropJumpResults(relevantTest.results);
      setData({
        avgFlightTime: relevantTest.results.dropJumps[0].avgFlightTime,
        avgHeightReached: relevantTest.results.dropJumps[0].avgHeightReached,
      });
      setPointer(0);
    }

    setSelectedAthletePointer(selectedAthletePointer + 1);
  };

  const resetTest = () => {
    setJumpTimes([]);
    setFlightTimes([]);
    setFloorTimes([]);
    setPerformance([]);
    setStiffness([]);
    setData({
      avgFlightTime: 0,
      avgHeightReached: 0,
      avgFloorTime: 0,
      avgPerformance: 0,
      avgStiffness: 0,
    });
    setChartData([]);
    setCurrentJumpElapsedTime(0);
    if (growthTimerInterval) {
      clearInterval(growthTimerInterval);
      setGrowthTimerInterval(null);
    }
    setStatus("Súbase a la alfombra");
  };

  const previousTest = () => {
    const newPointer = pointer - 1;
    if (study.type === "multipleDropJump") {
      const updatedMultipleDropJumpResults = {
        ...multipleDropJumpResults,
        dropJumps:
          pointer < multipleDropJumpResults.dropJumps.length
            ? multipleDropJumpResults.dropJumps.map((dropJump, index) =>
                index === pointer
                  ? {
                      avgHeightReached: data.avgHeightReached,
                      times: jumpTimes,
                      avgFlightTime: data.avgFlightTime,
                      type: "dropJump" as const,
                      height: study.dropJumpHeights[pointer],
                      takeoffFoot: study.takeoffFoot,
                      sensitivity: study.sensitivity,
                      stiffness: stiffness[pointer],
                    }
                  : dropJump
              )
            : [
                ...multipleDropJumpResults.dropJumps,
                {
                  avgHeightReached: data.avgHeightReached,
                  times: jumpTimes,
                  avgFlightTime: data.avgFlightTime,
                  type: "dropJump" as const,
                  height: study.dropJumpHeights[pointer],
                  takeoffFoot: study.takeoffFoot,
                  sensitivity: study.sensitivity,
                  stiffness: stiffness[pointer],
                },
              ],
        maxAvgHeightReached: 0,
      };
      setMultipleDropJumpResults(updatedMultipleDropJumpResults);
      setJumpTimes(updatedMultipleDropJumpResults.dropJumps[newPointer].times);
      setFlightTimes(
        updatedMultipleDropJumpResults.dropJumps[newPointer].times.map(
          (e) => e.time
        )
      );
      setFloorTimes(
        updatedMultipleDropJumpResults.dropJumps[newPointer].times.map(
          (e) => e.floorTime
        )
      );
      setData({
        avgFlightTime:
          updatedMultipleDropJumpResults.dropJumps[newPointer].avgFlightTime,
        avgHeightReached:
          updatedMultipleDropJumpResults.dropJumps[newPointer].avgHeightReached,
      });
    }
    if (study.type === "bosco") {
      setBoscoResults({
        ...boscoResults,
        [tests[pointer]]: {
          avgFlightTime: data.avgFlightTime,
          avgHeightReached: ((9.81 * data.avgFlightTime ** 2) / 8) * 100,
          takeoffFoot: "both",
          times: jumpTimes,
          type: tests[pointer],
        },
      });

      setJumpTimes(boscoResults[boscoTests[newPointer]].times);
      setFlightTimes(
        boscoResults[boscoTests[newPointer]].times.map((e) => e.time)
      );
      setData({
        avgFlightTime: boscoResults[boscoTests[newPointer]].avgFlightTime,
        avgHeightReached: boscoResults[boscoTests[newPointer]].avgHeightReached,
      });
    }
    setPointer(newPointer);
  };

  const nextTest = () => {
    const newPointer = pointer + 1;
    if (study.type === "multipleDropJump") {
      const updatedMultipleDropJumpResults = {
        ...multipleDropJumpResults,
        dropJumps:
          pointer < multipleDropJumpResults.dropJumps.length
            ? multipleDropJumpResults.dropJumps.map((dropJump, index) =>
                index === pointer
                  ? {
                      avgHeightReached: data.avgHeightReached,
                      times: jumpTimes,
                      avgFlightTime: data.avgFlightTime,
                      type: "dropJump" as const,
                      height: study.dropJumpHeights[pointer],
                      takeoffFoot: study.takeoffFoot,
                      sensitivity: study.sensitivity,
                      stiffness: stiffness[pointer],
                    }
                  : dropJump
              )
            : [
                ...multipleDropJumpResults.dropJumps,
                {
                  avgHeightReached: data.avgHeightReached,
                  times: jumpTimes,
                  avgFlightTime: data.avgFlightTime,
                  type: "dropJump" as const,
                  height: study.dropJumpHeights[pointer],
                  takeoffFoot: study.takeoffFoot,
                  sensitivity: study.sensitivity,
                  stiffness: stiffness[pointer],
                },
              ],
        maxAvgHeightReached: 0,
      };
      setMultipleDropJumpResults(updatedMultipleDropJumpResults);
      if (multipleDropJumpResults.dropJumps.length === newPointer) {
        resetTest();
      } else {
        setJumpTimes(multipleDropJumpResults.dropJumps[newPointer].times);
        setFlightTimes(
          multipleDropJumpResults.dropJumps[newPointer].times.map((e) => e.time)
        );
        setData({
          avgFlightTime:
            multipleDropJumpResults.dropJumps[newPointer].avgFlightTime,
          avgHeightReached:
            multipleDropJumpResults.dropJumps[newPointer].avgHeightReached,
        });
      }
    }
    if (study.type === "bosco") {
      setBoscoResults({
        ...boscoResults,
        [tests[pointer]]: {
          avgFlightTime: data.avgFlightTime,
          avgHeightReached: ((9.81 * data.avgFlightTime ** 2) / 8) * 100,
          takeoffFoot: "both",
          times: jumpTimes,
          type: tests[pointer],
          sensitivity: study.sensitivity,
          load: 0,
          loadUnit: "kgs",
        },
      });
      if (boscoResults[tests[newPointer]].times.length > 0) {
        setJumpTimes(boscoResults[tests[newPointer]].times);
        setFlightTimes(
          boscoResults[tests[newPointer]].times.map((e) => e.time)
        );
        setData({
          avgFlightTime: boscoResults[tests[newPointer]].avgFlightTime,
          avgHeightReached: boscoResults[tests[newPointer]].avgHeightReached,
        });
      } else {
        resetTest();
      }
    }
    setPointer(newPointer);
  };

  const finishTest = () => {
    clearInterval(intervalID);
    setIntervalID(null);
    const processedFloorTimes =
      floorTimes.length === flightTimes.length
        ? floorTimes
        : floorTimes.slice(0, -1);
    const localJumpTimes = flightTimes.map((jump, i) => ({
      deleted: false,
      time: jump,
      floorTime: processedFloorTimes[i],
      performance: Number(((jump / Math.max(...flightTimes)) * 100).toFixed(2)),
      stiffness: Number((jump / processedFloorTimes[i]).toFixed(2)),
    }));
    setJumpTimes(localJumpTimes);
    const avgFlightTime =
      localJumpTimes.reduce((acc, time) => acc + time.time, 0) /
      localJumpTimes.length;

    if (typeof avgFlightTime !== "number") {
      setStatus("Error");
      return;
    }
    let validStiffnesses: number[];
    if (study.type === "multipleDropJump" || study.type === "multipleJumps") {
      validStiffnesses = localJumpTimes.map((e) =>
        Number(
          (Math.PI * (e.time + e.floorTime)) /
            (e.floorTime * e.floorTime * (e.time / e.floorTime + Math.PI / 4))
        )
      );
      setStiffness(validStiffnesses);
    }
    if (study.type === "multipleJumps") {
      const validFlightTimes = localJumpTimes.map((e) => e.time);

      const max = Math.max(...validFlightTimes);
      const validPerformances = validFlightTimes.map((e) =>
        Number(((e / max) * 100).toFixed(2))
      );
      setPerformance(validPerformances);

      const avgFloorTime =
        localJumpTimes.reduce((acc, time) => acc + time.floorTime, 0) /
        localJumpTimes.length;
      const avgPerformance =
        validPerformances.reduce((acc, time) => acc + time, 0) /
        validPerformances.length;
      const avgStiffness =
        validStiffnesses.reduce((acc, time) => acc + time, 0) /
        validStiffnesses.length;
      setData({
        avgFlightTime: avgFlightTime,
        avgHeightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
        avgFloorTime: avgFloorTime,
        avgPerformance: avgPerformance,
        avgStiffness: avgStiffness,
      });
      setPerformanceDrop(getPerformanceDrop(validPerformances));
      setStatus("Finalizado");
      return;
    }
    const studyData = {
      avgFlightTime: avgFlightTime,
      avgHeightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
    };
    setData(studyData);
    if (study.type === "multipleDropJump") {
      setMultipleDropJumpResults({
        ...multipleDropJumpResults,
        dropJumps:
          pointer < multipleDropJumpResults.dropJumps.length
            ? multipleDropJumpResults.dropJumps.map((dropJump, index) =>
                index === pointer
                  ? {
                      avgHeightReached: studyData.avgHeightReached,
                      times: localJumpTimes,
                      avgFlightTime: studyData.avgFlightTime,
                      type: "dropJump" as const,
                      height: study.dropJumpHeights[pointer],
                      takeoffFoot: study.takeoffFoot,
                      sensitivity: study.sensitivity,
                      stiffness: validStiffnesses[pointer],
                    }
                  : dropJump
              )
            : [
                ...multipleDropJumpResults.dropJumps,
                {
                  avgHeightReached: studyData.avgHeightReached,
                  times: localJumpTimes,
                  avgFlightTime: studyData.avgFlightTime,
                  type: "dropJump" as const,
                  height: study.dropJumpHeights[pointer],
                  takeoffFoot: study.takeoffFoot,
                  sensitivity: study.sensitivity,
                  stiffness: validStiffnesses[pointer],
                },
              ],
        maxAvgHeightReached: 0,
      });
    }
    if (study.type === "bosco") {
      setBoscoResults({
        ...boscoResults,
        [tests[pointer]]: {
          avgFlightTime: studyData.avgFlightTime,
          avgHeightReached: ((9.81 * studyData.avgFlightTime ** 2) / 8) * 100,
          takeoffFoot: "both",
          times: localJumpTimes,
          type: tests[pointer],
        },
      });
    }
    setStatus("Finalizado");
  };

  /* Also works as nextAthlete */
  const saveTest = async () => {
    if (!jumpTimes.length || Number.isNaN(data.avgFlightTime)) {
      setDisplayErrorPopup(true);
      return;
    }
    const updatedBoscoResults = {
      ...boscoResults,
      [tests[pointer]]: {
        avgFlightTime: data.avgFlightTime,
        avgHeightReached: ((9.81 * data.avgFlightTime ** 2) / 8) * 100,
        takeoffFoot: "both",
        times: jumpTimes,
        type: tests[pointer],
        sensitivity: study.sensitivity,
        load: 0,
        loadUnit: "kgs",
      },
    };
    let dropJumps: DropJumpResult[];

    if (study.type === "multipleDropJump") {
      dropJumps = [
        ...multipleDropJumpResults.dropJumps,
        /*   {
          avgHeightReached: data.avgHeightReached,
          times: jumpTimes,
          avgFlightTime: data.avgFlightTime,
          type: "dropJump",
          height: study.dropJumpHeights[pointer],
          takeoffFoot: study.takeoffFoot,
          sensitivity: study.sensitivity,
          stiffness: stiffness[pointer],
        }, */
      ];
    }
    const studyToSave: CompletedStudy = {
      studyInfo:
        study.type === "custom"
          ? await loadCustomStudyInfo()
          : studyInfoLookup[study.type],
      date: new Date().toISOString(),
      results:
        study.type === "bosco"
          ? updatedBoscoResults
          : study.type === "multipleJumps"
          ? {
              avgFlightTime: data.avgFlightTime,
              avgHeightReached: data.avgHeightReached,
              times: jumpTimes,
              type: study.type,
              takeoffFoot: study.takeoffFoot,
              sensitivity: study.sensitivity,
              criteria: study.criteria,
              criteriaValue: study.criteriaValue,
              stiffness: stiffness,
              performance: performance,
              avgStiffness: data.avgStiffness,
              avgPerformance: data.avgPerformance,
              avgFloorTime: data.avgFloorTime,
              performanceDrop: performanceDrop,
            }
          : study.type === "multipleDropJump"
          ? {
              ...multipleDropJumpResults,
              dropJumps: dropJumps,
              maxAvgHeightReached: Math.max(
                ...multipleDropJumpResults.dropJumps.map(
                  (e) => e.avgHeightReached
                ),
                data.avgHeightReached
              ),
              takeoffFoot: study.takeoffFoot,
              bestHeight:
                study.dropJumpHeights[
                  multipleDropJumpResults.dropJumps.findIndex(
                    (jump) =>
                      jump.avgHeightReached ===
                      Math.max(...dropJumps.map((e) => e.avgHeightReached))
                  )
                ],
            }
          : {
              avgFlightTime: data.avgFlightTime,
              avgHeightReached: data.avgHeightReached,
              times: jumpTimes,
              type: study.type,
              takeoffFoot: study.takeoffFoot,
              sensitivity: study.sensitivity,
              load: study.load,
              loadUnit: study.loadUnit,
            },
    };

    if (selectedAthletes.length > 0) {
      const updatedMultipleAthletesTests =
        selectedAthletePointer === multipleAthletesTests.length
          ? [
              ...multipleAthletesTests,
              {
                athleteName: selectedAthletes[selectedAthletePointer].name,
                test: studyToSave,
                testType: studyToSave.results.type,
              },
            ]
          : multipleAthletesTests.map((e, i) =>
              i === selectedAthletePointer
                ? {
                    athleteName: selectedAthletes[selectedAthletePointer].name,
                    test: studyToSave,
                    testType: studyToSave.results.type,
                  }
                : e
            );
      setMultipleAthletesTests(updatedMultipleAthletesTests);
      return updatedMultipleAthletesTests;
    }

    try {
      const { resultId } = await addResult(studyToSave, athlete.id);
      const newAthleteState = {
        ...athlete,
        completedStudies: [
          ...athlete.completedStudies,
          { ...studyToSave, id: resultId },
        ],
      };

      syncResult(studyToSave.results.type);
      setTestInProgress(false);
      setIsBlurred(false);
      setAthlete(newAthleteState);
      customNavigate("back", "startTest", "athleteStudies");
      setSelectedOption("athletes");
      setTimeout(() => {
        navigate("/athleteStudies");
      }, 300);
    } catch (error) {
      console.log(error);
    }
  };

  const saveAllTests = async (
    saveCurrentTest = true,
    selectedAthletes?: Athlete[]
  ) => {
    const updatedMultipleAthletesTests = saveCurrentTest
      ? await saveTest()
      : multipleAthletesTests;
    const resultsToBeSaved = {
      studies: updatedMultipleAthletesTests.map((e) => e.test),
      ids: selectedAthletes.map((e) => e.id),
    };
    try {
      await addMultipleResults(resultsToBeSaved);
      setTestInProgress(false);
      setIsBlurred(false);
      customNavigate("back", "startTest", "athletes");
      setSelectedOption("athletes");
      setTimeout(() => {
        navigate("/athletes");
      }, 300);
    } catch (error) {
      console.log(error);
    }
  };

  const loadCustomStudyInfo = async () => {
    try {
      const filename = `${naturalToCamelCase(study.name)}.json`;
      const result = await readJson(filename, "customStudies");
      if (
        !result.data ||
        typeof result.data !== "object" ||
        !result.data.name ||
        !result.data.description ||
        !result.data.preview
      ) {
        throw new Error("Invalid custom study data format");
      }
      return {
        name: result.data.name,
        description: result.data.description,
        preview: result.data.preview,
      };
    } catch (error) {
      console.error("Failed to load custom study info:", error);
      return studyInfoLookup[study.type];
    }
  };

  const handleDelete = (index: number) => {
    const updatedJumpTimes = jumpTimes.map((jump, i) =>
      i === index ? { ...jump, deleted: !jumpTimes[i].deleted } : jump
    );

    const validJumpTimes = updatedJumpTimes.filter((e) => !e.deleted);
    setJumpTimes(updatedJumpTimes);
    const avgFlightTime =
      validJumpTimes.reduce((acc, time) => acc + time.time, 0) /
      validJumpTimes.length;
    if (study.type === "multipleJumps") {
      const validFlightTimes = validJumpTimes.map((e) => e.time);

      const max = Math.max(...validFlightTimes);
      const validPerformances = validFlightTimes.map((e) =>
        Number(((e / max) * 100).toFixed(2))
      );
      const validStiffnesses = validJumpTimes.map((e) =>
        Number(
          (Math.PI * (e.time + e.floorTime)) /
            (e.floorTime * e.floorTime * (e.time / e.floorTime + Math.PI / 4))
        )
      );
      setPerformance(validPerformances);
      setStiffness(validStiffnesses);
      const avgFloorTime =
        validJumpTimes.reduce((acc, time) => acc + time.floorTime, 0) /
        validJumpTimes.length;
      const avgPerformance =
        validPerformances.reduce((acc, time) => acc + time, 0) /
        validPerformances.length;
      const avgStiffness =
        validStiffnesses.reduce((acc, time) => acc + time, 0) /
        validStiffnesses.length;
      setData({
        avgFlightTime: avgFlightTime,
        avgHeightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
        avgFloorTime: avgFloorTime,
        avgPerformance: avgPerformance,
        avgStiffness: avgStiffness,
      });
      setPerformanceDrop(getPerformanceDrop(validPerformances));
      return;
    }
    setData({
      avgFlightTime: avgFlightTime,
      avgHeightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
    });
  };

  const onClose = () => {
    setTestInProgress(false);
    setIsBlurred(false);
  };

  // Add DEL key event listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger onClose if Backspace is pressed AND no input/textarea is focused
      if (
        event.key === "Backspace" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName
        )
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Clean up growth timer if component unmounts
      if (growthTimerInterval) {
        clearInterval(growthTimerInterval);
      }
    };
  }, [growthTimerInterval]);

  const redoTest = () => {
    setJumpTimes([]);
    setPerformance([]);
    setStiffness([]);
    setFloorTimes([]);
    setFlightTimes([]);
    setChartData([]);
    setCurrentJumpElapsedTime(0);
    if (growthTimerInterval) {
      clearInterval(growthTimerInterval);
      setGrowthTimerInterval(null);
    }
    startSerialListener(9600);
    setStatus("Súbase a la alfombra");
    setCriteriaValue(0);
  };
  const startTimer = () => {
    if (intervalID) {
      return;
    }
    if (study.type === "multipleJumps" && study.criteria === "time") {
      setIntervalID(
        setInterval(() => {
          setCriteriaValue((prev) => prev + 1); // Use functional update
        }, 1000)
      );
    }
  };

  const displayTable = () => {
    setTableAnimation(navAnimations.popupFadeInTop);
    setShowTable(true);
  };

  const displayChart = () => {
    setChartAnimation(navAnimations.popupFadeInTop);
    setShowChart(true);
  };

  const onCloseTable = () => {
    if (tableAnimation !== navAnimations.popupFadeInTop) {
      return;
    }
    setTableAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      setShowTable(false);
    }, 200);
  };

  const onCloseChart = () => {
    setChartAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      setShowChart(false);
    }, 300);
  };

  const allTestsCompleted = () => {
    try {
      if (selectedAthletes.length === 0) return false;

      if (study.type !== "multipleDropJump" && study.type !== "bosco") {
        return true;
      }

      if (study.type === "multipleDropJump") {
        return (
          multipleDropJumpResults.dropJumps[
            multipleDropJumpResults.dropJumps.length - 1
          ].times.length > 0
        );
      }
      return (
        study.type === "bosco" &&
        boscoResults[tests[tests.length - 1]].times.length > 0
      );
    } catch (error) {
      console.log(error);
      // Return true if any property access fails due to undefined values
      return false;
    }
  };

  const simulateTest = () => {
    setSimulating(true);
    setSimulationComplete(false);
    setStatus("Súbase a la alfombra");
    setTimeout(() => {
      setStatus("Listo para saltar");
    }, 1000);
    setTimeout(() => {
      setFloorTimes([0.8]);
      setStatus("Saltando");
    }, 1400);
    setTimeout(() => {
      setStatus("Listo para saltar");
      setFlightTimes([0.6]);
      if (
        study.type === "multipleJumps" &&
        study.criteria === "numberOfJumps"
      ) {
        setCriteriaValue(1);
      }
    }, 2000);
    setTimeout(() => {
      setStatus("Saltando");
      setFloorTimes([1, 1.5]);
    }, 2100);

    setTimeout(() => {
      setStatus("Listo para saltar");
      setFlightTimes([0.6, 0.7]);
      if (
        study.type === "multipleJumps" &&
        study.criteria === "numberOfJumps"
      ) {
        setCriteriaValue(2);
      }
    }, 2800);
    setTimeout(() => {
      setSimulationComplete(true);
    }, 3000);
  };

  useEffect(() => {
    if (
      simulationComplete &&
      flightTimes.length === 2 &&
      floorTimes.length === 2
    ) {
      finishTest();
      setSimulationComplete(false);
    }
  }, [simulationComplete, flightTimes, floorTimes]);

  useEffect(() => {
    // Set pendingEvaluation status on initial load if multiple athletes and no test for current athlete
    if (
      selectedAthletes.length > 0 &&
      !multipleAthletesTests[selectedAthletePointer] &&
      status === "Súbase a la alfombra"
    ) {
      setStatus("pendingEvaluation");
    }
  }, [selectedAthletes, selectedAthletePointer, multipleAthletesTests]);

  useEffect(() => {
    const initializeDevice = async () => {
      try {
        await startSerialListener(9600);
      } catch (err) {
        setStatus("Error - Dispositivo no encontrado");
      }
    };
    initializeDevice();
  }, []);

  // Monitor connection status
  useEffect(() => {
    if (simulating || status === "pendingEvaluation") {
      return;
    }
    if (status === "Finalizado") {
      return;
    }
    if (isConnected) {
      setStatus("Súbase a la alfombra");
    } else if (error) {
      setStatus("Error - Dispositivo no encontrado");
    }
  }, [isConnected, error]);

  useEffect(() => {
    if (simulating || status === "pendingEvaluation") {
      return;
    }
    if (
      error?.includes("No compatible device found") ||
      error?.includes("No serial ports available")
    ) {
      setStatus("Error: Dispositivo no encontrado");
    }
  }, [error]);

  useEffect(() => {
    if (simulating) {
      return;
    }
    if (
      logs[logs.length - 1] &&
      logs[logs.length - 1].data &&
      logs[logs.length - 1].data === "Microswitch PRESIONADO" &&
      status === "Súbase a la alfombra"
    ) {
      const audio = new Audio("/beep.mp3");
      audio.play();
      setStatus("Listo para saltar");
      startTimer();
      setStartTime(new Date());
      return;
    }

    if (
      status === "Listo para saltar" &&
      logs[logs.length - 1] &&
      logs[logs.length - 1].data &&
      logs[logs.length - 1].data === "Microswitch SUELTO"
    ) {
      setStatus("Saltando");
      if (study.type === "multipleJumps") {
        if (ignoreJump) {
          setIgnoreJump(false);
        } else {
          setFloorTimes((prevFloorTimes) => [
            ...prevFloorTimes,
            getSecondsBetweenDates(startTime, new Date()),
          ]);
        }
      }
      setStartTime(new Date());
    }

    if (
      status === "Saltando" &&
      logs[logs.length - 1].data &&
      logs[logs.length - 1].data === "Microswitch PRESIONADO"
    ) {
      setStatus("Listo para saltar");
      /* Sensitivity Implementation */
      if (
        getSecondsBetweenDates(startTime, new Date()) <
        study.sensitivity / 1000
      ) {
        if (study.type === "multipleJumps") {
          setIgnoreJump(true);
          setStartTime(new Date());
        }
        return;
      }
      setFlightTimes((prevFlightTimes) => [
        ...prevFlightTimes,
        getSecondsBetweenDates(startTime, new Date()),
      ]);

      if (study.type === "multipleJumps") {
        setStartTime(new Date());
      }

      if (
        study.type === "multipleJumps" &&
        study.criteria === "numberOfJumps"
      ) {
        const nextValue = criteriaValue + 1;
        if (nextValue >= study.criteriaValue) {
          finishTest();
        } else {
          setCriteriaValue(criteriaValue + 1);
        }
      } else {
        finishTest();
      }
    }
  }, [logs]);

  useEffect(() => {
    if (
      study.type === "multipleJumps" &&
      study.criteriaValue === criteriaValue
    ) {
      finishTest();
      clearInterval(intervalID);
    }
  }, [criteriaValue]);

  useEffect(() => {
    if (status.includes("Error")) {
      const timeout = setTimeout(() => {
        setDisplayError(true);
      }, 200);
      setErrorTimeout(timeout);
    } else {
      clearInterval(errorTimeout);
      setDisplayError(false);
    }
  }, [status]);

  useEffect(() => {
    if (flightTimes.length > 0 && status !== "Saltando") {
      setChartData(
        flightTimes.map((time, i) => ({
          index: i + 1,
          flightTime: Number(time.toFixed(2)),
          floorTime: floorTimes[i] ? Number(floorTimes[i].toFixed(2)) : 0,
          height: Number((((9.81 * time ** 2) / 8) * 100).toFixed(2)),
        }))
      );
    } else if (flightTimes.length === 0) {
      setChartData([]);
    }
  }, [flightTimes, floorTimes, status]);

  // Handle real-time bar growth for multipleJumps
  useEffect(() => {
    if (study.type === "multipleJumps" && status === "Saltando") {
      // Clear any existing timer
      if (growthTimerInterval) {
        clearInterval(growthTimerInterval);
      }

      // Reset elapsed time
      setCurrentJumpElapsedTime(0);

      // Start the growth timer
      const timer = setInterval(() => {
        setCurrentJumpElapsedTime((prev) => {
          const newTime = prev + 0.01; // Increment by 10ms

          // Update chart data with growing bar
          setChartData((prevData) => {
            const currentJumpIndex = flightTimes.length;
            const newData = [...prevData];

            // Add or update the current jump's data
            const currentJumpData = {
              index: currentJumpIndex + 1,
              flightTime: Number(newTime.toFixed(2)),
              floorTime: 0,
              height: Number((((9.81 * newTime ** 2) / 8) * 100).toFixed(2)),
              isGrowing: true, // Flag to identify the growing bar
            };

            // If this is a new jump, add it; otherwise update the last one
            if (
              newData.length === currentJumpIndex ||
              (newData[currentJumpIndex] && newData[currentJumpIndex].isGrowing)
            ) {
              newData[currentJumpIndex] = currentJumpData;
            } else {
              newData.push(currentJumpData);
            }

            return newData;
          });

          return newTime;
        });
      }, 10); // Update every 10ms

      setGrowthTimerInterval(timer);
    } else if (growthTimerInterval && status !== "Saltando") {
      // Clear the timer when not jumping
      clearInterval(growthTimerInterval);
      setGrowthTimerInterval(null);
      setCurrentJumpElapsedTime(0);

      // Finalize the chart data when jump is complete
      if (study.type === "multipleJumps" && flightTimes.length > 0) {
        setChartData(
          flightTimes.map((time, i) => ({
            index: i + 1,
            flightTime: Number(time.toFixed(2)),
            floorTime: floorTimes[i] ? Number(floorTimes[i].toFixed(2)) : 0,
            height: Number((((9.81 * time ** 2) / 8) * 100).toFixed(2)),
            isGrowing: false,
          }))
        );
      }
    }

    // Cleanup on unmount
    return () => {
      if (growthTimerInterval) {
        clearInterval(growthTimerInterval);
      }
    };
  }, [status, study.type, flightTimes.length]);

  const renderStatusContent = () => {
    // Special case for pendingEvaluation
    if (status === "pendingEvaluation") {
      return (
        <p
          className="text-2xl mt-8 text-tertiary"
          style={{ alignSelf: "center" }}
        >
          Atleta a Evaluar:{" "}
          <span className="text-secondary font-medium">
            {selectedAthletes[selectedAthletePointer].name}
          </span>
        </p>
      );
    }

    // Special case for multipleJumps in progress
    if (
      status !== "Finalizado" &&
      status !== "Súbase a la alfombra" &&
      study.type === "multipleJumps"
    ) {
      return (
        <div className="w-full flex mt-8 items-center justify-around">
          <p className="text-2xl text-tertiary" style={{ alignSelf: "center" }}>
            Estado:{" "}
            <span className="text-secondary font-medium">
              {displayError
                ? status
                : status.includes("Error")
                ? "Conectando..."
                : status}
            </span>
          </p>
        </div>
      );
    }

    // Default status display
    return (
      <p
        className="text-2xl mt-8 text-tertiary"
        style={{ alignSelf: "center" }}
      >
        Estado:{" "}
        <span className="text-secondary font-medium">
          {displayError
            ? status
            : status.includes("Error")
            ? "Conectando..."
            : status}
        </span>
      </p>
    );
  };

  const renderErrorContent = () => {
    if (!status.includes("Error") || !displayError) return null;

    return (
      <div className="mt-4 flex flex-col self-center">
        <p className="text-lg text-gray-600">Por favor:</p>
        <ul className="list-disc ml-6 mt-2 text-gray-600">
          <li>Verifique que la alfombra esté bien conectada</li>
          <li>Asegúrese de que el cable USB está bien conectado</li>
          <li>Intente reconectar la alfombra</li>
        </ul>
        <OutlinedButton
          title="Reintentar conexión"
          icon="again"
          onClick={() => {
            setStatus("Conectando dispositivo...");
            startSerialListener(9600);
          }}
          containerStyles="mt-8 self-center"
        />
      </div>
    );
  };

  const renderMultipleJumpsCriteria = () => {
    if (
      study.type !== "multipleJumps" ||
      status === "Finalizado" ||
      status.includes("Error")
    ) {
      return null;
    }

    if (study.criteria === "time") {
      return (
        <p className="self-center mt-16 text-2xl text-tertiary ml-48">
          <span className="text-secondary font-medium">00:{criteriaValue}</span>{" "}
          segundos
        </p>
      );
    }

    if (study.criteria === "numberOfJumps") {
      return (
        <p className="mt-12 text-2xl text-tertiary self-center">
          N° de saltos:{" "}
          <span className="text-secondary font-medium">
            {criteriaValue} - {study.criteriaValue}
          </span>
        </p>
      );
    }

    return null;
  };

  const renderMultipleJumpsChart = () => {
    if (
      study.type !== "multipleJumps" ||
      status === "Finalizado" ||
      chartData.length === 0
    ) {
      return null;
    }

    return (
      <div className="w-full" style={{ height: "500px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 60, bottom: 60, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              label={{
                value: "N° de Salto",
                position: "bottom",
                offset: 0,
              }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 80]}
              label={{
                value:
                  displayMetric === "time"
                    ? "Tiempo (s)"
                    : displayMetric === "height"
                    ? "Altura (cm)"
                    : "Rendimiento (%)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: "Índice Q",
                angle: 90,
                position: "insideRight",
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
              }}
            />
            <Legend
              wrapperStyle={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                width: "100%",
                paddingTop: "30px",
                marginTop: "20px",
              }}
              verticalAlign="bottom"
              iconType="circle"
              layout="horizontal"
              align="center"
            />
            {displayMetric === "time" ? (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="flightTime"
                  fill="#e81d23"
                  name="Tiempo de Vuelo"
                  barSize={20}
                  animationDuration={status === "Saltando" ? 0 : 500}
                  animationEasing="linear"
                  isAnimationActive={status !== "Saltando"}
                />
                <Bar
                  yAxisId="left"
                  dataKey="floorTime"
                  fill="#FFC1C1"
                  name="Tiempo de Piso"
                  barSize={20}
                  animationDuration={500}
                  animationEasing="ease"
                />
              </>
            ) : displayMetric === "height" ? (
              <Bar
                yAxisId="left"
                dataKey="height"
                fill="#e81d23"
                name="Altura"
                barSize={20}
                animationDuration={status === "Saltando" ? 0 : 500}
                animationEasing="linear"
                isAnimationActive={status !== "Saltando"}
              />
            ) : (
              <Bar
                yAxisId="left"
                dataKey="performance"
                fill="#e81d23"
                name="Rendimiento"
                barSize={20}
                animationDuration={500}
                animationEasing="ease"
              />
            )}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="qIndex"
              stroke="#ff7300"
              name="Índice Q"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderActionButtons = () => {
    switch (status) {
      case "Súbase a la alfombra":
        return null;

      case "pendingEvaluation":
        return (
          <div className="flex items-center justify-center gap-x-8 w-full mt-12 mb-4">
            <OutlinedButton
              title="Omitir Atleta"
              onClick={skipAthlete}
              icon="skip"
            />
            <TonalButton
              title="Realizar Test"
              onClick={() => simulateTest()} //Change to setStatus subase a la alfombra
              icon="next"
            />
          </div>
        );

      case "Finalizado":
        return (
          <>
            {study.type === "multipleJumps" && (
              <>
                <div className="w-full my-12 flex items-center justify-center gap-x-8">
                  <OutlinedButton
                    title="Ver Tabla"
                    icon="tableRed"
                    onClick={displayTable}
                  />
                  <TonalButton
                    title="Ver Gráfico"
                    icon="studies"
                    onClick={displayChart}
                  />
                </div>
                <p className="self-center text-xl mt-4 text-tertiary">
                  Caída de Rendimiento por Fatiga:{" "}
                  <span className="text-secondary font-medium">
                    {performanceDrop?.toFixed(2)}%
                  </span>
                </p>
              </>
            )}
            <div className="flex items-center justify-center gap-x-4 w-full mt-12">
              <OutlinedButton
                title="Rehacer Test"
                icon="again"
                onClick={redoTest}
              />
              {study.type === "multipleDropJump" &&
                multipleDropJumpResults?.dropJumps?.length > 1 && (
                  <TonalButton
                    title="Ver Gráfico"
                    onClick={displayChart}
                    containerStyles="mx-4"
                    icon="studies"
                  />
                )}
            </div>
            {(selectedAthletes.length === 0 ||
              study.type === "multipleDropJump" ||
              study.type === "bosco") && (
              <div className="flex items-center justify-center gap-x-8 mt-8">
                <OutlinedButton
                  title={
                    study.type === "bosco" ? "Test Anterior" : "Altura Anterior"
                  }
                  icon="back"
                  onClick={previousTest}
                  inverse
                  disabled={!(tests.length > 1 && pointer > 0)}
                />
                <TonalButton
                  title={
                    study.type === "bosco" &&
                    ((pointer < tests.length - 1 &&
                      selectedAthletes.length === 0) ||
                      selectedAthletes.length > 0)
                      ? "Siguiente Test"
                      : (study.type === "multipleDropJump" &&
                          pointer < study.dropJumpHeights.length - 1 &&
                          selectedAthletes.length === 0) ||
                        selectedAthletes.length > 0
                      ? "Siguiente Altura"
                      : "Guardar Test"
                  }
                  icon={
                    study.type === "bosco" || study.type === "multipleDropJump"
                      ? "next"
                      : "check"
                  }
                  onClick={
                    study.type === "bosco" && pointer < tests.length - 1
                      ? nextTest
                      : study.type === "multipleDropJump" &&
                        pointer < study.dropJumpHeights.length - 1
                      ? nextTest
                      : saveTest
                  }
                  disabled={
                    (study.type === "bosco" &&
                      pointer === tests.length - 1 &&
                      selectedAthletes.length > 0) ||
                    (study.type === "multipleDropJump" &&
                      pointer === study.dropJumpHeights.length - 1 &&
                      selectedAthletes.length > 0)
                  }
                />
              </div>
            )}
            {selectedAthletes.length > 0 && (
              <div className="flex items-center justify-around w-full mt-8 mb-4">
                <TonalButton
                  title={
                    selectedAthletePointer === selectedAthletes.length - 1
                      ? "Guardar Tests"
                      : "Atleta Siguiente"
                  }
                  icon={
                    selectedAthletePointer === selectedAthletes.length - 1
                      ? "save"
                      : "next"
                  }
                  onClick={
                    selectedAthletePointer === selectedAthletes.length - 1
                      ? saveAllTests
                      : nextAthlete
                  }
                  disabled={!allTestsCompleted()}
                />
              </div>
            )}
          </>
        );

      case "Error":
        return (
          <>
            <p className="text-2xl text-tertiary self-center mt-8 ml-48">
              Ha ocurrido un error, por favor reinicie el test
            </p>
            <OutlinedButton
              title="Rehacer Test"
              icon="again"
              onClick={resetTest}
              containerStyles="self-center"
            />
          </>
        );

      default:
        if (!status.includes("Error")) {
          return (
            <TonalButton
              containerStyles={`self-center mt-${
                study.type === "multipleJumps" ? "4" : "12"
              }`}
              title="Finalizar Test"
              icon="closeWhite"
              onClick={finishTest}
            />
          );
        }
        return null;
    }
  };

  const renderMainContent = () => {
    return (
      <div className="w-full flex flex-col self-center">
        {renderStatusContent()}
        {renderErrorContent()}
        {renderMultipleJumpsCriteria()}
        {renderMultipleJumpsChart()}
        {status === "Finalizado" && !status.includes("Error") && (
          <div className="mt-4">{tableJSX}</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed flex flex-col items-center top-[2%] w-[100vw] left-0">
      <div
        className={`bg-white relative shadow-lg rounded-2xl transition-all duration-300 ease-linear flex flex-col items-center px-16 py-8 mt-8 ${
          (displayErrorPopup || showTable || showChart) &&
          "blur-md pointer-events-none"
        }
          `}
        style={{
          width: study.type === "multipleJumps" ? "1400px" : "50%",
        }}
      >
        <div
          className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-6 w-6" alt="" />
        </div>
        <p className="self-center text-4xl text-secondary">{t(study.type)}</p>

        {selectedAthletes.length > 0 && (
          <p className="text-2xl self-center my-4">
            {selectedAthletes[selectedAthletePointer].name}{" "}
            <span className="text-darkGray">
              {selectedAthletePointer + 1}/{selectedAthletes.length}
            </span>
          </p>
        )}
        {study.type === "bosco" && (
          <p className="self-center text-2xl mt-8 text-tertiary">
            Test {pointer + 1}:{" "}
            <span className="text-secondary font-medium">
              {t(tests[pointer])}
            </span>
          </p>
        )}
        {study.type === "multipleDropJump" && (
          <p className="self-center text-2xl mt-4 text-tertiary">
            Altura de Caída:{" "}
            <span className="text-secondary font-medium">
              {study.dropJumpHeights[pointer]} cm
            </span>
          </p>
        )}

        {renderMainContent()}

        {renderActionButtons()}
      </div>
      {displayErrorPopup && (
        <ErrorDisplay
          setDisplayErrorPopup={setDisplayErrorPopup}
          redoTest={redoTest}
        ></ErrorDisplay>
      )}
      {showTable && (
        <div
          className={`bg-white shadow-sm border border-gray fixed z-50 rounded-2xl py-2 px-8 w-[1400px]
              top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pt-12 transition-all duration-300 ease-linear ${tableAnimation}`}
        >
          <div
            className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={onCloseTable}
          >
            <img src="/close.png" className="h-6 w-6" alt="Close" />
          </div>
          <p className="text-3xl text-secondary self-center">
            Tabla de Resultados
          </p>
          {tableJSX}
          <div className="w-full flex justify-center gap-x-16 mt-12 mb-8 items-center">
            <OutlinedButton
              title="Volver"
              icon="back"
              onClick={onCloseTable}
              inverse
            />
            <TonalButton
              title="Ver Gráfico"
              icon="studies"
              onClick={displayChart}
            />
          </div>
        </div>
      )}
      {status === "pendingEvaluation" && (
        <div
          className={`bg-white rounded-2xl shadow-sm justify-center mt-8 grid ${
            skippedAthletes.length > 0 ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          <p className="text-xl text-center text-secondary py-2 px-16 border-r border-b border-gray">
            Atletas Evaluados
          </p>
          <p
            className={`text-xl text-center text-secondary py-2 px-16 border-b border-gray ${
              skippedAthletes.length > 0 ? "border-r" : ""
            }`}
          >
            Atletas Pendientes
          </p>
          {skippedAthletes.length > 0 && (
            <p className="text-xl text-secondary text-center py-2 px-16 border-b border-gray">
              Atletas Omitidos
            </p>
          )}
          <div
            className="flex flex-col ml-8 border-r border-gray py-2 overflow-y-scroll"
            style={{ maxHeight: "300px" }}
          >
            {selectedAthletes.map(
              (athlete, i) =>
                i < multipleAthletesTests.length && (
                  <>
                    <p
                      className="active:opacity-40 hover:cursor-pointer hover:text-secondary transition-all duration-200 text-lg my-1"
                      onClick={() => jumpToAthlete(i)}
                    >
                      {athlete.name}
                    </p>
                  </>
                )
            )}
          </div>
          <div
            className={`flex flex-col ml-8 py-2 overflow-y-scroll ${
              skippedAthletes.length > 0 ? "border-r border-gray" : ""
            }`}
            style={{ maxHeight: "300px" }}
          >
            {selectedAthletes.map(
              (athlete, i) =>
                i >= multipleAthletesTests.length && (
                  <>
                    <p
                      className={`text-lg my-1 ${
                        i === selectedAthletePointer
                          ? "text-secondary"
                          : "active:opacity-40 hover:cursor-pointer hover:text-secondary transition-all duration-200"
                      }`}
                      onClick={() => jumpToAthlete(i)}
                    >
                      {athlete.name}
                    </p>
                  </>
                )
            )}
          </div>
          {skippedAthletes.length > 0 && (
            <div
              className="flex flex-col ml-8 py-2 overflow-y-scroll"
              style={{ maxHeight: "300px" }}
            >
              {skippedAthletes.map((athlete, i) => (
                <p
                  className="my-1 active:opacity-40 hover:cursor-pointer hover:text-secondary transition-all duration-200 text-lg"
                  onClick={() => jumpToAthlete(i, true)}
                >
                  {athlete.name}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {showChart && study.type === "multipleJumps" && (
        <ChartDisplay
          setShowChart={setShowChart}
          jumpTimes={jumpTimes}
          setShowTable={setShowTable}
          chartAnimation={chartAnimation}
          onClose={onCloseChart}
          displayTable={displayTable}
          performance={performance}
        />
      )}
      {showChart &&
        study.type === "multipleDropJump" &&
        multipleDropJumpResults && (
          <MultipleDropJumpChartDisplay
            setShowChart={setShowChart}
            dropJumps={multipleDropJumpResults.dropJumps}
            chartAnimation={chartAnimation}
            onClose={onCloseChart}
          />
        )}
    </div>
  );
}

export default TestInProgress;
