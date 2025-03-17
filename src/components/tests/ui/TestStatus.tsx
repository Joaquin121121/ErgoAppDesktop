import { useTestContext, useTestActions } from "../../../contexts/TestContext";
import { useTranslation } from "react-i18next";
import React from "react";
import OutlinedButton from "../../OutlinedButton";
import MultipleJumpsChart from "@/components/charts/MultipleJumpsChart";
import MultipleDropJumpChart from "@/components/charts/MultipleDropJumpChart";
import StandardChart from "@/components/charts/StandardChart";
import TonalButton from "@/components/TonalButton";

function TestStatus() {
  const { state } = useTestContext();
  const { initializeTest, finishTest } = useTestActions();
  const { t } = useTranslation();

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

  return (
    <div className="w-full flex flex-col items-center">
      Estado: <span className="text-secondary font-medium">{getStatus()}</span>
      {state.status === "deviceError" && deviceErrorJSX}
      {getChartType()}
      <TonalButton
        title="Finalizar Test"
        icon="closeWhite"
        onClick={finishTest}
        containerStyles="mt-8 self-center"
      />
    </div>
  );
}

export default TestStatus;
