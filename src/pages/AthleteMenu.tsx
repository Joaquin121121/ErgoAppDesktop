import { useBlur } from "../contexts/BlurContext";
import React from "react";
import { useStudyContext } from "../contexts/StudyContext";
import { sub } from "date-fns";
import OptionCard from "../components/OptionCard";
import { useNavigate } from "react-router-dom";
function AthleteMenu({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: any;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const { isBlurred } = useBlur();
  const { athlete, setAthlete } = useStudyContext();

  const navigate = useNavigate();

  const goTo = (target: string, param?: string) => {
    customNavigate("forward", "athleteMenu", target);
    setTimeout(() => {
      navigate(`/${target}${param ? `?${param}` : ""}`);
    }, 300);
  };

  const option = [
    {
      value: "data",
      title: "Datos del Atleta",
      subtitle: "Visualiza/Modifica los datos del atleta",
      callToAction: "Ver Datos",
      onClick: () => goTo("selectAthlete", "from=athlete"),
    },
    {
      value: "studies",
      title: "Estudios",
      subtitle: "Visualiza/Modifica los tests del atleta",
      callToAction: "Ver Tests",
      onClick: () => goTo("athleteStudies"),
    },
    {
      value: "training",
      title: "Entrenamiento",
      subtitle: "Visualiza/Modifica el entrenamiento del atleta",
      callToAction: "Ver Entrenamiento",
      onClick: () => goTo("trainingMenu"),
    },
  ];

  return (
    <div
      className={`flex-1 relative flex flex-col items-center ${
        isBlurred && "blur-md pointer-events-none"
      } transition-all duration-300 ease-in-out ${animation}`}
      style={{
        paddingLeft: isExpanded ? "100px" : "32px",
      }}
    >
      <p className="text-3xl my-10">{athlete.name}</p>
      <div
        className="self-end w-full flex items-center justify-center gap-x-16 m r-16 transition-all duration-300 ease-in-out pr-8"
        style={{
          paddingLeft: isExpanded ? "160px" : "128px",
        }}
      >
        <OptionCard {...option[0]} />
        <OptionCard {...option[1]} />
      </div>
      <OptionCard {...option[2]} className="mt-8" />
    </div>
  );
}

export default AthleteMenu;
