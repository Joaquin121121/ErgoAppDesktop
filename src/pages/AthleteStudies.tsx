import React, { useEffect, useState } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import CompletedStudyCard from "../components/CompletedStudyCard";
import OutlinedButton from "../components/OutlinedButton";
import { useNavigate } from "react-router-dom";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import TonalButton from "../components/TonalButton";
import Filter from "../components/Filter";
import { useBlur } from "../contexts/BlurContext";
import { Studies, Study, validComparisons } from "../types/Studies";

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
  const { athlete, setAthlete } = useStudyContext();

  const navigate = useNavigate();
  const studies = athlete.completedStudies;

  const [studyToDelete, setStudyToDelete] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [cardStyles, setCardStyles] = useState({});
  const [validStudiesToCompare, setValidStudiesToCompare] = useState(
    studies.map((e) => ({ valid: e.results.type !== "bosco" }))
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [filteredStudies, setFilteredStudies] = useState<
    [keyof Studies, Study][]
  >([]);
  const { isBlurred, setIsBlurred } = useBlur();
  const { saveJson } = useJsonFiles();

  const onClose = async () => {
    customNavigate("back", "athleteStudies", "athleteMenu");
    setTimeout(() => {
      navigate("/athleteMenu");
    }, 300);
  };

  // Add DEL key event listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger onClose if Backspace is pressed AND no input/textarea is focused
      if (
        event.key === "Backspace" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName
        )
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const filter = () => {
    setIsBlurred(true);
    setFiltering(true);
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
          setValidStudiesToCompare(
            studies.map((e) => ({ valid: e.results.type !== "bosco" }))
          );
          return;
        }
        customNavigate("forward", "athleteStudies", "compareTwoStudies");
        setTimeout(() => {
          navigate(
            "/compareTwoStudies?date1=" + dateOfFirstSelected + "&date2=" + date
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
    customNavigate("forward", "athleteStudies", "completedStudyDashboard");
    setTimeout(() => {
      navigate("/completedStudyDashboard?date=" + date);
    }, 300);
  };

  useEffect(() => {
    setIsBlurred(!!studyToDelete);
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
    console.log("Studies:", studies);
  }, [studies]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out ${animation} ${
          (studyToDelete || filtering) && "blur-md pointer-events-none"
        }`}
        style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
      >
        <div className="self-center flex gap-x-16 justify-between items-center">
          {comparing ? (
            <>
              <p className="text-3xl text-dark self-center my-10 text-tertiary">
                Seleccione los tests a comparar
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
              <TonalButton
                title="Volver"
                icon="backWhite"
                onClick={onClose}
                inverse
              />
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
              <p className="text-3xl text-dark self-center my-10 text-tertiary">
                Tests Realizados:{" "}
                <span className="text-secondary font-medium">
                  {athlete.name.split(" ")[0]}
                </span>
              </p>

              <OutlinedButton icon="filter" title="Filtrar" onClick={filter} />
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
                  comparing={comparing}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-xl my-16 self-center text-tertiary">
            No hay tests cargados
          </p>
        )}
      </div>
      {studyToDelete && (
        <div
          className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 px-8 w-[500px]
             top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        >
          <p className="text-darkGray text-lg my-8">
            Está seguro que desea eliminar el test{" "}
            <span className="text-tertiary">
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
      {filtering && (
        <Filter
          selectedEquipment={selectedEquipment}
          setSelectedEquipment={setSelectedEquipment}
          setFilteredStudies={setFilteredStudies}
          top={100}
          right={100}
        />
      )}
    </>
  );
}

export default AthleteStudies;
