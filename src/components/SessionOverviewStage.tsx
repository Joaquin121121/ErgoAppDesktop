import React, { useEffect, useState } from "react";
import { useNewPlan } from "../contexts/NewPlanContext";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";
function SessionOverviewStage({
  animation,
  showPopup,
}: {
  animation: string;
  showPopup: (type: "exercise" | "exerciseBlock") => void;
}) {
  const { planState } = useNewPlan();
  const [localAnimation, setLocalAnimation] = useState(animation);

  const [sessionN, setSessionN] = useState(0);

  const addExercise = () => {
    showPopup("exercise");
  };

  const addExerciseBlock = () => {
    showPopup("exerciseBlock");
  };
  return (
    <div className={`flex flex-col items-center ${animation}`}>
      <p className="text-secondary text-3xl mt-8 self-center">
        Sesion {sessionN + 1}
      </p>
      <div className="w-full flex mt-10 justify-around items-center">
        <p className="text-darkGray text-xl">Ejercicio</p>
        <p className="text-darkGray text-xl">Sets</p>
        <p className="text-darkGray text-xl">Reps</p>
        <p className="text-darkGray text-xl">RIR</p>
        <p className="text-darkGray text-xl">Intensidad</p>
        <p className="text-darkGray text-xl">Descanso</p>
      </div>
      <OutlinedButton
        title="Añadir Ejercicio"
        icon="addRed"
        onClick={addExercise}
        containerStyles="mt-16 self-center"
      ></OutlinedButton>
      <TonalButton
        title="Añadir Bloque"
        icon="add"
        onClick={addExerciseBlock}
        containerStyles="mt-4 mb-8 self-center"
      ></TonalButton>
      <div className="self-start flex border-t border-r border-secondary rounded-tr-2xl overflow-hidden mt-12">
        {planState.sessions.map((session, index) => {
          return (
            <button
              className={` py-2 px-4  ${
                index !== planState.sessions.length - 1 && "border-r-secondary"
              } hover:opacity-70 hover:cursor-pointer active:opacity-40 focus:outline-none rounded-none`}
              style={{
                backgroundColor: sessionN === index && "#FFC1C1",
                color: sessionN === index && "#e81d23",
              }}
              onClick={() => setSessionN(index)}
            >
              {session.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SessionOverviewStage;
