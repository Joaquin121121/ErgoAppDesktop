import React, { useEffect, useState } from "react";
import { useAthleteComparison } from "../contexts/AthleteComparisonContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import { ftToCm } from "../utils/utils";
import { CompletedStudy, boscoTests } from "../types/Studies";

// Define athlete criteria for comparison
const athleteCriteria = ["gender", "age", "weight", "height"];

// Define type for testsInCommon
interface TestsInCommon {
  [testType: string]: [CompletedStudy, CompletedStudy];
}

function CompareTwoAthletes({
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
  const { athleteToCompare1, athleteToCompare2, resetAthletes } =
    useAthleteComparison();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showChart, setShowChart] = useState(false);
  const [testsInCommon, setTestsInCommon] = useState<TestsInCommon>({});

  const onClose = () => {
    customNavigate("back", "compareTwoAthletes", "athletes");
    setTimeout(() => {
      navigate("/athletes");
    }, 300);
  };

  // Calculate age from birthDate
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Compare function for athlete criteria
  const compare = (criterion: string, athlete1: any, athlete2: any) => {
    switch (criterion) {
      case "age":
        const age1 = calculateAge(athlete1.birthDate);
        const age2 = calculateAge(athlete2.birthDate);
        return {
          color: age1 === age2 ? "" : age1 > age2 ? "#e81d23" : "#00A859",
        };
      case "weight":
        const weight1 = parseFloat(athlete1.weight);
        const weight2 = parseFloat(athlete2.weight);
        return {
          color:
            weight1 === weight2
              ? ""
              : weight1 < weight2
              ? "#e81d23"
              : "#00A859",
        };
      case "height":
        const height1 =
          athlete1.heightUnit === "cm"
            ? parseFloat(athlete1.height)
            : ftToCm(athlete1.height);
        const height2 =
          athlete2.heightUnit === "cm"
            ? parseFloat(athlete2.height)
            : ftToCm(athlete2.height);
        return {
          color:
            height1 === height2
              ? ""
              : height1 > height2
              ? "#00A859"
              : "#e81d23",
        };
      case "heightReached":
        const heightReachedDiff = ((athlete1 - athlete2) / athlete2) * 100;
        const absHeightReachedDiff = Math.abs(
          Number(heightReachedDiff.toFixed(2))
        );
        return {
          color:
            heightReachedDiff === 0
              ? ""
              : heightReachedDiff > 0
              ? "#00A859"
              : "#e81d23",
        };
      default:
        return {};
    }
  };

  // Get difference between athlete values
  const getDiff = (criterion: string, athlete1: any, athlete2: any) => {
    switch (criterion) {
      case "weight":
        const weight1 = parseFloat(athlete1.weight);
        const weight2 = parseFloat(athlete2.weight);
        const weightDiff = ((weight2 - weight1) / weight1) * 100;
        // Fix: Convert to number before passing to Math.abs
        const absWeightDiff = Math.abs(Number(weightDiff.toFixed(2)));
        if (absWeightDiff === 0) {
          return {};
        }

        return {
          content: `${absWeightDiff}%`,
          icon: weightDiff > 0 ? "▲" : weightDiff < 0 ? "▼" : "",
          color: weightDiff === 0 ? "" : weightDiff > 0 ? "#00A859" : "#e81d23",
        };
      case "height":
        const height1 =
          athlete1.heightUnit === "cm"
            ? parseFloat(athlete1.height)
            : ftToCm(athlete1.height);
        const height2 =
          athlete2.heightUnit === "cm"
            ? parseFloat(athlete2.height)
            : ftToCm(athlete2.height);
        const heightDiff = ((height2 - height1) / height1) * 100;
        // Fix: Convert to number before passing to Math.abs
        const absHeightDiff = Math.abs(Number(heightDiff.toFixed(2)));
        if (absHeightDiff === 0) {
          return {};
        }

        return {
          content: `${absHeightDiff}%`,
          icon: heightDiff > 0 ? "▲" : heightDiff < 0 ? "▼" : "",
          color: heightDiff === 0 ? "" : heightDiff > 0 ? "#00A859" : "#e81d23",
        };
      case "heightReached":
        const heightReachedDiff = ((athlete2 - athlete1) / athlete1) * 100;
        const absHeightReachedDiff = Math.abs(
          Number(heightReachedDiff.toFixed(2))
        );
        if (absHeightReachedDiff === 0) {
          return {};
        }

        return {
          content: `${absHeightReachedDiff}%`,
          icon: heightReachedDiff > 0 ? "▲" : heightReachedDiff < 0 ? "▼" : "",
          color:
            heightReachedDiff === 0
              ? ""
              : heightReachedDiff > 0
              ? "#00A859"
              : "#e81d23",
        };
      default:
        return {};
    }
  };

  // Get formatted value for display
  const getFormattedValue = (criterion: string, athlete: any) => {
    switch (criterion) {
      case "age":
        return `${calculateAge(athlete.birthDate)} ${t("years")}`;
      case "weight":
        return `${athlete.weight} ${athlete.weightUnit}`;
      case "height":
        return `${athlete.height} ${athlete.heightUnit}`;
      default:
        return (
          t(athlete[criterion]).charAt(0).toUpperCase() +
          t(athlete[criterion]).slice(1)
        );
    }
  };

  const compareTest = (test: string) => {
    customNavigate("forward", "compareTwoAthletes", "compareTwoStudies");
    setTimeout(() => {
      // Format dates properly for URL parameters
      const date1 =
        typeof testsInCommon[test][0].date === "string"
          ? testsInCommon[test][0].date
          : testsInCommon[test][0].date.toISOString();

      const date2 =
        typeof testsInCommon[test][1].date === "string"
          ? testsInCommon[test][1].date
          : testsInCommon[test][1].date.toISOString();

      navigate(
        `/compareTwoStudies?diffAthletes=true&date1=${date1}&date2=${date2}`
      );
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

  useEffect(() => {
    onBlurChange(showChart);
  }, [showChart]);

  useEffect(() => {
    if (athleteToCompare1 && athleteToCompare2) {
      const commonTests = athleteToCompare1.completedStudies.reduce(
        (acc, study1) => {
          const matchingStudy = athleteToCompare2.completedStudies.find(
            (study2) => study2.results.type === study1.results.type
          );

          if (matchingStudy) {
            // Get latest study of same type for athlete 1
            const latestStudy1 = athleteToCompare1.completedStudies
              .filter((s) => s.results.type === study1.results.type)
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0];

            // Get latest study of same type for athlete 2
            const latestStudy2 = athleteToCompare2.completedStudies
              .filter((s) => s.results.type === study1.results.type)
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0];

            acc[study1.results.type] = [latestStudy1, latestStudy2];
          }

          return acc;
        },
        {} as TestsInCommon
      );

      setTestsInCommon(commonTests);
    }
  }, [athleteToCompare1, athleteToCompare2]);

  return (
    <div
      className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out`}
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div
        className={`w-[90%] bg-white shadow-sm pb-8 rounded-2xl mt-2 flex flex-col px-16 transition-all 300 ease-in-out ${animation} ${
          showChart && "blur-md pointer-events-none"
        }`}
      >
        <div
          className="mt-4 -mr-10 self-end my-0 p-1 rounded-full bg-lightRed hover:opacity-70 flex justify-center cursor-pointer"
          onClick={onClose}
        >
          <img src="/close.png" className="h-10 w-10" alt="" />
        </div>
        <p className="text-3xl self-center mb-8 -mt-4">Comparar Atletas</p>

        <div className="flex justify-around pr-24">
          <div className="flex flex-col gap-y-8 ">
            <div className="w-40 h-9"></div>

            {athleteCriteria.map((criterion) => (
              <div key={criterion} className="w-60 text-center text-xl ">
                {t(criterion).charAt(0).toUpperCase() + t(criterion).slice(1)}
              </div>
            ))}
            {Object.keys(testsInCommon).map((test) =>
              test === "bosco" ? (
                <div key={test} className="w-60 text-center text-xl h-[100px] ">
                  Alturas Promedio:{" "}
                  <span className="text-secondary">{t(test)} </span>test
                </div>
              ) : test === "multipleDropJump" ? (
                <div key={test} className="w-60 text-xl text-center">
                  Altura Maxima:{" "}
                  <span className="text-secondary">{t(test)}</span>
                </div>
              ) : (
                <div key={test} className="w-60 text-xl text-center">
                  Altura Promedio:{" "}
                  <div className="block">
                    <span className="text-secondary">{t(test)}</span>{" "}
                    {test !== "multipleJumps" ? "" : "Test"}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="flex flex-col gap-y-8">
            <div className="text-2xl font-normal text-secondary w-64 flex flex-col items-center">
              {athleteToCompare1.name}
            </div>

            {athleteCriteria.map((criterion) => (
              <div
                key={criterion}
                className="w-64 text-xl flex flex-col items-center"
                style={compare(criterion, athleteToCompare1, athleteToCompare2)}
              >
                {getFormattedValue(criterion, athleteToCompare1)}
              </div>
            ))}
            {Object.values(testsInCommon).map(([study1, study2]) =>
              study1.results.type === "bosco" &&
              study2.results.type === "bosco" ? (
                <div className="flex flex-col items-center gap-y-2">
                  <p className="text-xl">
                    <span className="font-medium">Squat Jump:</span>{" "}
                    <span
                      style={compare(
                        "heightReached",
                        study1.results.squatJump.avgHeightReached,
                        study2.results.squatJump.avgHeightReached
                      )}
                    >
                      {study1.results.squatJump.avgHeightReached.toFixed(2)} cm
                    </span>
                  </p>
                  <p className="text-xl">
                    <span className="font-medium">CMJ:</span>{" "}
                    <span
                      style={compare(
                        "heightReached",
                        study1.results.cmj.avgHeightReached,
                        study2.results.cmj.avgHeightReached
                      )}
                    >
                      {study1.results.cmj.avgHeightReached.toFixed(2)} cm
                    </span>
                  </p>
                  <p className="text-xl">
                    <span className="font-medium">Abalakov:</span>{" "}
                    <span
                      style={compare(
                        "heightReached",
                        study1.results.abalakov.avgHeightReached,
                        study2.results.abalakov.avgHeightReached
                      )}
                    >
                      {study1.results.abalakov.avgHeightReached.toFixed(2)} cm
                    </span>
                  </p>
                </div>
              ) : (
                study1.results.type !== "bosco" &&
                study2.results.type !== "bosco" && (
                  <div className="text-xl flex items-center justify-center h-14">
                    <span
                      style={compare(
                        "heightReached",
                        study1.results.type === "multipleDropJump"
                          ? study1.results.maxAvgHeightReached
                          : study1.results.avgHeightReached,
                        study2.results.type === "multipleDropJump"
                          ? study2.results.maxAvgHeightReached
                          : study2.results.avgHeightReached
                      )}
                    >
                      {study1.results.type === "multipleDropJump"
                        ? study1.results.maxAvgHeightReached.toFixed(2)
                        : study1.results.avgHeightReached.toFixed(2)}{" "}
                      cm
                    </span>
                  </div>
                )
              )
            )}
          </div>

          <div className="flex flex-col gap-y-8">
            <div className="h-8"></div>
            {athleteCriteria.map((criterion) => (
              <div
                key={criterion}
                className="text-lg font-light h-7"
                style={{
                  color: getDiff(
                    criterion,
                    athleteToCompare1,
                    athleteToCompare2
                  ).color,
                }}
              >
                {getDiff(criterion, athleteToCompare1, athleteToCompare2).icon}{" "}
                {
                  getDiff(criterion, athleteToCompare1, athleteToCompare2)
                    .content
                }
              </div>
            ))}
            {Object.values(testsInCommon).map(([study1, study2]) =>
              study1.results.type === "bosco" ||
              study2.results.type === "bosco" ? (
                <div className="flex flex-col  gap-y-2">
                  {boscoTests.map((test) => (
                    <div
                      key={test}
                      className="text-lg font-light h-7 overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{
                        color: getDiff(
                          "heightReached",
                          study1.results[test].avgHeightReached,
                          study2.results[test].avgHeightReached
                        ).color,
                      }}
                    >
                      {
                        getDiff(
                          `heightReached`,
                          study1.results[test].avgHeightReached,
                          study2.results[test].avgHeightReached
                        ).icon
                      }{" "}
                      {
                        getDiff(
                          `heightReached`,
                          study1.results[test].avgHeightReached,
                          study2.results[test].avgHeightReached
                        ).content
                      }
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  key={study1.results.type}
                  className="text-lg font-light h-14 flex items-center justify-center"
                  style={{
                    color: getDiff(
                      "heightReached",
                      study1.results.type === "multipleDropJump"
                        ? study1.results.maxAvgHeightReached
                        : study1.results.avgHeightReached,
                      study2.results.type === "multipleDropJump"
                        ? study2.results.maxAvgHeightReached
                        : study2.results.avgHeightReached
                    ).color,
                  }}
                >
                  {
                    getDiff(
                      `heightReached`,
                      study1.results.type === "multipleDropJump"
                        ? study1.results.maxAvgHeightReached
                        : study1.results.avgHeightReached,
                      study2.results.type === "multipleDropJump"
                        ? study2.results.maxAvgHeightReached
                        : study2.results.avgHeightReached
                    ).icon
                  }{" "}
                  {
                    getDiff(
                      `heightReached`,
                      study1.results.type === "multipleDropJump"
                        ? study1.results.maxAvgHeightReached
                        : study1.results.avgHeightReached,
                      study2.results.type === "multipleDropJump"
                        ? study2.results.maxAvgHeightReached
                        : study2.results.avgHeightReached
                    ).content
                  }
                </div>
              )
            )}
          </div>

          <div className="flex flex-col gap-y-8">
            <div className="text-2xl font-normal text-secondary w-64 flex flex-col items-center">
              {athleteToCompare2.name}
            </div>

            {athleteCriteria.map((criterion) => (
              <div
                key={criterion}
                className="w-64 text-xl flex flex-col items-center"
                style={compare(criterion, athleteToCompare2, athleteToCompare1)}
              >
                {getFormattedValue(criterion, athleteToCompare2)}
              </div>
            ))}
            {Object.values(testsInCommon).map(([study1, study2]) =>
              study2.results.type === "bosco" &&
              study1.results.type === "bosco" ? (
                <div className="flex flex-col items-center gap-y-2">
                  <p className="text-xl">
                    <span className="font-medium">Squat Jump:</span>{" "}
                    <span
                      style={compare(
                        "heightReached",
                        study2.results.squatJump.avgHeightReached,
                        study1.results.squatJump.avgHeightReached
                      )}
                    >
                      {study2.results.squatJump.avgHeightReached.toFixed(2)} cm
                    </span>
                  </p>
                  <p className="text-xl">
                    <span className="font-medium">CMJ:</span>{" "}
                    <span
                      style={compare(
                        "heightReached",
                        study2.results.cmj.avgHeightReached,
                        study1.results.cmj.avgHeightReached
                      )}
                    >
                      {study2.results.cmj.avgHeightReached.toFixed(2)} cm
                    </span>
                  </p>
                  <p className="text-xl">
                    <span className="font-medium">Abalakov:</span>{" "}
                    <span
                      style={compare(
                        "heightReached",
                        study2.results.abalakov.avgHeightReached,
                        study1.results.abalakov.avgHeightReached
                      )}
                    >
                      {study2.results.abalakov.avgHeightReached.toFixed(2)} cm
                    </span>
                  </p>
                </div>
              ) : (
                study2.results.type !== "bosco" &&
                study1.results.type !== "bosco" && (
                  <div className="text-xl flex items-center justify-center h-14">
                    <span
                      style={compare(
                        "heightReached",
                        study2.results.type === "multipleDropJump"
                          ? study2.results.maxAvgHeightReached
                          : study2.results.avgHeightReached,
                        study1.results.type === "multipleDropJump"
                          ? study1.results.maxAvgHeightReached
                          : study1.results.avgHeightReached
                      )}
                    >
                      {study2.results.type === "multipleDropJump"
                        ? study2.results.maxAvgHeightReached.toFixed(2)
                        : study2.results.avgHeightReached.toFixed(2)}{" "}
                      cm
                    </span>
                  </div>
                )
              )
            )}
          </div>
          <div className="flex flex-col gap-y-8 ">
            <div className="w-32 h-8"></div>
            {athleteCriteria.map(() => (
              <div className="h-7"></div>
            ))}
            {Object.keys(testsInCommon).map((test) =>
              test === "bosco" ? (
                <div className="h-[100px]" />
              ) : (
                <div
                  className={`${
                    test === "bosco" ? "h-[100px]" : "h-14"
                  } flex items-center justify-center`}
                >
                  <p
                    className="text-secondary text-lg hover:opacity-70 active:opacity-40 cursor-pointer"
                    onClick={() => {
                      compareTest(test);
                    }}
                  >
                    Comparar
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompareTwoAthletes;
