import { useTestContext } from "../../../contexts/TestContext";
import React from "react";
import { useTranslation } from "react-i18next";
import { boscoTests } from "../../../types/Studies";

function TestHeader() {
  const { state } = useTestContext();
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col items-center">
      <p className="self-center text-4xl text-secondary">{t(state.testType)}</p>
      {state.selectedAthletes.length > 0 && (
        <p className="text-2xl self-center my-4">
          {state.selectedAthletes[state.athletePointer].name}{" "}
          <span className="text-darkGray">
            {state.athletePointer + 1}/{state.selectedAthletes.length}
          </span>
        </p>
      )}
      {state.testType === "bosco" && (
        <p className="self-center text-2xl mt-8 text-tertiary">
          Test {state.testPointer + 1}:{" "}
          <span className="text-secondary font-medium">
            {t(boscoTests[state.testPointer])}
          </span>
        </p>
      )}
      {state.testType === "multipleDropJump" && (
        <p className="self-center text-2xl mt-4 text-tertiary">
          Altura de Caída:{" "}
          <span className="text-secondary font-medium">
            {state.dropJumpHeights[state.testPointer]} cm
          </span>
        </p>
      )}
    </div>
  );
}

export default TestHeader;
