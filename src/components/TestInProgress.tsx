import React, { useState } from "react";
import { useStudyContext } from "../contexts/StudyContext";

function TestInProgress({
  setTestInProgress,
  onBlurChange,
}: {
  setTestInProgress: (testInProgress: boolean) => void;
  onBlurChange: (isBlurred: boolean) => void;
}) {
  const [status, setStatus] = useState("Súbase a la alfombra");

  const { study, setStudy } = useStudyContext();
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
      <p className="self-center mt-16 text-2xl">
        Estado: <span className="text-secondary font-medium">{status}</span>
      </p>
    </div>
  );
}

export default TestInProgress;
