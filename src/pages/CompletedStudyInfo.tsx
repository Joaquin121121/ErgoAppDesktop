import TonalButton from "../components/TonalButton";
import OutlinedButton from "../components/OutlinedButton";
import { useStudyContext } from "../contexts/StudyContext";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import { useTranslation } from "react-i18next";
import BoscoStudyCard from "../components/BoscoStudyCard";

function CompletedStudyInfo({
  isExpanded,
  animation,
  onBlurChange,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: string;
  onBlurChange: (isBlurred: boolean) => void;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date");
  const boscoStudy = searchParams.get("study");
  const { athlete, setAthlete } = useStudyContext();
  const navigate = useNavigate();
  const { saveJson } = useJsonFiles();
  const { t } = useTranslation();

  const studyInfo = athlete.completedStudies.find(
    (e) => (typeof e.date === "string" ? e.date : e.date.toISOString()) === date
  );
  const study = boscoStudy ? studyInfo.results[boscoStudy] : studyInfo;

  const [isBlurred, setIsBlurred] = useState(false);
  const [jumpTimes, setJumpTimes] = useState([]);
  const [data, setData] = useState({ avgFlightTime: 0, avgHeightReached: 0 });
  const [showSaveChanges, setShowSaveChanges] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedElements, setDeletedElements] = useState(false);

  const handleDelete = (index: number) => {
    if (study.results && study.results.type === "bosco") {
      return;
    }
    const updatedJumpTimes = jumpTimes.map((jump, i) =>
      i === index ? { ...jump, deleted: !jumpTimes[i].deleted } : jump
    );
    const validJumpTimes = updatedJumpTimes.filter((e) => !e.deleted);
    setJumpTimes(updatedJumpTimes);
    const avgTime =
      validJumpTimes.reduce((acc, time) => acc + time.time, 0) /
      validJumpTimes.length;
    setData({
      avgFlightTime: avgTime,
      avgHeightReached: ((9.81 * avgTime ** 2) / 8) * 100,
    });
  };

  const onClose = () => {
    customNavigate(
      "back",
      "completedStudyInfo",
      boscoStudy ? "completedStudyInfo" : "athleteStudies"
    );
    setTimeout(() => {
      navigate(
        boscoStudy ? "/completedStudyInfo?date=" + date : `/athleteStudies`
      );
    }, 300);
  };

  const saveChanges = async () => {
    const studyToSave = boscoStudy
      ? {
          ...studyInfo,
          results: {
            ...studyInfo.results,
            [boscoStudy]: {
              ...study,
              avgFlightTime: data.avgFlightTime,
              avgHeightReached: data.avgHeightReached,
              times: jumpTimes,
            },
          },
        }
      : {
          ...study,
          results: {
            ...study.results,
            avgFlightTime: data.avgFlightTime,
            avgHeightReached: data.avgHeightReached,
            times: jumpTimes,
          },
        };
    const filteredStudies = athlete.completedStudies.filter(
      (e) =>
        (typeof e.date === "string" ? e.date : e.date.toISOString()) !== date
    );
    try {
      const result = await saveJson(
        `${naturalToCamelCase(athlete.name)}.json`,
        {
          ...athlete,
          completedStudies: [...filteredStudies, studyToSave],
        },
        "athletes"
      );
      setAthlete({
        ...athlete,
        completedStudies: [...filteredStudies, studyToSave],
      });

      setTimeout(() => {
        navigate(
          boscoStudy ? `/completedStudyInfo?date=${date}` : "/athleteStudies"
        );
      }, 300);
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  };

  const showStudy = (studyName: string) => {
    customNavigate("forward", "completedStudyInfo", "completedStudyInfo");
    console.log(studyName);
    setTimeout(() => {
      navigate(`/completedStudyInfo?date=${study.date}&study=${studyName}`);
    }, 300);
  };

  useEffect(() => {
    if (!jumpTimes || !jumpTimes.length) {
      return;
    }
    if (boscoStudy) {
      if (
        jumpTimes.length === study.times.length &&
        jumpTimes.every(
          (obj, index) =>
            obj.time === study.times[index].time &&
            obj.deleted === study.times[index].deleted
        )
      ) {
        setShowSaveChanges(false);
      } else {
        setShowSaveChanges(true);
      }
    } else if (
      jumpTimes.length === study.results.times.length &&
      jumpTimes.every(
        (obj, index) =>
          study.results.type !== "bosco" &&
          obj.time === study.results.times[index].time &&
          obj.deleted === study.results.times[index].deleted
      )
    ) {
      setShowSaveChanges(false);
    } else {
      setShowSaveChanges(true);
    }
    if (jumpTimes.some((e) => e.deleted)) {
      setDeletedElements(true);
    } else {
      setDeletedElements(false);
    }
  }, [jumpTimes]);

  useEffect(() => {
    const originalTimes = boscoStudy ? study.times : study.results.times;
    setJumpTimes(originalTimes);

    setData(
      boscoStudy
        ? {
            avgFlightTime: study.avgFlightTime,
            avgHeightReached: study.avgHeightReached,
          }
        : {
            avgFlightTime: study.results.avgFlightTime,
            avgHeightReached: study.results.avgHeightReached,
          }
    );
  }, [boscoStudy]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out ${animation} ${
          isBlurred && "blur-md pointer-events-none"
        }`}
        style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
      >
        <div className="self-end flex w-3/5 items-center">
          <p className="text-3xl text-dark self-center my-10 text-black">
            Resultados del{" "}
            <span className="text-secondary">
              {t(boscoStudy ? boscoStudy : study.studyInfo.name)} Test
            </span>
          </p>
          {deletedElements && (
            <OutlinedButton
              title={showDeleted ? "Esconder Eliminados" : "Mostrar Eliminados"}
              icon={showDeleted ? "eyeHide" : "eye"}
              onClick={() => {
                setShowDeleted(!showDeleted);
              }}
              containerStyles="ml-16"
            />
          )}
        </div>
        {study.results && study.results.type === "bosco" && !boscoStudy ? (
          <div className="w-full flex justify-around items-center gap-x-16 px-16">
            {Object.keys(study.results).map(
              (e) =>
                e !== "type" && (
                  <BoscoStudyCard
                    study={study.results[e]}
                    onClick={() => {
                      showStudy(e);
                    }}
                    studyName={e}
                    containerStyles="flex-1"
                  />
                )
            )}
          </div>
        ) : (
          <div
            className={`w-[90%] bg-white shadow-sm rounded-2xl mt-2 flex flex-col px-16 ${
              isBlurred && "blur-md pointer-events-none"
            } transition-all 300 ease-in-out ${animation}`}
          >
            <table className="w-full mt-8">
              <thead className="w-full">
                <tr className="flex justify-around items-center w-full">
                  <th className="text-2xl w-20 font-normal text-black">
                    Saltos
                  </th>
                  <th className="text-2xl w-52 font-normal text-black">
                    Tiempo de Vuelo
                  </th>
                  <th className="text-2xl w-36 font-normal text-black">
                    Altura
                  </th>
                  <th className="text-2xl w-24 font-normal text-black">
                    Eliminar
                  </th>
                </tr>
              </thead>
              <tbody className="w-full">
                {jumpTimes &&
                  jumpTimes.map(
                    (e, i) =>
                      (!e.deleted || (e.deleted && showDeleted)) && (
                        <tr className="text-tertiary border border-transparent text-xl flex rounded-2xl justify-around items-center w-full hover:text-secondary hover:bg-lightRed  hover:border-secondary transition-all 300s ease-linear">
                          <td
                            className="text-inherit w-20 flex items-center justify-center"
                            style={{
                              opacity: e.deleted && "60%",
                              color: e.deleted && "#9E9E9E",
                            }}
                          >
                            {i + 1}
                          </td>
                          <td
                            className="text-inherit w-52 flex items-center justify-center"
                            style={{ opacity: e.deleted && "60%" }}
                          >
                            {e.time.toFixed(1)} s
                          </td>
                          <td
                            className="text-inherit opacity w-36 flex items-center justify-center"
                            style={{ opacity: e.deleted && "60%" }}
                          >
                            {(((9.81 * e.time ** 2) / 8) * 100).toFixed(1)} cm
                          </td>
                          <td className="w-24 flex items-center justify-center ">
                            <img
                              src={`/${e.deleted ? "undo" : "close"}.png`}
                              className="h-6 w-6 hover:opacity-70 transition-all cursor-pointer duration-200"
                              alt=""
                              onClick={() => {
                                handleDelete(i);
                              }}
                            />
                          </td>
                        </tr>
                      )
                  )}
                <tr className="text-darkGray border border-transparent text-lg flex rounded-2xl justify-around items-center w-full hover:text-secondary hover:bg-lightRed hover:border-secondary transition-all 300ms linear">
                  <td className="text-secondary w-20 flex items-center justify-center">
                    Promedio
                  </td>
                  <td className="text-secondary w-52 flex items-center justify-center">
                    {!data.avgFlightTime || Number.isNaN(data.avgFlightTime)
                      ? "Error"
                      : data.avgFlightTime.toFixed(1) + " s"}
                  </td>
                  <td className="text-secondary w-36 flex items-center justify-center">
                    {!data.avgHeightReached ||
                    Number.isNaN(data.avgHeightReached)
                      ? "Error"
                      : data.avgHeightReached.toFixed(1) + " cm"}
                  </td>
                  <td className="w-24 opacity-0 flex items-center justify-center">
                    <img
                      src="/close.png"
                      className="h-6 w-6 hover:opacity-70 transition-all duration-200"
                      alt=""
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="self-center">
              {(study.results && study.results.type !== "multipleJumps") ||
                (!!boscoStudy && (
                  <p className="mt-16 text-xl text-black">
                    {(study.results && study.results.type === "dropJump") ||
                    boscoStudy === "dropJump" ? (
                      <>
                        Altura de Caída:{" "}
                        <span className="text-secondary">
                          {study.results.height} {study.results.heightUnit}
                        </span>
                      </>
                    ) : (
                      <>
                        Carga Añadida:{" "}
                        <span className="text-secondary">
                          {boscoStudy ? study.load : study.results.load}{" "}
                          {boscoStudy ? study.loadUnit : study.results.loadUnit}
                        </span>
                      </>
                    )}
                  </p>
                ))}
              <p className="mt-4 text-black text-xl">
                Pie de Despegue:{" "}
                <span className="text-secondary">
                  {t(
                    boscoStudy ? study.takeoffFoot : study.results.takeoffFoot
                  )}
                </span>
              </p>
            </div>

            <div className="w-full mt-16 mb-8 flex justify-around items-center">
              <OutlinedButton
                title="Volver"
                icon="back"
                onClick={onClose}
                inverse
              />
              {showSaveChanges && (
                <TonalButton
                  title="Guardar Cambios"
                  icon="check"
                  onClick={saveChanges}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default CompletedStudyInfo;
