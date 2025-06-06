import React, { useState } from "react";
import { useNewPlan } from "../contexts/NewPlanContext";
import inputStyles from "../styles/inputStyles.module.css";
import TonalButton from "./TonalButton";
import { Session } from "../types/trainingPlan";
import OutlinedButton from "./OutlinedButton";
import navAnimations from "../styles/animations.module.css";

const dayNames = [
  { name: "Lunes", value: "monday" },
  { name: "Martes", value: "tuesday" },
  { name: "Miércoles", value: "wednesday" },
  { name: "Jueves", value: "thursday" },
  { name: "Viernes", value: "friday" },
  { name: "Sábado", value: "saturday" },
  { name: "Domingo", value: "sunday" },
];

function SessionInfoStage({
  animation,
  onNext,
  isModel = false,
}: {
  animation: string;
  onNext: () => void;
  isModel?: boolean;
}) {
  const {
    planState,
    model,
    addSession,
    updateSession,
    saveNewTrainingModel,
    saveNewTrainingPlan,
  } = useNewPlan();
  const currentPlan = isModel ? model : planState;
  const [localAnimation, setLocalAnimation] = useState(animation);
  const [sessionN, setSessionN] = useState(0);

  const [formState, setFormState] = useState({
    name: { value: "Sesion 1", error: "" },
    days: { value: [], error: "" },
  });
  const [validationAttempted, setValidationAttempted] = useState(false);
  const { isNewModel, isNewTrainingPlan } = useNewPlan();

  const handleDayClick = (dayValue: string) => {
    setFormState((prevState) => {
      const currentDays = prevState.days.value;
      const newDays = currentDays.includes(dayValue)
        ? currentDays.filter((d) => d !== dayValue)
        : [...currentDays, dayValue];
      return {
        ...prevState,
        days: { value: newDays, error: "" }, // Clear error on selection change if needed
      };
    });
  };

  const previousSession = () => {
    const newSession: Omit<Session, "id" | "planId"> = {
      name: formState.name.value,
      days: formState.days.value,
      exercises: [],
    };

    if (currentPlan.sessions[sessionN]) {
      console.log("Updating session");
      updateSession(sessionN, newSession, isModel);
    } else {
      addSession(newSession, isModel);
    }
    setLocalAnimation(navAnimations.fadeOutRight);
    setTimeout(() => {
      const newSessionN = sessionN - 1;
      const relevantSession = currentPlan.sessions[newSessionN];

      setFormState({
        name: { value: relevantSession.name, error: "" },
        days: { value: relevantSession.days, error: "" },
      });
      setSessionN(newSessionN);
      setLocalAnimation(navAnimations.fadeInLeft);
    }, 200);
  };

  const nextSession = async () => {
    setValidationAttempted(true);
    if (formState.name.value.length === 0) {
      setFormState((prevState) => ({
        ...prevState,
        name: { value: "", error: "El nombre es requerido" },
      }));
      return;
    }
    if (formState.days.value.length === 0) {
      setFormState((prevState) => ({
        ...prevState,
        days: { value: [], error: "Debe seleccionar al menos un dia" },
      }));
      return;
    }
    const newSession: Omit<Session, "id" | "planId"> = {
      name: formState.name.value,
      days: formState.days.value,
      exercises: [],
    };

    let updatedPlan;
    if (currentPlan.sessions[sessionN]) {
      console.log("Updating session");
      updatedPlan = await updateSession(sessionN, newSession, isModel);
    } else {
      console.log("Adding session");
      updatedPlan = await addSession(newSession, isModel);
    }

    if (sessionN === currentPlan.nOfSessions - 1) {
      setLocalAnimation(navAnimations.fadeOutLeft);
      if (isNewModel) {
        await saveNewTrainingModel(updatedPlan);
      }
      if (isNewTrainingPlan) {
        await saveNewTrainingPlan(updatedPlan);
      }
      onNext();
      return;
    }
    if (currentPlan.sessions[sessionN + 1]) {
      setFormState({
        name: { value: currentPlan.sessions[sessionN + 1].name, error: "" },
        days: { value: currentPlan.sessions[sessionN + 1].days, error: "" },
      });
    } else {
      setFormState({
        name: { value: "Sesion " + (sessionN + 2), error: "" },
        days: { value: [], error: "" },
      });
    }
    setLocalAnimation(navAnimations.fadeOutLeft);
    setTimeout(() => {
      setSessionN(sessionN + 1);
      setLocalAnimation(navAnimations.fadeInRight);
    }, 200);
  };

  return (
    <div className={`flex flex-col items-center ${localAnimation}`}>
      <div className="flex mt-8 mb-4 items-center justify-center gap-x-4">
        <p className="text-3xl text-secondary">Sesion {sessionN + 1}</p>
        <img src="/trainingRed.png" className="h-8 w-8" alt="" />
      </div>
      <p className="text-darkGray text-lg px-36">
        Los planes estan compuestos por una o mas sesiones que se pueden repetir
        ciertos dias. Por ejemplo: Sesion de Tracción a ser realizada los lunes,
        miercoles y viernes
      </p>
      <div className="flex flex-col pl-20 w-full mt-8">
        <p className=" text-lg mb-2">Nombre de la Sesión</p>
        <input
          type="text"
          className={`${
            inputStyles.input
          } bg-offWhite rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
            validationAttempted && formState.name.error
              ? inputStyles.focused
              : ""
          } `}
          value={formState.name.value}
          onChange={(e) => {
            setFormState({
              ...formState,
              name: { value: e.target.value, error: "" },
            });
          }}
        />

        <p className=" text-lg mb-2 mt-4">Días de la semana</p>
        <div className="flex gap-x-4 mt-2">
          {dayNames.map((day) => (
            <button
              key={day.value}
              className={`rounded-2xl px-4 py-1 flex items-center justify-center font-light text-darkGray border border-secondary transition-colors duration-200 hover:bg-lightRed hover:text-secondary focus:outline-none ${
                formState.days.value.includes(day.value)
                  ? "bg-lightRed text-secondary"
                  : "bg-offWhite"
              }
              ${
                currentPlan.sessions
                  .filter((_, i) => i !== sessionN)
                  .some((e) => e.days.includes(day.value)) &&
                "opacity-40 cursor-not-allowed"
              }
              `}
              onClick={() => handleDayClick(day.value)}
              disabled={currentPlan.sessions
                .filter((_, i) => i !== sessionN)
                .some((e) => e.days.includes(day.value))}
            >
              {day.name}
            </button>
          ))}
          {validationAttempted && formState.days.error && (
            <p className="text-red-500 text-sm mt-1">{formState.days.error}</p>
          )}
        </div>
        <div className="w-2/3 self-center flex justify-around items-center mt-20 mb-10">
          {sessionN > 0 && (
            <OutlinedButton
              inverse
              title="Sesion Anterior"
              icon="back"
              onClick={previousSession}
            />
          )}
          {sessionN < currentPlan.nOfSessions && (
            <TonalButton
              title={
                sessionN === currentPlan.nOfSessions - 1
                  ? "Guardar Sesiones"
                  : "Siguiente Sesión"
              }
              icon="next"
              onClick={nextSession}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionInfoStage;
