import React, { useState, useEffect } from "react";
import {
  CompletedStudy,
  criterionLookup,
  units,
  CMJResult,
  SquatJumpResult,
  AbalakovResult,
} from "../types/Studies";
import { ftToCm } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useStudyContext } from "../contexts/StudyContext";
import navAnimations from "../styles/animations.module.css";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utils/utils";
import ComparisonChartDisplay from "../components/ComparisonChartDisplay";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import BoscoComparisonChart from "../components/BoscoComparisonChart";
import { useBlur } from "../contexts/BlurContext";
function CompareThreeStudies({
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
  const { isBlurred, setIsBlurred } = useBlur();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date");

  const { athlete } = useStudyContext();

  const navigate = useNavigate();

  const study = athlete.completedStudies.find((study) =>
    typeof study.date === "string"
      ? study.date === date
      : study.date.toISOString() === date
  );
  const squatJump: SquatJumpResult | null =
    study?.results.type === "bosco" ? study?.results.squatJump : null;

  const cmj: CMJResult | null =
    study?.results.type === "bosco" ? study?.results.cmj : null;
  const abalakov: AbalakovResult | null =
    study?.results.type === "bosco" ? study?.results.abalakov : null;

  const criterion = criterionLookup.cmj;

  const [showChart, setShowChart] = useState(false);

  const [chartAnimation, setChartAnimation] = useState(
    navAnimations.popupFadeInTop
  );

  const onClose = () => {
    customNavigate("back", "compareThreeStudies", "completedStudyInfo");
    setTimeout(() => {
      navigate("/completedStudyInfo?date=" + date);
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
    study1: CMJResult | SquatJumpResult | AbalakovResult,
    study2: CMJResult | SquatJumpResult | AbalakovResult
  ) => {
    console.log("criterion", criterion);
    console.log("study1", study1);
    console.log("study2", study2);
    switch (criterion) {
      case "takeoffFoot":
        return {};

      default:
        return {
          color:
            Number(study1[criterion].toFixed(2)) ===
            Number(study2[criterion].toFixed(2))
              ? ""
              : Number(study1[criterion].toFixed(2)) >
                Number(study2[criterion].toFixed(2))
              ? "#00A859"
              : "#e81d23",
        };
    }
  };

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
        {squatJump && cmj && abalakov && (
          <div className="flex justify-around pr-24">
            <div className="flex flex-col gap-y-12">
              <div className="w-56 h-16"></div>

              {criterionLookup["bosco"].map((criterion) => (
                <div key={criterion} className="w-56 text-2xl">
                  {t(criterion)}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-y-12">
              <div className="text-3xl font-normal text-secondary w-56 flex flex-col items-center">
                {t("squatJump")}
                <span className="text-darkGray text-xl">
                  {formatDate(study.date)}
                </span>
              </div>

              {criterionLookup["bosco"].map((criterion) => (
                <div
                  key={criterion}
                  className="w-56 text-2xl flex flex-col items-center"
                  style={compare(criterion, squatJump, cmj)}
                >
                  {typeof squatJump[criterion] === "number" &&
                  squatJump[criterion] !== 0
                    ? squatJump[criterion].toFixed(2)
                    : t(squatJump[criterion])}
                  {squatJump[`${criterion}Unit`]
                    ? ` ${squatJump[`${criterion}Unit`]}`
                    : ` ${units[criterion] || ""}`}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-y-12">
              <div className="text-3xl font-normal text-secondary w-56 flex flex-col items-center">
                {t("cmj")}
                <span className="text-darkGray text-xl">
                  {formatDate(study.date)}
                </span>
              </div>

              {criterionLookup["bosco"].map((criterion) => (
                <div
                  key={criterion}
                  className="w-56 text-2xl flex flex-col items-center"
                  style={compare(criterion, cmj, squatJump)}
                >
                  {typeof cmj[criterion] === "number" && cmj[criterion] !== 0
                    ? cmj[criterion].toFixed(2)
                    : t(cmj[criterion])}
                  {cmj[`${criterion}Unit`]
                    ? ` ${cmj[`${criterion}Unit`]}`
                    : ` ${units[criterion] || ""}`}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-y-12">
              <div className="text-3xl font-normal text-secondary w-56 flex flex-col items-center">
                {t("abalakov")}
                <span className="text-darkGray text-xl">
                  {formatDate(study.date)}
                </span>
              </div>
              {criterionLookup["bosco"].map((criterion) => (
                <div
                  key={criterion}
                  className="w-56 text-2xl flex flex-col items-center"
                  style={compare(criterion, abalakov, cmj)}
                >
                  {typeof abalakov[criterion] === "number" &&
                  abalakov[criterion] !== 0
                    ? abalakov[criterion].toFixed(2)
                    : t(abalakov[criterion])}
                  {abalakov[`${criterion}Unit`]
                    ? ` ${abalakov[`${criterion}Unit`]}`
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
      {showChart && (
        <BoscoComparisonChart
          avgHeightReachedA={squatJump.avgHeightReached}
          avgHeightReachedB={cmj.avgHeightReached}
          avgHeightReachedC={abalakov.avgHeightReached}
          avgFlightTimeA={squatJump.avgFlightTime}
          avgFlightTimeB={cmj.avgFlightTime}
          avgFlightTimeC={abalakov.avgFlightTime}
          chartAnimation={chartAnimation}
          onClose={onCloseChart}
          type1="squatJump"
          type2="cmj"
          type3="abalakov"
        />
      )}
    </div>
  );
}

export default CompareThreeStudies;
