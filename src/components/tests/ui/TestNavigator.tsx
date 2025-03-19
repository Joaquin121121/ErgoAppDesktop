import React from "react";
import TonalButton from "../../../components/TonalButton";
import OutlinedButton from "../../../components/OutlinedButton";
import { useTestActions, useTestContext } from "../../../contexts/TestContext";
import { saveTest } from "../../../hooks/useTestSaving";

function TestNavigator({ returnToMenu }: { returnToMenu: () => void }) {
  const { state } = useTestContext();
  const { nextTest, previousTest, nextAthlete } = useTestActions();
  const requiresNavigation =
    state.testType === "bosco" || state.testType === "multipleDropJump";

  const lastTestBool =
    (state.testType === "bosco" && state.testPointer === 2) ||
    (state.testType === "multipleDropJump" &&
      state.testPointer === state.dropJumpHeights.length - 1);

  const onSave = () => {
    saveTest({ state });
    if (state.athletePointer === state.selectedAthletes.length - 1) {
      returnToMenu();
    } else {
      nextAthlete();
    }
  };

  const saveButton = (
    <TonalButton title="Guardar y Continuar" onClick={onSave} />
  );

  return (
    <div className="flex gap-x-16 justify-center items-center">
      {requiresNavigation && (
        <>
          <OutlinedButton
            title="Anterior"
            onClick={previousTest}
            disabled={state.testPointer === 0}
          />

          {lastTestBool ? (
            saveButton
          ) : (
            <TonalButton title="Siguiente" onClick={nextTest} />
          )}
        </>
      )}
      {!requiresNavigation && saveButton}
    </div>
  );
}

export default TestNavigator;
