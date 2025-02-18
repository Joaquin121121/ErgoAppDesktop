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
} from "../types/Studies";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase, getPerformanceDrop } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ErrorDisplay from "./ErrorDisplay";
import styles from "../styles/animations.module.css";
import ChartDisplay from "./MultipleJumpsChartDisplay";
import navAnimations from "../styles/animations.module.css";

function TestInProgress({
  setTestInProgress,
  onBlurChange,
  customNavigate,
  tests,
  setSelectedOption,
}: {
  setTestInProgress: (testInProgress: boolean) => void;
  onBlurChange: (isBlurred: boolean) => void;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
  tests: string[];
  setSelectedOption: (selectedOption: string) => void;
}) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [status, setStatus] = useState("Súbase a la alfombra");
  const [data, setData] = useState<StudyData>({
    avgFlightTime: 0,
    avgHeightReached: 0,
  });
  const [pointer, setPointer] = useState(0);
  const [errorTimeout, setErrorTimeout] = useState(null);
  const [displayError, setDisplayError] = useState(false);
  const { serialData, error, startSerialListener, logs, isConnected } =
    useSerialMonitor();
  const { study, setStudy, athlete, setAthlete } = useStudyContext();
  const { saveJson } = useJsonFiles();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [startTime, setStartTime] = useState(new Date());
  const [flightTimes, setFlightTimes] = useState<number[]>([]);
  const [floorTimes, setFloorTimes] = useState<number[]>([]);
  const [performance, setPerformance] = useState<number[]>([]);
  const [stiffness, setStiffness] = useState<number[]>([]);
  const [jumpTimes, setJumpTimes] = useState<JumpTime[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [tableAnimation, setTableAnimation] = useState("");
  const [chartAnimation, setChartAnimation] = useState("");
  const [performanceDrop, setPerformanceDrop] = useState(0);
  const [boscoResults, setBoscoResults] = useState<BoscoResult>({
    type: "bosco",
    cmj: {
      avgFlightTime: 0,
      avgHeightReached: 0,
      times: jumpTimes,
      type: "cmj",
      takeoffFoot: "both",
      sensitivity: 0,
      load: 0,
      loadUnit: "kgs",
    },
    squatJump: {
      avgFlightTime: 0,
      avgHeightReached: 0,
      times: jumpTimes,
      type: "squatJump",
      takeoffFoot: "both",
      sensitivity: 0,
      load: 0,
      loadUnit: "kgs",
    },
    abalakov: {
      avgFlightTime: 0,
      avgHeightReached: 0,
      times: jumpTimes,
      type: "abalakov",
      takeoffFoot: "both",
      sensitivity: 0,
      load: 0,
      loadUnit: "kgs",
    },
  });
  const [criteriaValue, setCriteriaValue] = useState(0);
  const [intervalID, setIntervalID] = useState(null);

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
              {e.time ? `${e.time.toFixed(1)} s` : "-"}
            </td>
            {study.type === "multipleJumps" && (
              <td
                className="text-inherit w-52 flex items-center justify-center"
                style={{ opacity: e.deleted && "60%" }}
              >
                {e.floorTime ? `${e.floorTime.toFixed(1)} s` : "-"}
              </td>
            )}
            <td
              className="text-inherit opacity w-36 flex items-center justify-center"
              style={{ opacity: e.deleted && "60%" }}
            >
              {e.time
                ? `${(((9.81 * e.time ** 2) / 8) * 100).toFixed(1)} cm`
                : "-"}
            </td>
            {study.type === "multipleJumps" && (
              <>
                <td
                  className="text-inherit opacity w-36 flex items-center justify-center"
                  style={{ opacity: e.deleted && "60%" }}
                >
                  {stiffness?.[i] ? `${stiffness[i].toFixed(1)} N/m` : "-"}
                </td>
                <td
                  className="text-inherit opacity w-36 flex items-center justify-center"
                  style={{ opacity: e.deleted && "60%" }}
                >
                  {performance?.[i] ? `${performance[i].toFixed(1)}%` : "-"}
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
              ? `${data.avgFlightTime.toFixed(1)} s`
              : "-"}
          </td>
          {study.type === "multipleJumps" && (
            <td className="text-secondary w-52 flex items-center justify-center">
              {data?.avgFloorTime && !Number.isNaN(data.avgFloorTime)
                ? `${data.avgFloorTime.toFixed(1)} s`
                : "-"}
            </td>
          )}
          <td className="text-secondary w-36 flex items-center justify-center">
            {data?.avgHeightReached && !Number.isNaN(data.avgHeightReached)
              ? `${data.avgHeightReached.toFixed(1)} cm`
              : "-"}
          </td>
          {study.type === "multipleJumps" && (
            <>
              <td className="text-secondary w-36 flex items-center justify-center">
                {data?.avgStiffness && !Number.isNaN(data.avgStiffness)
                  ? `${data.avgStiffness.toFixed(1)} N/m`
                  : "-"}
              </td>
              <td className="text-secondary w-36 flex items-center justify-center">
                {data?.avgPerformance && !Number.isNaN(data.avgPerformance)
                  ? `${data.avgPerformance.toFixed(1)} %`
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

  const nextTest = () => {
    setJumpTimes([]);
    setPointer(pointer + 1);
    setStatus("Súbase a la alfombra");
  };

  const finishTest = () => {
    clearInterval(intervalID);
    setIntervalID(null);
    const processedFloorTimes =
      floorTimes.length === flightTimes.length
        ? floorTimes
        : floorTimes.slice(0, -1);
    console.log(processedFloorTimes);
    const localJumpTimes = flightTimes.map((jump, i) => ({
      deleted: false,
      time: jump,
      floorTime: processedFloorTimes[i],
    }));
    console.log(localJumpTimes);
    setJumpTimes(localJumpTimes);
    const avgFlightTime =
      localJumpTimes.reduce((acc, time) => acc + time.time, 0) /
      localJumpTimes.length;

    if (typeof avgFlightTime !== "number") {
      setStatus("Error");
      return;
    }
    if (study.type === "bosco") {
      setBoscoResults({
        ...boscoResults,
        [tests[pointer]]: {
          avgFlightTime: avgFlightTime,
          heightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
        },
      });
    }
    if (study.type === "multipleJumps") {
      const max = Math.max(...flightTimes);
      const performances = flightTimes.map((e) =>
        Number(((e / max) * 100).toFixed(1))
      );
      setPerformance(performances);
      const stiffnesses = localJumpTimes.map((e) =>
        Number(
          (Math.PI * (e.time + e.floorTime)) /
            (e.floorTime * e.floorTime * (e.time / e.floorTime + Math.PI / 4))
        )
      );
      setStiffness(stiffnesses);

      const avgFloorTime =
        localJumpTimes.reduce((acc, time) => acc + time.floorTime, 0) /
        localJumpTimes.length;
      const avgPerformance =
        performances.reduce((acc, time) => acc + time, 0) / performances.length;
      const avgStiffness =
        stiffnesses.reduce((acc, time) => acc + time, 0) / stiffnesses.length;
      setData({
        avgFlightTime: avgFlightTime,
        avgHeightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
        avgFloorTime: avgFloorTime,
        avgPerformance: avgPerformance,
        avgStiffness: avgStiffness,
      });
      setPerformanceDrop(getPerformanceDrop(performances));
      setStatus("Finalizado");

      return;
    }
    setData({
      avgFlightTime: avgFlightTime,
      avgHeightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
    });
    setStatus("Finalizado");
  };

  const saveTest = async () => {
    if (!jumpTimes.length || Number.isNaN(data.avgFlightTime)) {
      setIsBlurred(true);
      return;
    }
    const studyToSave: CompletedStudy = {
      studyInfo: studyInfoLookup[naturalToCamelCase(study.name)],
      date: new Date(),
      results:
        study.type === "bosco"
          ? boscoResults
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
            }
          : study.type === "dropJump"
          ? {
              avgFlightTime: data.avgFlightTime,
              avgHeightReached: data.avgHeightReached,
              times: jumpTimes,
              type: study.type,
              takeoffFoot: study.takeoffFoot,
              sensitivity: study.sensitivity,
              height: study.height,
              heightUnit: study.heightUnit,
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

    console.log(studyToSave);
    try {
      const result = await saveJson(
        `${naturalToCamelCase(athlete.name)}.json`,
        {
          ...athlete,
          completedStudies: [...athlete.completedStudies, studyToSave],
        },
        "athletes"
      );
      console.log(result.message);
      setTestInProgress(false);
      onBlurChange(false);
      setAthlete({
        ...athlete,
        completedStudies: [...athlete.completedStudies, studyToSave],
      });
      customNavigate("back", "startTest", "athleteStudies");
      setSelectedOption("athletes");
      setTimeout(() => {
        navigate("/athleteStudies");
      }, 300);
    } catch (error) {
      console.log(error);
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
        Number(((e / max) * 100).toFixed(1))
      );
      const validStiffnesses = validJumpTimes.map((e) =>
        Number(
          (Math.PI * (e.time + e.floorTime)) /
            (e.floorTime * e.floorTime * (e.time / e.floorTime + Math.PI / 4))
        )
      );
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
    onBlurChange(false);
  };

  const redoTest = () => {
    setJumpTimes([]);
    setPerformance([]);
    setStiffness([]);
    setFloorTimes([]);
    setFlightTimes([]);
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
    if (chartAnimation !== navAnimations.popupFadeInTop) {
      return;
    }
    setChartAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      setShowChart(false);
    }, 200);
  };

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
    if (status === "Finalizado") {
      return;
    }
    if (isConnected) {
      setStatus("Súbase a la alfombra");
    } else if (error) {
      setStatus("Error - Dispositivo no encontrado");
    }
  }, [isConnected, error]);

  // Handle device errors
  useEffect(() => {
    if (
      error?.includes("No compatible device found") ||
      error?.includes("No serial ports available")
    ) {
      setStatus("Error: Dispositivo no encontrado");
    }
  }, [error]);

  useEffect(() => {
    if (
      logs[logs.length - 1] &&
      logs[logs.length - 1].data &&
      logs[logs.length - 1].data === "Microswitch PRESIONADO" &&
      status === "Súbase a la alfombra"
    ) {
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
        setFloorTimes((prevFloorTimes) => [
          ...prevFloorTimes,
          getSecondsBetweenDates(startTime, new Date()),
        ]);
      }
      setStartTime(new Date());
    }

    if (
      status === "Saltando" &&
      logs[logs.length - 1].data &&
      logs[logs.length - 1].data === "Microswitch PRESIONADO"
    ) {
      setStatus("Listo para saltar");
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
      }
    }
  }, [logs]);

  useEffect(() => {
    if (
      study.type === "multipleJumps" &&
      study.criteriaValue <= criteriaValue
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
    setFlightTimes([0.45, 0.43, 0.44, 0.46, 0.42]);
    setFloorTimes([0.22, 0.24, 0.23, 0.21, 0.25]);
  }, []);

  useEffect(() => {
    if (floorTimes.length) {
      finishTest();
    }
  }, [floorTimes]);

  return (
    <>
      <div
        className={`bg-white shadow-lg rounded-2xl transition-all duration-300 ease-linear fixed  top-20 flex flex-col items-center px-16 py-8 ${
          (isBlurred || showTable || showChart) && "blur-md pointer-events-none"
        }`}
        style={
          study.type === "multipleJumps"
            ? { width: "1400px", left: "15%" }
            : { width: "50%", left: "25%" }
        }
      >
        <div
          className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-6 w-6" alt="" />
        </div>
        <p className="self-center text-4xl text-secondary">{t(study.type)}</p>
        {tests.length > 1 && (
          <p className="self-center text-3xl mt-8 text-tertiary">
            Test {pointer + 1}:{" "}
            <span className="text-secondary">{t(tests[pointer])}</span>
          </p>
        )}

        <div className="w-full flex flex-col self-center">
          <p
            className="mt-16 text-2xl text-tertiary"
            style={{
              alignSelf: "center",
            }}
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
          {status.includes("Error") && displayError && (
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
          )}
          {study.type === "multipleJumps" &&
            study.criteria === "time" &&
            status !== "Finalizado" &&
            !status.includes("Error") && (
              <p className="self-center mt-16 text-2xl text-tertiary ml-48">
                <span className="text-secondary font-medium">
                  00:{criteriaValue}
                </span>{" "}
                segundos
              </p>
            )}
          {study.type === "multipleJumps" &&
            status !== "Finalizado" &&
            study.criteria === "numberOfJumps" &&
            !status.includes("Error") && (
              <p className="mt-8 text-2xl text-tertiary ml-48">
                N° de saltos:{" "}
                <span className="text-secondary font-medium">
                  {criteriaValue} - {study.criteriaValue}
                </span>{" "}
              </p>
            )}

          {status === "Finalizado" && <div className="mt-4">{tableJSX}</div>}
        </div>

        {(status === "Listo para saltar" || status === "Saltando") && (
          <TonalButton
            containerStyles="self-center mt-20"
            title="Finalizar Test"
            icon="closeWhite"
            onClick={finishTest}
          />
        )}
        {status === "Finalizado" && (
          <>
            {study.type === "multipleJumps" && (
              <>
                <div className="w-full mt-12 flex items-center justify-center gap-x-8">
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

                <p className="self-center text-xl mt-12 text-tertiary">
                  Caída de Rendimiento por Fatiga:{" "}
                  <span className="text-secondary font-medium">
                    {performanceDrop?.toFixed(1)}%
                  </span>
                </p>
              </>
            )}
            <div className="flex items-center justify-around w-full mt-16 mb-8">
              <OutlinedButton
                title="Rehacer Test"
                icon="again"
                onClick={redoTest}
              />
              <TonalButton
                title={
                  pointer === tests.length - 1
                    ? "Guardar Test"
                    : "Siguiente Test"
                }
                icon="check"
                onClick={pointer === tests.length - 1 ? saveTest : nextTest}
              />
            </div>
          </>
        )}
        {status === "Error" && (
          <>
            <p className="text-2xl text-tertiary self-center mt-8 ml-48">
              Ha ocurrido un error, por favor reinicie el test
            </p>
            <OutlinedButton
              title="Rehacer Test"
              icon="again"
              onClick={() => {
                setStatus("Súbase a la alfombra");
              }}
              containerStyles="self-center mt-20 mb-8"
            />
          </>
        )}
      </div>
      {isBlurred && (
        <ErrorDisplay
          setIsBlurred={setIsBlurred}
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
      {showChart && (
        <ChartDisplay
          setShowChart={setShowChart}
          jumpTimes={jumpTimes}
          setShowTable={setShowTable}
          onClose={onCloseChart}
          displayTable={displayTable}
          chartAnimation={chartAnimation}
        />
      )}
    </>
  );
}

export default TestInProgress;
