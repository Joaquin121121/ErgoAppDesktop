import { useEffect, useState } from "react";
import useSerialMonitor from "../../../hooks/useSerialMonitor";
import { useTestActions, useTestContext } from "../../../contexts/TestContext";
import { validateLog } from "../../../utils/utils";
import React from "react";
import TestHeader from "../ui/TestHeader";
import TestStatus from "../ui/TestStatus";
import TestNavigator from "../ui/TestNavigator";
import { useNavigate } from "react-router-dom";
function StandardTest({
  setTestInProgress,
  customNavigate,
  onBlurChange,
}: {
  setTestInProgress: (testInProgress: boolean) => void;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
  onBlurChange: (isBlurred: boolean) => void;
}) {
  const [timeoutID, setTimeoutID] = useState<NodeJS.Timeout | null>(null);

  const { initializeTest, processLog, setStatus } = useTestActions();
  const { logs, isConnected, error } = useSerialMonitor();
  const { state } = useTestContext();
  const navigate = useNavigate();
  const returnToMenu = () => {
    customNavigate("forward", "standardTest", "athleteStudies");
    setTimeout(() => {
      navigate("/athleteStudies");
    }, 300);
  };

  useEffect(() => {
    initializeTest();
  }, []);

  useEffect(() => {
    if (!validateLog(logs)) return;
    processLog(logs[logs.length - 1].data);
  }, [logs]);

  return (
    <div
      className={`bg-white shadow-lg rounded-2xl transition-all duration-300 ease-linear fixed right-8 flex flex-col items-center px-16 py-8 ${
        false && "blur-md pointer-events-none"
      }
          `}
      style={{
        width: state.testType === "multipleJumps" ? "1400px" : "50%",
        left: state.testType === "multipleJumps" ? "5%" : "25%",
        top: state.testType === "multipleJumps" ? "2%" : "0%",
      }}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={() => {}}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>

      <TestHeader />
      <TestStatus />
      <TestNavigator returnToMenu={returnToMenu} />
    </div>
  );
}

export default StandardTest;
