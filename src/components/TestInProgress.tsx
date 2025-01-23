import React, { useState, useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import TonalButton from "./TonalButton";
import useSerialMonitor from "../hooks/useSerialMonitor";
import { getSecondsBetweenDates } from "../utils/utils";

function TestInProgress({
  setTestInProgress,
  onBlurChange,
}: {
  setTestInProgress: (testInProgress: boolean) => void;
  onBlurChange: (isBlurred: boolean) => void;
}) {
  const [status, setStatus] = useState("Súbase a la alfombra");
  const [data, setData] = useState({ avgTime: 0, height: 0 });
  const { serialData, error, startSerialListener, logs, clearLogs } =
    useSerialMonitor();
  const { study, setStudy } = useStudyContext();
  const [startTime, setStartTime] = useState(new Date());
  const [jumpTimes, setJumpTimes] = useState<number[]>([]);

  const finishTest = () => {
    setStatus("Finalizado");
    const avgTime =
      jumpTimes.reduce((acc, time) => acc + time, 0) / jumpTimes.length;
    setData({ avgTime: avgTime, height: ((9.81 * avgTime ** 2) / 8) * 100 });
  };

  useEffect(() => {
    startSerialListener("COM5", 9600);
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

  useEffect(() => {
    console.log(jumpTimes);
  }, [jumpTimes]);

  return (
    <div className="bg-white shadow-lg rounded-2xl fixed w-1/2 left-1/4 top-1/4 flex flex-col items-center px-16 py-8 h-1/2">
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
      <p className="self-center mt-16 text-2xl text-black">
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
      )}
    </div>
  );
}

export default TestInProgress;
