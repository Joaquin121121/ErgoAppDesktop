import TonalButton from "../components/TonalButton";
import OutlinedButton from "../components/OutlinedButton";
import { useStudyContext } from "../contexts/StudyContext";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase, getPerformanceDrop } from "../utils/utils";
import { StudyData, studyInfoLookup } from "../types/Studies";
import { useTranslation } from "react-i18next";
import BoscoStudyCard from "../components/BoscoStudyCard";
import navAnimations from "../styles/animations.module.css";
import scrollBarStyles from "../styles/scrollbar.module.css";
import ChartDisplay from "../components/MultipleJumpsChartDisplay";
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
  const { athlete, setAthlete } = useStudyContext();
  const navigate = useNavigate();
  const { saveJson } = useJsonFiles();
  const { t } = useTranslation();

  const studyInfo = athlete.completedStudies.find(
    (e) => (typeof e.date === "string" ? e.date : e.date.toISOString()) === date
  );
  const stiffness =
    studyInfo.results.type === "multipleJumps"
      ? studyInfo.results.stiffness
      : [];
  const performance =
    studyInfo.results.type === "multipleJumps"
      ? studyInfo.results.performance
      : [];

  const [isBlurred, setIsBlurred] = useState(false);
  const [jumpTimes, setJumpTimes] = useState([]);
  const [data, setData] = useState<StudyData>({
    avgFlightTime: 0,
    avgHeightReached: 0,
  });
  const [showSaveChanges, setShowSaveChanges] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedElements, setDeletedElements] = useState(false);
  const [navAnimation, setNavAnimation] = useState(animation);
  const [boscoStudy, setBoscoStudy] = useState("");
  const [blockAnimation, setBlockAnimation] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [performanceDrop, setPerformanceDrop] = useState(
    getPerformanceDrop(performance)
  );
  const [tableAnimation, setTableAnimation] = useState(
    navAnimations.popupFadeInTop
  );
  const [chartAnimation, setChartAnimation] = useState(
    navAnimations.popupFadeInTop
  );
  const study = boscoStudy ? studyInfo.results[boscoStudy] : studyInfo;

  const tableJSX = (
    <table className="w-full mt-8">
      <thead className="w-full">
        <tr className="flex justify-around items-center w-full">
          <th className="text-2xl w-20 font-normal text-tertiary">Saltos</th>
          <th className="text-2xl w-52 font-normal text-tertiary">
            Tiempo de Vuelo
          </th>
          {study.results && study.results.type === "multipleJumps" && (
            <th className="text-2xl w-52 font-normal text-tertiary">
              Tiempo de Piso
            </th>
          )}
          <th className="text-2xl w-36 font-normal text-tertiary">Altura</th>
          {study.results && study.results.type === "multipleJumps" && (
            <>
              <th className="text-2xl w-36 font-normal text-tertiary">
                Stiffness
              </th>
              <th className="text-2xl w-36 font-normal text-tertiary">
                Rendimiento
              </th>
            </>
          )}
          <th className="text-2xl w-24 font-normal text-tertiary">Eliminar</th>
        </tr>
      </thead>
      <tbody
        className={`w-full block ${scrollBarStyles.customScrollbar}`}
        style={{
          maxHeight: showTable ? "600px" : "200px",
          overflowY: "auto",
        }}
      >
        {jumpTimes?.map(
          (e, i) =>
            ((!showDeleted && !e.deleted) || showDeleted) && (
              <tr
                key={i}
                className="text-tertiary border border-transparent text-xl flex rounded-2xl justify-around items-center w-full hover:text-secondary hover:bg-lightRed  hover:border-secondary transition-all 300s ease-linear"
              >
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
                  {e.time ? `${e.time.toFixed(1)} s` : "-"}
                </td>
                {study.results && study.results.type === "multipleJumps" && (
                  <td
                    className="text-inherit w-52 flex items-center justify-center"
                    style={{ opacity: e.deleted && "60%" }}
                  >
                    {e.floorTime ? `${e.floorTime.toFixed(1)} s` : "-"}
                  </td>
                )}
                <td
                  className="text-inherit opacity w-36 flex items-center justify-center"
                  style={{ opacity: e.deleted && "60%" }}
                >
                  {e.time
                    ? `${(((9.81 * e.time ** 2) / 8) * 100).toFixed(1)} cm`
                    : "-"}
                </td>
                {study.results && study.results.type === "multipleJumps" && (
                  <>
                    <td
                      className="text-inherit opacity w-36 flex items-center justify-center"
                      style={{ opacity: e.deleted && "60%" }}
                    >
                      {stiffness?.[i] ? `${stiffness[i].toFixed(1)} N/m` : "-"}
                    </td>
                    <td
                      className="text-inherit opacity w-36 flex items-center justify-center"
                      style={{ opacity: e.deleted && "60%" }}
                    >
                      {performance?.[i] ? `${performance[i].toFixed(1)}%` : "-"}
                    </td>
                  </>
                )}
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
      </tbody>
      <tfoot className="w-full block">
        <tr className="text-darkGray border border-transparent text-xl flex rounded-2xl justify-around items-center w-full hover:text-secondary hover:bg-lightRed hover:border-secondary transition-all 300ms linear">
          <td className="text-secondary w-20 flex items-center justify-center">
            Promedios
          </td>
          <td className="text-secondary w-52 flex items-center justify-center">
            {data?.avgFlightTime && !Number.isNaN(data.avgFlightTime)
              ? `${data.avgFlightTime.toFixed(1)} s`
              : "-"}
          </td>
          {study.results && study.results.type === "multipleJumps" && (
            <td className="text-secondary w-52 flex items-center justify-center">
              {data?.avgFloorTime && !Number.isNaN(data.avgFloorTime)
                ? `${data.avgFloorTime.toFixed(1)} s`
                : "-"}
            </td>
          )}
          <td className="text-secondary w-36 flex items-center justify-center">
            {data?.avgHeightReached && !Number.isNaN(data.avgHeightReached)
              ? `${data.avgHeightReached.toFixed(1)} cm`
              : "-"}
          </td>
          {study.results && study.results.type === "multipleJumps" && (
            <>
              <td className="text-secondary w-36 flex items-center justify-center">
                {data?.avgStiffness && !Number.isNaN(data.avgStiffness)
                  ? `${data.avgStiffness.toFixed(1)} N/m`
                  : "-"}
              </td>
              <td className="text-secondary w-36 flex items-center justify-center">
                {data?.avgPerformance && !Number.isNaN(data.avgPerformance)
                  ? `${data.avgPerformance.toFixed(1)} %`
                  : "-"}
              </td>
            </>
          )}
          <td className="w-24 opacity-0 flex items-center justify-center">
            <img
              src="/close.png"
              className="h-6 w-6 hover:opacity-70 transition-all duration-200"
              alt=""
            />
          </td>
        </tr>
      </tfoot>
    </table>
  );
  const handleDelete = (index: number) => {
    const updatedJumpTimes = jumpTimes.map((jump, i) =>
      i === index ? { ...jump, deleted: !jumpTimes[i].deleted } : jump
    );
    const validJumpTimes = updatedJumpTimes.filter((e) => !e.deleted);
    setJumpTimes(updatedJumpTimes);
    const avgFlightTime =
      validJumpTimes.reduce((acc, time) => acc + time.time, 0) /
      validJumpTimes.length;
    if (study.results && study.results.type === "multipleJumps") {
      const validFlightTimes = validJumpTimes.map((e) => e.time);

      const max = Math.max(...validFlightTimes);
      const validPerformances = validFlightTimes.map((e) =>
        Number(((e / max) * 100).toFixed(1))
      );
      const validStiffnesses = validJumpTimes.map((e) =>
        Number(
          (Math.PI * (e.time + e.floorTime)) /
            (e.floorTime * e.floorTime * (e.time / e.floorTime + Math.PI / 4))
        )
      );
      const avgFloorTime =
        validJumpTimes.reduce((acc, time) => acc + time.floorTime, 0) /
        validJumpTimes.length;
      const avgPerformance =
        validPerformances.reduce((acc, time) => acc + time, 0) /
        validPerformances.length;
      const avgStiffness =
        validStiffnesses.reduce((acc, time) => acc + time, 0) /
        validStiffnesses.length;
      setData({
        avgFlightTime: avgFlightTime,
        avgHeightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
        avgFloorTime: avgFloorTime,
        avgPerformance: avgPerformance,
        avgStiffness: avgStiffness,
      });
      setPerformanceDrop(getPerformanceDrop(validPerformances));
      return;
    }
    setData({
      avgFlightTime: avgFlightTime,
      avgHeightReached: ((9.81 * avgFlightTime ** 2) / 8) * 100,
    });
  };

  const onClose = () => {
    if (boscoStudy) {
      setNavAnimation(navAnimations.fadeOutRight);
      setTimeout(() => {
        setBoscoStudy(null);
        setNavAnimation(navAnimations.fadeInLeft);
      }, 300);
    } else {
      customNavigate("back", "completedStudyInfo", "athleteStudies");
      setTimeout(() => {
        navigate("/athleteStudies");
      }, 300);
    }
  };

  const returnToMenu = () => {
    customNavigate("back", "completedStudyInfo", "athleteStudies");
    setNavAnimation(navAnimations.fadeOutRight);
    setTimeout(() => {
      navigate("/athleteStudies");
    }, 300);
  };

  const onCloseTable = () => {
    if (tableAnimation !== navAnimations.popupFadeInTop) {
      return;
    }
    setTableAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      setShowTable(false);
    }, 200);
  };

  const onCloseChart = () => {
    if (chartAnimation !== navAnimations.popupFadeInTop) {
      return;
    }
    setChartAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      setShowChart(false);
    }, 200);
  };

  const displayTable = () => {
    setTableAnimation(navAnimations.popupFadeInTop);
    setShowTable(true);
  };

  const displayChart = () => {
    setChartAnimation(navAnimations.popupFadeInTop);
    setShowChart(true);
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
      if (boscoStudy) {
        setNavAnimation(navAnimations.fadeOutRight);
        setTimeout(() => {
          setNavAnimation(navAnimations.fadeInLeft);
          setBoscoStudy(null);
        }, 300);
      } else {
        customNavigate("back", "completedStudyInfo", "athleteStudies");
        setTimeout(() => {
          navigate("/athleteStudies");
        }, 300);
      }
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  };

  const showStudy = (studyName: string) => {
    if (blockAnimation) {
      return;
    }
    setBlockAnimation(true);
    setNavAnimation(navAnimations.fadeOutLeft);
    setTimeout(() => {
      setNavAnimation(navAnimations.fadeInRight);
      setBoscoStudy(studyName);
    }, 300);
    setTimeout(() => {
      setBlockAnimation(false);
    }, 600);
  };

  const compare = () => {
    if (studyInfo.results.type !== "bosco") {
      return;
    }
    setNavAnimation(navAnimations.fadeOutLeft);
    customNavigate("forward", "completedStudyInfo", "compareThreeStudies");
    setTimeout(() => {
      navigate("/compareThreeStudies?date=" + studyInfo.date);
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
    console.log("Study: ", study);
    setJumpTimes(originalTimes);

    setData(
      boscoStudy
        ? {
            ...data,
            avgFlightTime: study.avgFlightTime,
            avgHeightReached: study.avgHeightReached,
          }
        : study.results.type === "multipleJumps"
        ? {
            ...data,
            avgFlightTime: study.results.avgFlightTime,
            avgHeightReached: study.results.avgHeightReached,
            avgStiffness: study.results.avgStiffness,
            avgPerformance: study.results.avgPerformance,
            avgFloorTime: study.results.avgFloorTime,
          }
        : {
            ...data,
            avgFlightTime: study.results.avgFlightTime,
            avgHeightReached: study.results.avgHeightReached,
          }
    );
  }, [boscoStudy]);

  useEffect(() => {
    if (showTable || showChart) {
      onBlurChange(true);
    } else {
      onBlurChange(false);
    }
  }, [showTable, showChart]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out ${navAnimation} ${
          (isBlurred || showTable || showChart) && "blur-md pointer-events-none"
        }`}
        style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
      >
        <div className="w-full flex justify-center gap-x-16 items-center">
          {studyInfo.results.type === "bosco" && !boscoStudy && (
            <div className="w-[158px]"></div>
          )}
          <p className="text-3xl text-dark self-center my-10 text-tertiary">
            Resultados del{" "}
            <span className="text-secondary">
              {t(boscoStudy ? boscoStudy : study.studyInfo.name)}
            </span>
          </p>
          {studyInfo.results.type === "bosco" && !boscoStudy && (
            <TonalButton icon="compare" title="Comparar" onClick={compare} />
          )}
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
          <>
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
            <OutlinedButton
              title="Volver"
              icon="back"
              onClick={returnToMenu}
              inverse
              containerStyles="mt-16 self-center"
            />
          </>
        ) : (
          <div
            className={`w-[90%] bg-white shadow-sm rounded-2xl mt-2 flex flex-col px-16 ${
              (isBlurred || showTable || showChart) &&
              "blur-md pointer-events-none"
            } transition-all 300 ease-in-out ${animation}`}
          >
            {tableJSX}
            <div className="self-center">
              {study.results && study.results.type !== "multipleJumps" && (
                <p className="mt-16 text-xl text-tertiary">
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
              )}
              {study.results && study.results.type === "multipleJumps" && (
                <>
                  <div className="w-full mt-12 flex items-center justify-center gap-x-8">
                    <OutlinedButton
                      title="Ver Tabla"
                      icon="tableRed"
                      onClick={displayTable}
                    />
                    <TonalButton
                      title="Ver Gráfico"
                      icon="studies"
                      onClick={displayChart}
                    />
                  </div>

                  <p className="self-center text-xl mt-12 text-tertiary">
                    Caída de Rendimiento por Fatiga:{" "}
                    <span className="text-secondary font-medium">
                      {performanceDrop?.toFixed(1)}%
                    </span>
                  </p>
                </>
              )}
              <p className="mt-4 text-tertiary text-xl">
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
      {showTable && (
        <div
          className={`bg-white shadow-sm border border-gray fixed z-50 rounded-2xl py-2 px-8 w-[1400px]
             top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pt-12 transition-all duration-300 ease-linear ${tableAnimation}`}
        >
          <div
            className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
            onClick={onCloseTable}
          >
            <img src="/close.png" className="h-6 w-6" alt="Close" />
          </div>
          <p className="text-3xl text-secondary self-center">
            Tabla de Resultados
          </p>
          {tableJSX}
          <div className="w-full flex justify-center gap-x-16 mt-12 mb-8 items-center">
            <OutlinedButton
              title="Volver"
              icon="back"
              onClick={() => {
                setTableAnimation(navAnimations.popupFadeOutTop);
                setTimeout(() => {
                  setShowTable(false);
                }, 200);
              }}
              inverse
            />
            <TonalButton
              title="Ver Gráfico"
              icon="studies"
              onClick={() => {
                onCloseTable();
                displayChart();
              }}
            />
          </div>
        </div>
      )}
      {showChart && (
        <ChartDisplay
          setShowChart={setShowChart}
          jumpTimes={jumpTimes}
          setShowTable={setShowTable}
          onClose={onCloseChart}
          chartAnimation={chartAnimation}
          displayTable={displayTable}
          performance={performance}
        />
      )}
    </>
  );
}

export default CompletedStudyInfo;
