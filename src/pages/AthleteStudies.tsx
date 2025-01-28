import React, { useEffect, useState } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import CompletedStudyCard from "../components/CompletedStudyCard";
import OutlinedButton from "../components/OutlinedButton";
import { useNavigate } from "react-router-dom";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import TonalButton from "../components/TonalButton";

function AthleteStudies({
  isExpanded,
  animation,
  customNavigate,
  onBlurChange,
}: {
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
  onBlurChange: (isBlurred: boolean) => void;
}) {
  const { athlete, setAthlete } = useStudyContext();
  const [studyToDelete, setStudyToDelete] = useState(null);

  const navigate = useNavigate();
  const studies = athlete.completedStudies;

  const { saveJson } = useJsonFiles();

  const onDelete = async () => {
    setAthlete({
      ...athlete,
      completedStudies: athlete.completedStudies.filter(
        (study) => study.date !== studyToDelete
      ),
    });
    setStudyToDelete(null);
    try {
      const result = await saveJson(
        `${naturalToCamelCase(athlete.name)}.json`,
        {
          ...athlete,
          completedStudies: athlete.completedStudies.filter(
            (study) => study.date !== studyToDelete
          ),
        },
        "athletes"
      );
      console.log(result.message);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    onBlurChange(!!studyToDelete);
  }, [studyToDelete]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out ${animation} ${
          studyToDelete && "blur-md pointer-events-none"
        }`}
        style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
      >
        <div className="self-end flex w-3/5 items-center">
          <p className="text-3xl text-dark self-center my-10">
            Estudios Realizados:{" "}
            <span className="text-secondary font-medium">{athlete.name}</span>
          </p>
          <OutlinedButton
            title="Ver Información del Atleta"
            onClick={() => {
              customNavigate("forward", "athleteStudies", "selectAthlete");
              setTimeout(() => {
                navigate("/selectAthlete?from=athlete");
              }, 300);
            }}
            icon="info"
            containerStyles="self-center ml-16"
          />
        </div>

        {studies.length ? (
          <div className={`grid grid-cols-3 gap-x-[5%] gap-y-16 w-full px-36 `}>
            {studies.map((study) => (
              <CompletedStudyCard
                key={
                  typeof study.date === "string"
                    ? study.date
                    : study.date.toISOString()
                }
                study={study}
                onDelete={(date) => setStudyToDelete(date)}
                onClick={() => {}}
              />
            ))}
          </div>
        ) : (
          <p className="text-xl my-16 self-center">No hay estudios cargados</p>
        )}
      </div>
      {studyToDelete && (
        <div
          className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 px-8 w-[500px]
             top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        >
          <p className="text-darkGray text-lg my-8">
            Está seguro que desea eliminar el test{" "}
            <span className="text-black">
              {
                studies.find((study) => study.date === studyToDelete)?.studyInfo
                  .name
              }
            </span>
            ?
          </p>
          <div className="flex justify-around w-full mb-8">
            <OutlinedButton
              icon="back"
              onClick={() => {
                setStudyToDelete(null);
              }}
              title="Volver"
              containerStyles="w-[35%]"
              inverse
            />
            <TonalButton
              icon="check"
              onClick={onDelete}
              title="Eliminar"
              containerStyles="w-[35%]"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default AthleteStudies;
