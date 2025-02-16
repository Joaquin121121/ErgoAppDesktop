import React, { useEffect, useState } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import CompletedStudyCard from "../components/CompletedStudyCard";
import OutlinedButton from "../components/OutlinedButton";
import { useNavigate } from "react-router-dom";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import TonalButton from "../components/TonalButton";
import { validComparisons } from "../types/Studies";

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

  const navigate = useNavigate();
  const studies = athlete.completedStudies;

  const [studyToDelete, setStudyToDelete] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [cardStyles, setCardStyles] = useState({});
  const [validStudiesToCompare, setValidStudiesToCompare] = useState(
    studies.map((e) => ({ valid: e.results.type !== "bosco" }))
  );

  const { saveJson } = useJsonFiles();

  const onClose = () => {
    customNavigate("back", "athleteStudies", "athletes");
    setTimeout(() => {
      navigate("/athletes");
    }, 300);
  };

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

  const handleStudySelection = (date: string) => {
    if (comparing) {
      if (Object.values(cardStyles).some((style) => style !== "")) {
        const dateOfFirstSelected = Object.keys(cardStyles).find(
          (key) => cardStyles[key] !== ""
        );
        if (dateOfFirstSelected === date) {
          setCardStyles({
            ...cardStyles,
            [date]: "",
          });
          return;
        }
        customNavigate("forward", "athleteStudies", "compareStudies");
        setTimeout(() => {
          navigate(
            "/compareStudies?date1=" + dateOfFirstSelected + "&date2=" + date
          );
        }, 300);
      }
      const studyType = studies.find(
        (e) =>
          (typeof e.date === "string" ? e.date : e.date.toISOString()) === date
      ).results.type;
      const validComparisonsForStudy = validComparisons[studyType];
      setValidStudiesToCompare(
        studies.map((e) => {
          return {
            valid: validComparisonsForStudy.includes(e.results.type),
          };
        })
      );

      setCardStyles({
        ...cardStyles,
        [date]: "border border-secondary",
      });
      return;
    }
    customNavigate("forward", "athleteStudies", "completedStudyInfo");
    setTimeout(() => {
      navigate("/completedStudyInfo?date=" + date);
    }, 300);
  };

  useEffect(() => {
    onBlurChange(!!studyToDelete);
    console.log(athlete.completedStudies);
  }, [studyToDelete]);

  useEffect(() => {
    setCardStyles(
      studies.reduce(
        (acc, study) => ({
          ...acc,
          [typeof study.date === "string"
            ? study.date
            : study.date.toISOString()]: "",
        }),
        {}
      )
    );
    console.log(studies);
  }, [studies]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out ${animation} ${
          studyToDelete && "blur-md pointer-events-none"
        }`}
        style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
      >
        <div className="self-center flex gap-x-16 items-center">
          {comparing ? (
            <>
              <p className="text-3xl text-dark self-center my-10 text-black">
                Selecciona los estudios a comparar
              </p>
              <TonalButton
                icon="closeWhite"
                title="Cancelar"
                onClick={() => {
                  setCardStyles(
                    studies.reduce(
                      (acc, study) => ({
                        ...acc,
                        [typeof study.date === "string"
                          ? study.date
                          : study.date.toISOString()]: "",
                      }),
                      {}
                    )
                  );
                  setValidStudiesToCompare(
                    studies.map((e) => ({ valid: e.results.type !== "bosco" }))
                  );
                  setComparing(false);
                }}
              />
            </>
          ) : (
            <>
              <p className="text-3xl text-dark self-center my-10 text-black">
                Estudios Realizados:{" "}
                <span className="text-secondary font-medium">
                  {athlete.name}
                </span>
              </p>
              <OutlinedButton
                title="Ver Info Atleta"
                onClick={() => {
                  customNavigate("forward", "athleteStudies", "selectAthlete");
                  setTimeout(() => {
                    navigate("/selectAthlete?from=athlete");
                  }, 300);
                }}
                icon="info"
              />
              <TonalButton
                icon="compare"
                title="Comparar"
                onClick={() => {
                  setComparing(true);
                }}
              />
            </>
          )}
        </div>

        {studies.length ? (
          <div className={`grid grid-cols-3 gap-x-[5%] gap-y-16 w-full px-36 `}>
            {studies.map((study, index) => {
              const key =
                typeof study.date === "string"
                  ? study.date
                  : study.date.toISOString();
              return (
                <CompletedStudyCard
                  disabled={comparing && !validStudiesToCompare[index].valid}
                  key={key}
                  study={study}
                  onDelete={(date) => setStudyToDelete(date)}
                  onClick={() => {
                    handleStudySelection(key);
                  }}
                  cardStyles={cardStyles[key]}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-xl my-16 self-center text-black">
            No hay estudios cargados
          </p>
        )}
        <TonalButton
          title="Volver"
          icon="backWhite"
          onClick={onClose}
          inverse
          containerStyles="mt-16 self-center"
        />
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
