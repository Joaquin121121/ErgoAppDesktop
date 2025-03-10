import { useStudyContext } from "../contexts/StudyContext";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { formatDate } from "../utils/utils";
import { criterionLookup, units, CompletedStudy } from "../types/Studies";
import { ftToCm } from "../utils/utils";
import { useTranslation } from "react-i18next";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import navAnimations from "../styles/animations.module.css";
import ComparisonChartDisplay from "../components/ComparisonChartDisplay";
import { useAthleteComparison } from "../contexts/AthleteComparisonContext";
function CompareTwoStudies({
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
  const { athlete } = useStudyContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date1 = searchParams.get("date1");
  const date2 = searchParams.get("date2");
  const diffAthletes = searchParams.get("diffAthletes") === "true";
  const { athleteToCompare1, athleteToCompare2 } = useAthleteComparison();

  const [showChart, setShowChart] = useState(false);

  const [chartAnimation, setChartAnimation] = useState(
    navAnimations.popupFadeInTop
  );

  const study1 = diffAthletes
    ? athleteToCompare1.completedStudies.find((study) =>
        typeof study.date === "string"
          ? study.date === date1
          : study.date.toISOString() === date1
      )
    : athlete.completedStudies.find((study) =>
        typeof study.date === "string"
          ? study.date === date1
          : study.date.toISOString() === date1
      );
  const study2 = diffAthletes
    ? athleteToCompare2.completedStudies.find((study) =>
        typeof study.date === "string"
          ? study.date === date2
          : study.date.toISOString() === date2
      )
    : athlete.completedStudies.find((study) =>
        typeof study.date === "string"
          ? study.date === date2
          : study.date.toISOString() === date2
      );

  const onClose = () => {
    customNavigate(
      "back",
      "compareTwoStudies",
      diffAthletes ? "compareTwoAthletes" : "athleteStudies"
    );
    setTimeout(() => {
      navigate(diffAthletes ? "/compareTwoAthletes" : "/athleteStudies");
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

  const displayChart = () => {
    setChartAnimation(navAnimations.popupFadeInTop);
    setShowChart(true);
  };

  const onCloseChart = () => {
    if (chartAnimation !== navAnimations.popupFadeInTop) {
      return;
    }
    setChartAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      setShowChart(false);
    }, 300);
  };

  const compare = (
    criterion: string,
    study1: CompletedStudy,
    study2: CompletedStudy
  ) => {
    switch (criterion) {
      case "performanceDrop":
        return {
          color:
            Number(study1.results[criterion].toFixed(2)) ===
            Number(study2.results[criterion].toFixed(2))
              ? ""
              : Number(study1.results[criterion].toFixed(2)) >
                Number(study2.results[criterion].toFixed(2))
              ? "#e81d23"
              : "#00A859",
        };
      case "takeoffFoot":
        return {};
      case "height":
        if (
          study1.results.type === "multipleDropJump" &&
          study2.results.type === "multipleDropJump"
        ) {
          const height1 = study1.results.maxAvgHeightReached;
          const height2 = study2.results.maxAvgHeightReached;
          return {
            color: height1 > height2 ? "#00A859" : "#e81d23",
          };
        }
      default:
        return {
          color:
            Number(study1.results[criterion].toFixed(2)) ===
            Number(study2.results[criterion].toFixed(2))
              ? ""
              : Number(study1.results[criterion].toFixed(2)) >
                Number(study2.results[criterion].toFixed(2))
              ? "#00A859"
              : "#e81d23",
        };
    }
  };

  const getDiff = (
    criterion: string,
    study1: CompletedStudy,
    study2: CompletedStudy
  ) => {
    if (study1.results[criterion] === 0 || study2.results[criterion] === 0) {
      return {};
    }
    switch (criterion) {
      case "performanceDrop":
        return {
          content: `${study1.results[criterion].toFixed(2)}%`,
          icon:
            study1.results[criterion] > study2.results[criterion]
              ? "▲"
              : study1.results[criterion] < study2.results[criterion]
              ? "▼"
              : "",
          color:
            study1.results[criterion] < study2.results[criterion]
              ? "#00A859"
              : study1.results[criterion] > study2.results[criterion]
              ? "#e81d23"
              : "",
        };
      case "takeoffFoot":
        return {};
      case "height":
        if (
          study1.results.type === "multipleDropJump" &&
          study2.results.type === "multipleDropJump"
        ) {
          const height1 = study1.results.maxAvgHeightReached;
          const height2 = study2.results.maxAvgHeightReached;
          const diff = ((height1 - height2) / height2) * 100;

          return {
            content: `${diff.toFixed(2)}%`,
            icon: diff > 0 ? "▲" : diff < 0 ? "▼" : "",
            color: diff > 0 ? "#00A859" : diff < 0 ? "#e81d23" : "",
          };
        }
      default:
        const val1 = Number(study1.results[criterion].toFixed(2));
        const val2 = Number(study2.results[criterion].toFixed(2));
        if (!isNaN(val1) && !isNaN(val2)) {
          const diff = ((val2 - val1) / val1) * 100;
          if (diff === 0) {
            return {};
          }
          return {
            content: `${diff.toFixed(2)}%`,
            icon: diff > 0 ? "▲" : diff < 0 ? "▼" : "",
            color: diff > 0 ? "#00A859" : diff < 0 ? "#e81d23" : "",
          };
        }
        return {};
    }
  };

  useEffect(() => {
    onBlurChange(showChart);
  }, [showChart]);

  return (
    <div
      className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out`}
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[90%] bg-white shadow-sm rounded-2xl mt-2 flex flex-col px-16 $ transition-all 300 ease-in-out ${animation} ${
          showChart && "blur-md pointer-events-none"
        }`}
      >
        <div
          className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="" />
        </div>
        <p className="text-3xl self-center mb-16">Comparación de Tests</p>
        {study1.results.type !== "bosco" && study2.results.type !== "bosco" && (
          <div className="flex justify-around pr-24">
            <div className="flex flex-col gap-y-12 ">
              <div className="w-64 h-16"></div>

              {criterionLookup[study1.results.type].map((criterion) => (
                <div key={criterion} className="w-72 text-2xl">
                  {t(criterion)}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-y-12">
              <div className="text-3xl font-normal text-secondary w-64 flex flex-col items-center">
                {study1.studyInfo.name}
                <span className="text-darkGray text-xl">
                  {diffAthletes
                    ? athleteToCompare1.name
                    : formatDate(study1.date)}
                </span>
              </div>

              {criterionLookup[study1.results.type].map((criterion) => (
                <div
                  key={criterion}
                  className="w-64 text-2xl flex flex-col items-center"
                  style={compare(criterion, study1, study2)}
                >
                  {typeof study1.results[criterion] === "number" &&
                  study1.results[criterion] !== 0
                    ? study1.results[criterion].toFixed(2)
                    : t(study1.results[criterion])}
                  {study1.results[`${criterion}Unit`]
                    ? ` ${study1.results[`${criterion}Unit`]}`
                    : ` ${units[criterion] || ""}`}
                  {criterion === "performanceDrop" && "%"}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-y-12">
              <div className="w-36 h-16"></div>
              {criterionLookup[study1.results.type].map((criterion) => (
                <div
                  key={criterion}
                  className="text-xl font-light h-8"
                  style={{ color: getDiff(criterion, study1, study2).color }}
                >
                  {getDiff(criterion, study1, study2).icon}{" "}
                  {getDiff(criterion, study1, study2).content}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-y-12">
              <div className="text-3xl font-normal text-secondary w-64 flex flex-col items-center">
                {study2.studyInfo.name}
                <span className="text-darkGray text-xl">
                  {diffAthletes
                    ? athleteToCompare2.name
                    : formatDate(study2.date)}
                </span>
              </div>

              {criterionLookup[study2.results.type].map((criterion) => (
                <div
                  key={criterion}
                  className="w-64 text-2xl flex flex-col items-center"
                  style={compare(criterion, study2, study1)}
                >
                  {criterion === "performanceDrop"
                    ? study2.results[criterion].toFixed(2) + "%"
                    : typeof study2.results[criterion] === "number" &&
                      study2.results[criterion] !== 0
                    ? study2.results[criterion].toFixed(2)
                    : t(study2.results[criterion])}
                  {study2.results[`${criterion}Unit`]
                    ? ` ${study2.results[`${criterion}Unit`]}`
                    : ` ${units[criterion] || ""}`}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="w-full mt-32 mb-8 flex items-center justify-center gap-x-16">
          <OutlinedButton
            title="Volver"
            icon="back"
            onClick={onClose}
            inverse
          />
          <TonalButton
            title="Ver Gráfico"
            icon="studies"
            onClick={displayChart}
          />
        </div>
      </div>
      {showChart &&
        study1.results.type !== "bosco" &&
        study2.results.type !== "bosco" && (
          <ComparisonChartDisplay
            jumpTimesA={
              study1.results.type === "multipleDropJump"
                ? study1.results.dropJumps.map((jump) => {
                    return { time: jump.avgFlightTime, deleted: false };
                  })
                : study1.results.times
            }
            jumpTimesB={
              study2.results.type === "multipleDropJump"
                ? study2.results.dropJumps.map((jump) => {
                    return { time: jump.avgFlightTime, deleted: false };
                  })
                : study2.results.times
            }
            setShowChart={setShowChart}
            chartAnimation={chartAnimation}
            onClose={onCloseChart}
            type1={study1.results.type}
            type2={study2.results.type}
            showStiffness={
              study1.results.type === "multipleJumps" &&
              study2.results.type === "multipleJumps"
            }
            stiffnessA={
              study1.results.type === "multipleJumps"
                ? study1.results.stiffness
                : undefined
            }
            stiffnessB={
              study2.results.type === "multipleJumps"
                ? study2.results.stiffness
                : undefined
            }
          />
        )}
    </div>
  );
}

export default CompareTwoStudies;
