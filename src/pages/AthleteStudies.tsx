import React from "react";
import { useStudyContext } from "../contexts/StudyContext";
import CompletedStudyCard from "../components/CompletedStudyCard";
import OutlinedButton from "../components/OutlinedButton";
import { useNavigate } from "react-router-dom";

function AthleteStudies({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const { athlete } = useStudyContext();

  const navigate = useNavigate();
  const studies = athlete.completedStudies;

  const onDelete = () => {};
  return (
    <div
      className="flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out"
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[90%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-16 transition-all duration-300 ease-in-out ${animation}`}
      >
        <p className="text-2xl text-dark self-center mt-10">
          Estudios Realizados:{" "}
          <span className="text-secondary font-medium">{athlete.name}</span>
        </p>

        {studies.length ? (
          studies.map((study) => (
            <div className="grid grid-cols-3 gap-x-[5%] gap-y-16 w-full px-36">
              <CompletedStudyCard
                key={study.studyInfo.name}
                study={study}
                onDelete={onDelete}
                onClick={() => {}}
              />
            </div>
          ))
        ) : (
          <p className="text-xl my-16 self-center">No hay estudios cargados</p>
        )}

        <OutlinedButton
          title="Ver Información del Atleta"
          onClick={() => {
            customNavigate("forward", "athleteStudies", "selectAthlete");
            setTimeout(() => {
              navigate("/selectAthlete?from=athlete");
            }, 300);
          }}
          icon="info"
          containerStyles="self-center mt-4 mb-8 "
        />
      </div>
    </div>
  );
}

export default AthleteStudies;
