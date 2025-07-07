import { useBlur } from "../contexts/BlurContext";
import React, { useEffect } from "react";
import { useStudyContext } from "../contexts/StudyContext";
import { sub } from "date-fns";
import OptionCard from "../components/OptionCard";
import { useNavigate } from "react-router-dom";
import TonalButton from "../components/TonalButton";
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
  const { isBlurred, setHideNav } = useBlur();
  const { athlete, setAthlete } = useStudyContext();

  const navigate = useNavigate();

  const goTo = (target: string, param?: string) => {
    customNavigate("forward", "athleteMenu", target);
    setTimeout(() => {
      navigate(`/${target}${param ? `?${param}` : ""}`);
    }, 300);
  };

  console.log(athlete);

  const openTrainingMenu = () => {
    setHideNav(true);
    goTo("trainingMenu");
  };

  const option = [
    {
      value: "data",
      title: "Datos del Atleta",
      subtitle: "Visualiza/Modifica los datos del atleta",
      callToAction: "Ver Datos",
      onClick: () => goTo("selectAthlete", "from=athlete"),
      icon: "info",
    },
    {
      value: "studies",
      title: "Estudios",
      subtitle: "Visualiza/Modifica los tests del atleta",
      callToAction: "Ver Tests",
      onClick: () => goTo("athleteStudies"),
      icon: "test",
    },
    {
      value: "wellness",
      title: "Bienestar y Rendimiento",
      subtitle:
        "Visualiza la alimentacion, el sueño, la fatiga y el rendimiento del atleta",
      callToAction: "Ver Bienestar",
      onClick: () => goTo("athleteWellness"),
      icon: "wellness",
    },
    {
      value: "training",
      title: "Entrenamiento",
      subtitle: "Visualiza/Modifica el entrenamiento del atleta",
      callToAction: "Ver Entrenamiento",
      onClick: () => openTrainingMenu(),
      icon: "trainingRed",
    },
  ];

  const onClose = async () => {
    customNavigate("back", "athleteMenu", "athletes");
    setTimeout(() => {
      navigate("/athletes");
    }, 300);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Backspace") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`flex-1 relative flex flex-col items-center ${
        isBlurred && "blur-md pointer-events-none"
      } transition-all duration-300 ease-in-out ${animation}`}
      style={{
        paddingLeft: isExpanded ? "100px" : "32px",
      }}
    >
      <div className="my-10 w-4/5 flex justify-center items-center">
        <div className="w-[122px]" />
        <p className="text-3xl">
          Menu del Atleta:{" "}
          <span className="text-secondary">{athlete.name}</span>
        </p>
        <TonalButton
          inverse
          title="Volver"
          icon="backWhite"
          containerStyles="absolute top-8 right-8"
          onClick={onClose}
        />
      </div>
      <div
        className="self-end w-full flex items-center justify-center gap-x-16 m r-16 transition-all duration-300 ease-in-out pr-8"
        style={{
          paddingLeft: isExpanded ? "160px" : "128px",
        }}
      >
        <OptionCard {...option[0]} />
        <OptionCard {...option[1]} />
      </div>
      <div
        className="self-end w-full flex items-center justify-center gap-x-16 m r-16 transition-all duration-300 ease-in-out pr-8 mt-16"
        style={{
          paddingLeft: isExpanded ? "160px" : "128px",
        }}
      >
        <OptionCard {...option[2]} />
        <OptionCard {...option[3]} />
      </div>
    </div>
  );
}

export default AthleteMenu;
