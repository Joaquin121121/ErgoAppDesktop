import React, { useState } from "react";
import { useNewPlan } from "../contexts/NewPlanContext";
function SessionInfoStage({ animation }: { animation: string }) {
  const { planState } = useNewPlan();
  const [sessionN, setSessionN] = useState(0);

  return (
    <div className={`flex flex-col items-center ${animation}`}>
      <div
        className={`flex my-10 items-center justify-center gap-x-4 ${animation}`}
      >
        <p className="text-2xl text-secondary">Sesion {sessionN + 1}</p>
        <img src="/trainingRed.png" className="h-8 w-8" alt="" />
      </div>
    </div>
  );
}

export default SessionInfoStage;
