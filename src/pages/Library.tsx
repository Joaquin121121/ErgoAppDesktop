import TonalButton from "../components/TonalButton";
import OptionCard from "../components/OptionCard";
import { useBlur } from "../contexts/BlurContext";
import React from "react";
import { useNavigate } from "react-router-dom";

const Library = ({
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
}) => {
  const { isBlurred } = useBlur();
  const navigate = useNavigate();

  const goToModelLibrary = () => {
    customNavigate("forward", "library", "trainingModelLibrary");
    setTimeout(() => {
      navigate("/trainingModelLibrary");
    }, 300);
  };
  const goToContentLibrary = () => {
    customNavigate("forward", "library", "contentLibrary");
    setTimeout(() => {
      navigate("/contentLibrary");
    }, 300);
  };
  return (
    <div
      className={`flex-1 relative flex flex-col items-center ${
        isBlurred && "blur-md pointer-events-none"
      } transition-all duration-300 ease-in-out ${animation}`}
      style={{
        paddingLeft: isExpanded ? "100px" : "32px",
      }}
    >
      <div className="flex mt-12 mb-16">
        <h1 className="pt-4">Biblioteca de Contenido</h1>
        <img src="/folder.svg " className="h-20 w-20 ml-12" />
      </div>
      <OptionCard
        value="library"
        title="Biblioteca de Ejercicios"
        subtitle="Crea y almacena ejercicios para usar en tus planes de entrenamiento"
        icon="libraryRed"
        callToAction="Ver Ejercicios"
        onClick={goToContentLibrary}
      />
      <OptionCard
        value="library"
        title="Modelos de Planes de Entrenamiento"
        subtitle="Crea y almacena modelos para usar como base para crear planes de entrenamiento personalizados"
        icon="trainingRed"
        className="mt-12"
        callToAction="Ver Modelos"
        onClick={goToModelLibrary}
      />
    </div>
  );
};

export default Library;
