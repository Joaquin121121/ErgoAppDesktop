import React, { useEffect, useState } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import { Exercise } from "../types/trainingPlan";
import ExerciseCard from "./ExerciseCard";
import TonalButton from "./TonalButton";

interface SelectExercisesProps {
  animation: string;
  exercises: Exercise[];
  selectedExercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
  type: string;
  onContinue?: () => void;
}

function SelectExercises({
  animation,
  exercises,
  selectedExercises,
  onSelectExercise,
  type,
  onContinue,
}: SelectExercisesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [filteredExercises, setFilteredExercises] = useState(exercises);

  useEffect(() => {
    setFilteredExercises(
      exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, exercises]);

  return (
    <div className={` flex flex-col items-center py-8 ${animation}`}>
      <p className="text-secondary text-2xl">
        Añadir {type === "exercise" ? "Ejercicio" : "Bloque de Ejercicios"}
      </p>
      <p className="text-darkGray text-lg mt-4 mb-8">
        Haga click en un ejercicio para seleccionarlo
      </p>
      <div
        className={`h-10 w-3/4 relative rounded-2xl bg-offWhite shadow-sm flex items-center px-4 ${
          searchBarFocus && inputStyles.focused
        }`}
      >
        <img src="/search.png" className="h-6 w-6 mr-2" alt="Search" />

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow h-full focus:outline-none bg-offWhite "
          onFocus={() => setSearchBarFocus(true)}
          onBlur={() => setSearchBarFocus(false)}
          placeholder="Buscar ejercicio..."
        />
        {searchTerm && (
          <img
            src="/close.png"
            className="h-5 w-5 hover:opacity-70 cursor-pointer active:opacity-40"
            onClick={() => setSearchTerm("")}
            alt="Clear"
          />
        )}
      </div>
      <div className="flex gap-x-8">
        <div className="grid grid-cols-2 py-4 gap-x-[5%] gap-y-64 w-[40vw] mt-4 px-12 max-h-[600px] flex-grow items-start">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSelectExercise={onSelectExercise}
              selected={selectedExercises.some((e) => e.id === exercise.id)}
            />
          ))}
        </div>
        {type === "exerciseBlock" && (
          <div className="flex flex-col items-center w-80">
            <p className="text-secondary text-xl mt-12 ">
              Ejercicios Seleccionados
            </p>
            <div className="flex flex-col w-80 px-10 h-[400px] overflow-y-scroll">
              {selectedExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="mt-4 flex items-center gap-x-4 "
                >
                  <p className="text-lg ">{exercise.name}</p>
                  <img
                    src="/close.png"
                    className="h-5 w-5 hover:opacity-70 cursor-pointer active:opacity-40"
                    onClick={() => onSelectExercise(exercise)}
                  />
                </div>
              ))}
            </div>
            {onContinue && (
              <TonalButton
                title="Continuar"
                icon="next"
                onClick={onContinue}
                containerStyles="mt-8 self-center"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectExercises;
