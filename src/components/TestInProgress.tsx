import React, { useState, useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import TonalButton from "./TonalButton";
import useSerialMonitor from "../hooks/useSerialMonitor";
import { getSecondsBetweenDates } from "../utils/utils";
import OutlinedButton from "./OutlinedButton";
import { CompletedStudy, studyInfoLookup, BoscoResult } from "../types/Studies";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { useTransition } from "react";
import { useTranslation } from "react-i18next";

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
  const [jumpTimes, setJumpTimes] = useState<number[]>([]);
  const [boscoResults, setBoscoResults] = useState<BoscoResult>({
    cmj: { flightTime: 0, heightReached: 0 },
    squatJump: { flightTime: 0, heightReached: 0 },
    abalakov: { flightTime: 0, heightReached: 0 },
  });
  const [criteriaValue, setCriteriaValue] = useState(0);
  const [intervalID, setIntervalID] = useState(null);

  const nextTest = () => {
    setJumpTimes([]);
    setPointer(pointer + 1);
    setStatus("Súbase a la alfombra");
  };

  const finishTest = () => {
    setIntervalID(null);
    const avgTime =
      jumpTimes.reduce((acc, time) => acc + time, 0) / jumpTimes.length;

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
    const studyToSave: CompletedStudy = {
      studyInfo: studyInfoLookup[naturalToCamelCase(study.name)],
      date: new Date(),
      results:
        study.type === "bosco"
          ? boscoResults
          : {
              flightTime: data.avgTime,
              heightReached: data.height,
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
      status !== "Finalizado"
    ) {
      setStatus("Listo para saltar");
      startTimer();
    }

    if (
      status === "Listo para saltar" &&
      logs[logs.length - 1] &&
      logs[logs.length - 1].data &&
      logs[logs.length - 1].data === "Microswitch SUELTO"
    ) {
      setStatus("Saltando");
      setStartTime(new Date());
    }

    if (
      status === "Saltando" &&
      logs[logs.length - 1].data &&
      logs[logs.length - 1].data === "Microswitch PRESIONADO"
    ) {
      setStatus("Listo para saltar");
      setJumpTimes([
        ...jumpTimes,
        getSecondsBetweenDates(startTime, new Date()),
      ]);

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

  return (
    <div className="bg-white shadow-lg rounded-2xl fixed w-1/2 left-1/4 top-1/4 flex flex-col items-center px-16 py-8 ">
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={() => {
          setTestInProgress(false);
          onBlurChange(false);
        }}
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

      <div className="w-3/5 flex flex-col self-center">
        <p
          className="mt-16 text-2xl text-black"
          style={{ alignSelf: status !== "Finalizado" && "center" }}
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
          <div className="mt-4 flex flex-col">
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
          status !== "Finalizado" && (
            <p className="self-center mt-16 text-2xl text-black">
              <span className="text-secondary font-medium">
                00:{criteriaValue}
              </span>{" "}
              segundos
            </p>
          )}
        {study.type === "multipleJumps" &&
          status !== "Finalizado" &&
          study.criteria === "numberOfJumps" && (
            <p className="mt-8 text-2xl text-black">
              N° de saltos:{" "}
              <span className="text-secondary font-medium">
                {criteriaValue} - {study.criteriaValue}
              </span>{" "}
            </p>
          )}

        {status === "Finalizado" && (
          <>
            <p className="text-2xl text-black mt-4">
              Tiempo promedio:{" "}
              <span className="text-secondary font-medium">
                {data.avgTime.toFixed(1)}s
              </span>
            </p>
            <p className="text-2xl text-black mt-4">
              Altura:{" "}
              <span className="text-secondary font-medium">
                {data.height.toFixed(1)}cm
              </span>
            </p>
          </>
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
            onClick={() => {
              startSerialListener(9600);
              setStatus("Súbase a la alfombra");
              setCriteriaValue(0);
            }}
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
          <p className="text-2xl text-black self-center mt-8">
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
  );
}

export default TestInProgress;
