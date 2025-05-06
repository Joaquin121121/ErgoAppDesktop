import React, { useEffect } from "react";
import { useState } from "react";
import navAnimations from "../styles/animations.module.css";
import inputStyles from "../styles/inputStyles.module.css";
import { Exercise } from "../types/trainingPlan";
import ExerciseCard from "./ExerciseCard";
import OutlinedButton from "./OutlinedButton";

function NewExercisePopup({
  onClose,
  type = "exercise",
}: {
  onClose: () => void;
  type: string;
}) {
  const [animation, setAnimation] = useState(navAnimations.popupFadeInTop);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBarFocus, setSearchBarFocus] = useState(false);

  const exercises = [
    {
      id: "e1b9d5a0-2c3d-4e5f-6g7h-8i9j0k1l2m3n",
      name: "Press de Banca",
      videoRef: null,
    },
    {
      id: "a2b3c4d5-6e7f-8g9h-0i1j-2k3l4m5n6o7",
      name: "Sentadillas",
      videoRef: null,
    },
    {
      id: "p8q9r0s1-2t3u-4v5w-6x7y-8z9a0b1c2d3",
      name: "Peso Muerto",
      videoRef: null,
    },
    {
      id: "d4e5f6g7-8h9i-0j1k-2l3m-4n5o6p7q8r9",
      name: "Dominadas",
      videoRef: null,
    },
    {
      id: "s0t1u2v3-4w5x-6y7z-8a9b-0c1d2e3f4g5",
      name: "Fondos",
      videoRef: null,
    },
  ];

  const [filteredExercises, setFilteredExercises] = useState(exercises);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const localOnClose = () => {
    setAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const onSelectExercise = (exercise: Exercise) => {
    if (selectedExercises.includes(exercise)) {
      setSelectedExercises(selectedExercises.filter((e) => e !== exercise));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
    if (type === "exercise") {
      localOnClose();
    }
  };

  const continueExerciseBlock = () => {
    console.log(selectedExercises);
  };

  useEffect(() => {
    setFilteredExercises(
      exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  return (
    <div
      className={`bg-white  absolute shadow-sm rounded-2xl left-[30%] top-2  flex flex-col items-center  h-auto z-50 ${animation} `}
    >
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={localOnClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>
      <p className="text-secondary text-2xl mt-8">
        Añadir {type === "exercise" ? "Ejercicio" : "Bloque de Ejercicios"}
      </p>
      <p className="text-darkGray text-lg mt-4 mb-8">
        Haga click en un ejercicio para seleccionarlo
      </p>
      <div
        className={`h-10 w-1/2 relative rounded-2xl bg-offWhite shadow-sm flex items-center px-4 ${
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
        <div className="grid grid-cols-2 py-4 gap-x-[5%] gap-y-52 w-[40vw] mt-4  px-12 overflow-y-scroll max-h-[60vh]  flex-grow items-start ">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              exercise={exercise}
              onSelectExercise={onSelectExercise}
              selected={selectedExercises.includes(exercise)}
            />
          ))}
        </div>
        {type === "exerciseBlock" && (
          <div className="flex flex-col items-center w-80">
            <p className="text-secondary text-xl mt-12">
              Ejercicios Seleccionados
            </p>
            <div className="flex flex-col w-80 px-10 max-h-[40vh] overflow-y-scroll">
              {selectedExercises.map((exercise) => (
                <div className="mt-4 flex items-center gap-x-2">
                  <p className="text-lg ">{exercise.name}</p>
                  <img
                    src="/close.png"
                    className="h-6 w-6 hover:opacity-70 cursor-pointer active:opacity-40"
                    onClick={() =>
                      setSelectedExercises(
                        selectedExercises.filter((e) => e !== exercise)
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <OutlinedButton
              title="Continuar"
              icon="next"
              onClick={continueExerciseBlock}
              containerStyles="mt-8 self-center"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default NewExercisePopup;
