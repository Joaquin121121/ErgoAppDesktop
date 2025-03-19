import { useTestContext, useTestActions } from "../../../contexts/TestContext";
import { useTranslation } from "react-i18next";
import React from "react";
import OutlinedButton from "../../OutlinedButton";
import MultipleJumpsChart from "../../charts/MultipleJumpsChart";
import MultipleDropJumpChart from "../../charts/MultipleDropJumpChart";
import StandardChart from "../../charts/StandardChart";
import TonalButton from "../../TonalButton";

function TestStatus() {
  const { state } = useTestContext();
  const { initializeTest, finishTest, resetTest } = useTestActions();
  const { t } = useTranslation();

  const deviceErrorJSX = (
    <div className="mt-4 flex flex-col self-center">
      <p className="text-lg text-gray-600">Por favor:</p>
      <ul className="list-disc ml-6 mt-2 text-gray-600">
        <li>Verifique que la alfombra esté bien conectada</li>
        <li>Asegúrese de que el cable USB está bien conectado</li>
        <li>Intente reconectar la alfombra</li>
      </ul>
      <OutlinedButton
        title="Reintentar conexión"
        icon="again"
        onClick={initializeTest}
        containerStyles="mt-8 self-center"
      />
    </div>
  );

  const getStatus = () => {
    switch (state.status) {
      case "ready":
        return "Listo para saltar";
      case "jumping":
        return "Saltando";
      case "deviceError":
        return "Error: Dispositivo no encontrado";
      case "finished":
        return "Test Finalizado";
      case "idle":
        return "Conectando...";
      case "noJumpsError":
        return "Error: No se registraron saltos";
    }
  };

  const getChartType = () => {
    switch (state.testType) {
      case "multipleDropJump":
        return <MultipleDropJumpChart dropJumps={state.dropJumps} />;
      case "multipleJumps":
        return <MultipleJumpsChart jumpTimes={state.jumpTimes} />;
      default:
        return <StandardChart jumpTimes={state.jumpTimes} />;
    }
  };

  const getRelevantJSX = () => {
    switch (state.status) {
      case "deviceError":
        return deviceErrorJSX;
      case "ready":
      case "jumping":
        return (
          <>
            Estado:{" "}
            <span className="text-secondary font-medium">{getStatus()}</span>
            {getChartType()}
            <TonalButton
              title="Finalizar Test"
              icon="closeWhite"
              onClick={finishTest}
              containerStyles="mt-8 self-center"
            />
          </>
        );
      case "finished":
        return (
          <OutlinedButton
            title="Rehace Test"
            onClick={resetTest}
            icon="redo"
            containerStyles="mt-8 self-center"
          />
        );
    }
  };

  return (
    <div className="w-full flex flex-col items-center">{getRelevantJSX()}</div>
  );
}

export default TestStatus;
