import React, { useEffect, useState } from "react";
import { useAthleteComparison } from "../../contexts/AthleteComparisonContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OutlinedButton from "../../components/OutlinedButton";
import TonalButton from "../../components/TonalButton";
import { ftToCm } from "../../utils/utils";
import {
  CompletedStudy,
  boscoTests,
  BoscoResult,
  MultipleDropJumpResult,
} from "../../types/Studies";

// Define athlete criteria for comparison
const athleteCriteria = ["gender", "age", "weight", "height"];

// Define type for testsInCommon
interface TestsInCommon {
  [testType: string]: [CompletedStudy, CompletedStudy];
}

// Type guard functions to help TypeScript narrow types
function isBoscoResult(result: any): result is BoscoResult {
  return result?.type === "bosco";
}

function isMultipleDropJumpResult(
  result: any
): result is MultipleDropJumpResult {
  return result?.type === "multipleDropJump";
}

function hasAvgHeightReached(result: any): boolean {
  return "avgHeightReached" in result;
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
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[20%]" /> {/* Labels column */}
              <col className="w-[25%]" /> {/* Athlete 1 column */}
              <col className="w-[10%]" /> {/* Difference column */}
              <col className="w-[25%]" /> {/* Athlete 2 column */}
              <col className="w-[20%]" /> {/* Compare button column */}
            </colgroup>
            <thead>
              <tr>
                <th className="h-9 px-4"></th>
                <th className="text-2xl font-normal text-secondary text-center px-4">
                  {athleteToCompare1.name}
                </th>
                <th className="h-8"></th>
                <th className="text-2xl font-normal text-secondary text-center px-4">
                  {athleteToCompare2.name}
                </th>
                <th className="h-8"></th>
              </tr>
            </thead>
            <tbody>
              {/* Athlete criteria rows */}
              {athleteCriteria.map((criterion) => (
                <tr key={criterion} className="h-8 my-8">
                  <td className="text-center text-xl py-4 px-4">
                    {t(criterion).charAt(0).toUpperCase() +
                      t(criterion).slice(1)}
                  </td>
                  <td
                    className="text-xl text-center py-4 px-4"
                    style={compare(
                      criterion,
                      athleteToCompare1,
                      athleteToCompare2
                    )}
                  >
                    {getFormattedValue(criterion, athleteToCompare1)}
                  </td>
                  <td
                    className="text-lg font-light py-4 text-center"
                    style={{
                      color: getDiff(
                        criterion,
                        athleteToCompare1,
                        athleteToCompare2
                      ).color,
                    }}
                  >
                    {
                      getDiff(criterion, athleteToCompare1, athleteToCompare2)
                        .icon
                    }{" "}
                    {
                      getDiff(criterion, athleteToCompare1, athleteToCompare2)
                        .content
                    }
                  </td>
                  <td
                    className="text-xl text-center py-4 px-4"
                    style={compare(
                      criterion,
                      athleteToCompare2,
                      athleteToCompare1
                    )}
                  >
                    {getFormattedValue(criterion, athleteToCompare2)}
                  </td>
                  <td className="py-4 px-4"></td>
                </tr>
              ))}

              {/* Tests rows */}
              {Object.entries(testsInCommon)
                // Sort entries to push bosco tests to the end
                .sort(([testTypeA], [testTypeB]) => {
                  if (testTypeA === "bosco") return 1;
                  if (testTypeB === "bosco") return -1;
                  return 0;
                })
                .map(([test, studies]) => {
                  const [study1, study2] = studies;

                  if (
                    test === "bosco" &&
                    isBoscoResult(study1.results) &&
                    isBoscoResult(study2.results)
                  ) {
                    return (
                      <React.Fragment key={`${test}-section`}>
                        {/* Add empty row for spacing */}
                        <tr>
                          <td colSpan={5} className="py-4"></td>
                        </tr>

                        {/* Bosco test container - using a wrapper with colSpan to create a container */}
                        <tr>
                          <td colSpan={5} className="px-0 py-0">
                            <div className="border border-offWhite rounded-2xl overflow-hidden mb-4">
                              <table className="w-full">
                                {/* Bosco test header row */}
                                <tr className="bg-gray-50">
                                  <td
                                    className="text-center text-xl py-3 px-4"
                                    colSpan={5}
                                  >
                                    <span className="text-secondary font-medium">
                                      {t(test)}
                                    </span>{" "}
                                    Test - Alturas Promedio
                                  </td>
                                </tr>

                                {/* Bosco test data rows */}
                                {boscoTests.map((boscoTest, index) => (
                                  <tr
                                    key={`${test}-${boscoTest}`}
                                    className={`${
                                      index === boscoTests.length - 1
                                        ? ""
                                        : "border-b border-offWhite"
                                    }`}
                                  >
                                    <td className="text-center text-xl py-2 px-4 w-[20%]">
                                      <span className="font-medium">
                                        {t(boscoTest)}
                                      </span>
                                    </td>
                                    <td className="text-xl text-center py-2 px-4 w-[25%]">
                                      <span
                                        style={compare(
                                          "heightReached",
                                          study1.results[boscoTest]
                                            .avgHeightReached,
                                          study2.results[boscoTest]
                                            .avgHeightReached
                                        )}
                                      >
                                        {study1.results[
                                          boscoTest
                                        ].avgHeightReached.toFixed(2)}{" "}
                                        cm
                                      </span>
                                    </td>
                                    <td
                                      className="text-lg font-light text-center py-2 w-[10%]"
                                      style={{
                                        color: getDiff(
                                          "heightReached",
                                          study1.results[boscoTest]
                                            .avgHeightReached,
                                          study2.results[boscoTest]
                                            .avgHeightReached
                                        ).color,
                                      }}
                                    >
                                      {
                                        getDiff(
                                          `heightReached`,
                                          study1.results[boscoTest]
                                            .avgHeightReached,
                                          study2.results[boscoTest]
                                            .avgHeightReached
                                        ).icon
                                      }{" "}
                                      {
                                        getDiff(
                                          `heightReached`,
                                          study1.results[boscoTest]
                                            .avgHeightReached,
                                          study2.results[boscoTest]
                                            .avgHeightReached
                                        ).content
                                      }
                                    </td>
                                    <td className="text-xl text-center py-2 px-4 w-[25%]">
                                      <span
                                        style={compare(
                                          "heightReached",
                                          study2.results[boscoTest]
                                            .avgHeightReached,
                                          study1.results[boscoTest]
                                            .avgHeightReached
                                        )}
                                      >
                                        {study2.results[
                                          boscoTest
                                        ].avgHeightReached.toFixed(2)}{" "}
                                        cm
                                      </span>
                                    </td>
                                    <td className="text-center py-2 px-4 w-[20%]"></td>
                                  </tr>
                                ))}
                              </table>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  } else {
                    // Get height values based on study type
                    const getHeightValue = (studyResult: any) => {
                      if (isMultipleDropJumpResult(studyResult)) {
                        return studyResult.maxAvgHeightReached;
                      } else if (hasAvgHeightReached(studyResult)) {
                        return studyResult.avgHeightReached;
                      }
                      return 0;
                    };

                    const height1 = getHeightValue(study1.results);
                    const height2 = getHeightValue(study2.results);

                    return (
                      <tr key={test}>
                        <td className="text-xl text-center py-4 px-4">
                          {test === "multipleDropJump" ? (
                            <>
                              Altura Maxima:{" "}
                              <span className="text-secondary">{t(test)}</span>
                            </>
                          ) : (
                            <>
                              Altura Promedio:{" "}
                              <div className="block">
                                <span className="text-secondary">
                                  {t(test)}
                                </span>{" "}
                                {test !== "multipleJumps" ? "" : "Test"}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="text-xl text-center py-4 h-14 px-4">
                          <span
                            style={compare("heightReached", height1, height2)}
                          >
                            {height1.toFixed(2)} cm
                          </span>
                        </td>
                        <td
                          className="text-lg font-light text-center py-4 h-14"
                          style={{
                            color: getDiff("heightReached", height1, height2)
                              .color,
                          }}
                        >
                          {getDiff(`heightReached`, height1, height2).icon}{" "}
                          {getDiff(`heightReached`, height1, height2).content}
                        </td>
                        <td className="text-xl text-center py-4 h-14 px-4">
                          <span
                            style={compare("heightReached", height2, height1)}
                          >
                            {height2.toFixed(2)} cm
                          </span>
                        </td>
                        <td className="text-center py-4 h-14 px-4">
                          <p
                            className="text-secondary text-lg hover:opacity-70 active:opacity-40 cursor-pointer"
                            onClick={() => {
                              compareTest(test);
                            }}
                          >
                            Comparar
                          </p>
                        </td>
                      </tr>
                    );
                  }
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CompareTwoAthletes;
