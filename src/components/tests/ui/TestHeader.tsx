import { useStudyContext } from "../../../contexts/StudyContext";
import { useTestContext } from "../../../contexts/TestContext";
import React from "react";
import { useTranslation } from "react-i18next";
import { boscoTests } from "../../../types/Studies";

function TestHeader() {
  const { state } = useTestContext();
  const { t } = useTranslation();
  const { study, selectedAthletes } = useStudyContext();
  return (
    <div className="w-full flex flex-col items-center">
      <p className="self-center text-4xl text-secondary">{t(state.testType)}</p>
      {selectedAthletes.length > 0 && (
        <p className="text-2xl self-center my-4">
          {selectedAthletes[state.selectedAthletePointer].name}{" "}
          <span className="text-darkGray">
            {state.selectedAthletePointer + 1}/{selectedAthletes.length}
          </span>
        </p>
      )}
      {study.type === "bosco" && (
        <p className="self-center text-2xl mt-8 text-tertiary">
          Test {state.pointer + 1}:{" "}
          <span className="text-secondary font-medium">
            {t(boscoTests[state.pointer])}
          </span>
        </p>
      )}
      {study.type === "multipleDropJump" && (
        <p className="self-center text-2xl mt-4 text-tertiary">
          Altura de Caída:{" "}
          <span className="text-secondary font-medium">
            {study.dropJumpHeights[state.pointer]} cm
          </span>
        </p>
      )}
    </div>
  );
}

export default TestHeader;
