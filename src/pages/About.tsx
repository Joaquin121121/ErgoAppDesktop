import React, { useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
function About({
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
  const { resetAthlete } = useStudyContext();

  useEffect(() => {
    resetAthlete();
  }, []);
  return <div></div>;
}

export default About;
