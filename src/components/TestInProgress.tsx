import React, { useState, useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import TonalButton from "./TonalButton";
import useSerialMonitor from "../hooks/useSerialMonitor";
import { getSecondsBetweenDates } from "../utils/utils";
import OutlinedButton from "./OutlinedButton";
import {
  CompletedStudy,
  studyInfoLookup,
  BoscoResult,
  JumpTime,
} from "../types/Studies";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import ErrorDisplay from "./ErrorDisplay";

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
  const [data, setData] = useState({ avgTime: 0, height: 0 });
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
  const [jumpTimes, setJumpTimes] = useState<JumpTime[]>([]);
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
    const localJumpTimes = flightTimes.map((jump, i) => ({
      deleted: false,
      time: jump,
      floorTime: processedFloorTimes[i],
    }));
    setJumpTimes(localJumpTimes);
    const avgTime =
      localJumpTimes.reduce((acc, time) => acc + time.time, 0) /
      localJumpTimes.length;

    if (typeof avgTime !== "number") {
      setStatus("Error");
      return;
    }
    if (study.type === "bosco") {
      setBoscoResults({
        ...boscoResults,
        [tests[pointer]]: {
          avgTime: avgTime,
          heightReached: ((9.81 * avgTime ** 2) / 8) * 100,
        },
      });
    }
    setData({ avgTime: avgTime, height: ((9.81 * avgTime ** 2) / 8) * 100 });
    setStatus("Finalizado");
  };

  const saveTest = async () => {
    if (!jumpTimes.length || Number.isNaN(data.avgTime)) {
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
              avgFlightTime: data.avgTime,
              avgHeightReached: data.height,
              times: jumpTimes,
              type: study.type,
              takeoffFoot: study.takeoffFoot,
              sensitivity: study.sensitivity,
              criteria: study.criteria,
              criteriaValue: study.criteriaValue,
            }
          : study.type === "dropJump"
          ? {
              avgFlightTime: data.avgTime,
              avgHeightReached: data.height,
              times: jumpTimes,
              type: study.type,
              takeoffFoot: study.takeoffFoot,
              sensitivity: study.sensitivity,
              height: study.height,
              heightUnit: study.heightUnit,
            }
          : {
              avgFlightTime: data.avgTime,
              avgHeightReached: data.height,
              times: jumpTimes,
              type: study.type,
              takeoffFoot: study.takeoffFoot,
              sensitivity: study.sensitivity,
              load: study.load,
              loadUnit: study.loadUnit,
            },
    };

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
    const avgTime =
      validJumpTimes.reduce((acc, time) => acc + time.time, 0) /
      validJumpTimes.length;
    setData({ avgTime: avgTime, height: ((9.81 * avgTime ** 2) / 8) * 100 });
  };

  const onClose = () => {
    setTestInProgress(false);
    onBlurChange(false);
  };

  const redoTest = () => {
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
    console.log("Floor:", floorTimes);
    console.log(flightTimes);
  }, [jumpTimes, floorTimes, flightTimes]);

  return (
    <>
      <div
        className={`bg-white shadow-lg rounded-2xl fixed w-1/2 left-1/4 top-1/4 flex flex-col items-center px-16 py-8 ${
          isBlurred && "blur-md pointer-events-none"
        }`}
      >
        <div
          className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-6 w-6" alt="" />
        </div>
        <p className="self-center text-4xl text-secondary">{t(study.type)}</p>
        {tests.length > 1 && (
          <p className="self-center text-3xl mt-8 text-black">
            Test {pointer + 1}:{" "}
            <span className="text-secondary">{t(tests[pointer])}</span>
          </p>
        )}

        <div className="w-full flex flex-col self-center">
          <p
            className="mt-16 text-2xl text-black"
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
              <p className="self-center mt-16 text-2xl text-black ml-48">
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
              <p className="mt-8 text-2xl text-black ml-48">
                N° de saltos:{" "}
                <span className="text-secondary font-medium">
                  {criteriaValue} - {study.criteriaValue}
                </span>{" "}
              </p>
            )}

          {status === "Finalizado" && (
            <div className="mt-4">
              <table className="w-full mt-8">
                <thead className="w-full">
                  <tr className="flex justify-around items-center w-full">
                    <th className="text-2xl w-20 font-normal text-black">
                      Saltos
                    </th>
                    <th className="text-2xl w-52 font-normal text-black">
                      Tiempo de Vuelo
                    </th>
                    <th className="text-2xl w-36 font-normal text-black">
                      Altura
                    </th>
                    <th className="text-2xl w-24 font-normal text-black">
                      Eliminar
                    </th>
                  </tr>
                </thead>
                <tbody className="w-full">
                  {jumpTimes.map((e, i) => (
                    <tr className="text-tertiary border border-transparent text-xl flex rounded-2xl justify-around items-center w-full hover:text-secondary hover:bg-lightRed  hover:border-secondary transition-all 300s ease-linear">
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
                        {e.time.toFixed(1)} s
                      </td>
                      <td
                        className="text-inherit opacity w-36 flex items-center justify-center"
                        style={{ opacity: e.deleted && "60%" }}
                      >
                        {(((9.81 * e.time ** 2) / 8) * 100).toFixed(1)} cm
                      </td>
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
                  <tr className="text-darkGray border border-transparent text-lg flex rounded-2xl justify-around items-center w-full hover:text-secondary hover:bg-lightRed hover:border-secondary transition-all 300ms linear">
                    <td className="text-secondary w-20 flex items-center justify-center">
                      Promedio
                    </td>
                    <td className="text-secondary w-52 flex items-center justify-center">
                      {Number.isNaN(data.avgTime)
                        ? "Error"
                        : data.avgTime.toFixed(1) + " s"}
                    </td>
                    <td className="text-secondary w-36 flex items-center justify-center">
                      {Number.isNaN(data.height)
                        ? "Error"
                        : data.height.toFixed(1) + " cm"}
                    </td>
                    <td className="w-24 opacity-0 flex items-center justify-center">
                      <img
                        src="/close.png"
                        className="h-6 w-6 hover:opacity-70 transition-all duration-200"
                        alt=""
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
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
          <div className="flex items-center justify-around w-full my-20">
            <OutlinedButton
              title="Rehacer Test"
              icon="again"
              onClick={redoTest}
            />
            <TonalButton
              title={
                pointer === tests.length - 1 ? "Guardar Test" : "Siguiente Test"
              }
              icon="check"
              onClick={pointer === tests.length - 1 ? saveTest : nextTest}
            />
          </div>
        )}
        {status === "Error" && (
          <>
            <p className="text-2xl text-black self-center mt-8 ml-48">
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
    </>
  );
}

export default TestInProgress;
