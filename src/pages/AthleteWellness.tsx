import { useNavigate } from "react-router-dom";
import TonalButton from "../components/TonalButton";
import React, { useState } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import AutocompleteDropdown from "../components/AutocompleteDropdown";

function AthleteWellness({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: any;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const { athlete } = useStudyContext();
  const navigate = useNavigate();
  const onClose = () => {
    customNavigate("back", "athleteWellness", "athleteMenu");
    setTimeout(() => {
      navigate("/athleteMenu");
    }, 200);
  };

  const [timeFrame, setTimeFrame] = useState<
    "lastMonth" | "lastTwoWeeks" | "lastWeek"
  >("lastMonth");

  const dropdownData = [
    {
      value: "lastMonth",
      label: "Último Mes",
    },
    {
      value: "lastTwoWeeks",
      label: "Últimas 2 Semanas",
    },
    {
      value: "lastWeek",
      label: "Última Semana",
    },
  ];

  const performanceData = [
    {
      week: "30/06/2025",
      attendance: 2,
      completedExercises: 8,
      performance: 8,
    },
    {
      week: "23/06/2025",
      attendance: 2,
      completedExercises: 8,
      performance: 8,
    },
  ];

  const wellnessData = [
    {
      week: "30/06/2025",
      sleep: 8,
      nutrition: 8,
      fatigue: 8,
    },
    {
      week: "23/06/2025",
      sleep: 8,
      nutrition: 8,
      fatigue: 8,
    },
  ];

  return (
    <div
      className={`flex-1 relative flex flex-col items-center  transition-all duration-300 ease-in-out ${animation} `}
    >
      <TonalButton
        containerStyles="absolute top-16 right-4"
        onClick={onClose}
        icon="backWhite"
        title="Volver"
        inverse
      />
      <p className="text-3xl my-10">
        Bienestar y Rendimiento:{" "}
        <span className="text-secondary">{athlete.name}</span>
      </p>
      <div className="flex justify-center items-center gap-x-8">
        <p className="text-lg text-darkGray">Mostrando</p>
        <AutocompleteDropdown
          data={dropdownData}
          onSelect={(value) => setTimeFrame(value)}
          field="timeFrame"
          displayKey="label"
          valueKey="value"
          placeholder="Seleccione un periodo"
          disabled={false}
          reset={false}
          setReset={() => {}}
          initialQuery={
            dropdownData.find((item) => item.value === timeFrame)?.label ||
            undefined
          }
        />
      </div>
      <div className="flex justify-center px-8 gap-x-8 mt-8">
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center">
          <div className="flex items-center justify-center gap-x-4">
            <p className="text-secondary text-2xl">Bienestar</p>
            <img src="wellness.png" alt="" className="h-7 w-7" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center">
          <div className="flex items-center justify-center gap-x-4">
            <p className="text-secondary text-2xl">Bienestar</p>
            <img src="wellness.png" alt="" className="h-7 w-7" />
          </div>
          <div className="grid grid-cols-4 gap-x-4">
            <p className="col-span-1 text-darkGray text-center w-48">Semana</p>
            <p className="col-span-1 text-darkGray text-center w-48">
              Asistencia
            </p>
            <p className="col-span-1 text-darkGray text-center w-48">
              Ejercicios Completados
            </p>
            <p className="col-span-1 text-darkGray text-center w-48">
              Rendimiento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AthleteWellness;
