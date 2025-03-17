import { useEffect, useState } from "react";
import useSerialMonitor from "@/hooks/useSerialMonitor";
import { useTestActions, useTestContext } from "../../../contexts/TestContext";
import { validateLog } from "../../../utils/utils";
import React from "react";
import TestHeader from "../ui/TestHeader";
import TestStatus from "../ui/TestStatus";
import { useStudyContext } from "../../../contexts/StudyContext";
import TestNavigator from "../ui/TestNavigator";
function StandardTest() {
  const [timeoutID, setTimeoutID] = useState<NodeJS.Timeout | null>(null);

  const { initializeTest, processLog, setStatus } = useTestActions();
  const { logs, isConnected, error } = useSerialMonitor();
  const { state } = useTestContext();
  const { study } = useStudyContext();

  useEffect(() => {
    initializeTest();
  }, []);

  useEffect(() => {
    if (!validateLog(logs)) return;
    processLog(logs[logs.length - 1].data);
  }, [logs]);

  return (
    <div className="w-full">
      <TestHeader />
      <TestStatus />
      <TestNavigator />
    </div>
  );
}

export default StandardTest;
