import React, { useState, useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import TonalButton from "./TonalButton";
import useSerialMonitor from "../hooks/useSerialMonitor";
import { getSecondsBetweenDates } from "../utils/utils";
import OutlinedButton from "./OutlinedButton";
import { CompletedStudy, studyInfoLookup } from "../types/Studies";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { set } from "lodash";

function TestInProgress({
  setTestInProgress,
  onBlurChange,
  customNavigate,
}: {
  setTestInProgress: (testInProgress: boolean) => void;
  onBlurChange: (isBlurred: boolean) => void;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const [status, setStatus] = useState("Súbase a la alfombra");
  const [data, setData] = useState({ avgTime: 0, height: 0 });
  const { serialData, error, startSerialListener, logs, clearLogs } =
    useSerialMonitor();
  const { study, setStudy, athlete, setAthlete } = useStudyContext();
  const { saveJson } = useJsonFiles();
  const navigate = useNavigate();

  const [startTime, setStartTime] = useState(new Date());
  const [jumpTimes, setJumpTimes] = useState<number[]>([]);

  const finishTest = () => {
    const avgTime =
      jumpTimes.reduce((acc, time) => acc + time, 0) / jumpTimes.length;

    if (typeof avgTime !== "number") {
      setStatus("Error");
      return;
    }
    setStatus("Finalizado");

    setData({ avgTime: avgTime, height: ((9.81 * avgTime ** 2) / 8) * 100 });
  };

  const saveTest = async () => {
    const studyToSave: CompletedStudy = {
      studyInfo: studyInfoLookup[study.name.toLowerCase()],
      date: new Date(),
      results: {
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
      customNavigate("back", "startTest", "studies");
      setTimeout(() => {
        navigate("/studies");
      }, 300);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    startSerialListener("COM6", 9600);
  }, []);

  useEffect(() => {
    if (
      logs[logs.length - 1] &&
      logs[logs.length - 1].data &&
      logs[logs.length - 1].data === "Microswitch PRESIONADO" &&
      status !== "Finalizado"
    ) {
      setStatus("Listo para saltar");
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
    }
  }, [logs]);

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
      <p className="self-center text-3xl text-secondary">{study.name}</p>
      <p className="self-center my-16 text-2xl text-black">
        Estado: <span className="text-secondary font-medium">{status}</span>
      </p>
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
          <div className="mt-20">
            <p className="text-2xl text-black">
              Tiempo promedio:{" "}
              <span className="text-secondary font-medium">
                {data.avgTime.toFixed(2)}s
              </span>
            </p>
            <p className="text-2xl text-black">
              Altura:{" "}
              <span className="text-secondary font-medium">
                {data.height.toFixed(3)}cm
              </span>
            </p>
          </div>
          <div className="flex items-center justify-around w-full my-20">
            <OutlinedButton
              title="Rehacer Test"
              icon="again"
              onClick={() => {
                setStatus("Súbase a la alfombra");
              }}
            />
            <TonalButton title="Guardar Test" icon="check" onClick={saveTest} />
          </div>
        </>
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
