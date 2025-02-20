import React from "react";
import { useAthleteComparison } from "../contexts/AthleteComparisonContext";

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

  const onClose = () => {
    resetAthletes();
    customNavigate("back", "compareTwoAthletes", "athletes");
    setTimeout(() => {
      customNavigate("forward", "athletes", "compareTwoAthletes");
    }, 300);
  };

  return <div>CompareTwoAthletes</div>;
}

export default CompareTwoAthletes;
