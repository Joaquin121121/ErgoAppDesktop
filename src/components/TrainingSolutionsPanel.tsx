import React from "react";
import CustomAccordion from "./CustomAccordion";
import TonalButton from "./TonalButton";

interface TrainingSolutionsPanelProps {
  isCreatingPlan: boolean;
  accordionItems: { title: string; content: React.ReactNode }[];
  collapseAccordion: boolean;
  onCollapseComplete: () => void;
  goToTests: () => void;
}

const TrainingSolutionsPanel: React.FC<TrainingSolutionsPanelProps> = ({
  isCreatingPlan,
  accordionItems,
  collapseAccordion,
  onCollapseComplete,
  goToTests,
}) => {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm flex flex-col items-start h-full transition-[width] duration-500 ease-in-out"
      style={{ width: isCreatingPlan ? "30%" : "60%" }}
    >
      <div className="flex items-center justify-center gap-x-8 py-4 mb-4 bg-lightRed w-full rounded-t-2xl ">
        <p className="text-secondary text-2xl text-center">
          Soluciones de Entrenamiento
        </p>
        {!isCreatingPlan && (
          <img src="/trainingRed.png" alt="" className="h-8 w-8" />
        )}
      </div>
      {accordionItems.length > 0 ? (
        <CustomAccordion
          items={accordionItems}
          initialExpandedIndex={0}
          showPapers={() => {}}
          collapseAccordion={collapseAccordion}
          onCollapseComplete={onCollapseComplete}
        />
      ) : (
        <>
          <p className="text-xl text-center w-full">
            No hay soluciones de entrenamiento disponibles
          </p>
          <p className="mt-4 text-darkGray text-center text-lg mb-8 w-full">
            Realice tests sobre el atleta para obtener soluciones de
            entrenamiento.
          </p>
          <TonalButton
            title="Realizar Tests"
            onClick={goToTests}
            containerStyles="mb-8 self-center"
            icon="next"
          />
        </>
      )}
    </div>
  );
};

export default TrainingSolutionsPanel;
