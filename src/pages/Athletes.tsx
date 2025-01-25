import React, { useState, useRef, useEffect } from "react";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import inputStyles from "../styles/inputStyles.module.css";
import { Athlete, isAthlete, transformToAthlete } from "../types/Athletes";
import { useJsonFiles } from "../hooks/useJsonFiles";
import AthleteCard from "../components/AthleteCard";
import { useStudyContext } from "../contexts/StudyContext";
import { naturalToCamelCase } from "../utils/utils";
import { useNavigate } from "react-router-dom";

function Athletes({
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
  const [isBlurred, setIsBlurred] = useState(false);
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  const user = {
    fullName: "Joaquin Berrini",
    email: "",
  };

  const [loadedAthletes, setLoadedAthletes] = useState<[string, Athlete][]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<[string, Athlete][]>(
    []
  );
  const [athleteToDelete, setAthleteToDelete] = useState("");

  const { readDirectoryJsons, deleteJson } = useJsonFiles();

  const { resetAthlete, setAthlete } = useStudyContext();

  const filterButtonRef = useRef(null);

  const loadAthletes = async () => {
    try {
      const result = await readDirectoryJsons("athletes");
      const parsedAthletes = result.files
        .map((item) => transformToAthlete(item.content))
        .filter((athlete) => athlete !== null);
      const formattedAthletes: [string, any][] = parsedAthletes.map(
        (athlete) => {
          return [athlete.name, athlete];
        }
      );
      setLoadedAthletes(formattedAthletes);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFilter = () => {};

  const createAthlete = () => {
    customNavigate("forward", "athletes", "newAthlete");
    setTimeout(() => {
      navigate("/newAthlete?from=athletes");
    }, 300);
  };

  const onClick = (key: string) => {
    const athlete = loadedAthletes.find((athlete) => athlete[0] === key);
    if (athlete) {
      setAthlete(athlete[1]);
      customNavigate("forward", "athletes", "athleteStudies");
      setTimeout(() => {
        navigate("/athleteStudies");
      }, 300);
    }
  };

  const onDelete = async () => {
    try {
      const result = await deleteJson(
        naturalToCamelCase(athleteToDelete) + ".json",
        "athletes"
      );
      console.log(result);
      setLoadedAthletes(
        loadedAthletes.filter((e) => e[1].name !== athleteToDelete)
      );
      setAthleteToDelete("");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadAthletes();
    resetAthlete();
  }, []);

  useEffect(() => {
    setFilteredAthletes(
      loadedAthletes.filter(([_, athlete]) =>
        athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [loadedAthletes, searchTerm]);

  useEffect(() => {
    if (athleteToDelete.length) {
      onBlurChange(true);
      return;
    }
    onBlurChange(false);
  }, [athleteToDelete.length]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center ${
          (isBlurred || athleteToDelete.length) && "blur-md pointer-events-none"
        } transition-all duration-300 ease-in-out ${animation}`}
        style={{ paddingLeft: isExpanded ? "100px" : "32px" }}
      >
        {/* <div className="absolute w-16 h-16 top-8 right-8 bg-gray rounded-full"></div> */}
        <div className="flex mt-12">
          <h1 className="pt-2">
            Bienvenido,{" "}
            {user.fullName.split(" ")[0].charAt(0).toUpperCase() +
              user.fullName.split(" ")[0].slice(1)}
          </h1>
          <img src="/hand.png" className="h-16 w-16 ml-12" />
        </div>
        <div className="self-end w-3/4 flex items-center">
          <div
            className={`w-3/5 h-16 rounded-2xl bg-white shadow-sm flex items-center mt-12 px-4 mb-12 ${
              searchBarFocus && inputStyles.focused
            }`}
          >
            <img src="/search.png" alt="Buscar" className="h-8 w-8 mr-8" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-full focus:outline-none text-lg bg-white text-darkGray"
              onFocus={() => setSearchBarFocus(true)}
              onBlur={() => setSearchBarFocus(false)}
              placeholder="Buscar atleta..."
            />
          </div>
          <OutlinedButton
            title="Filtrar"
            onClick={handleFilter}
            containerStyles="ml-8"
            icon="filter"
            ref={filterButtonRef}
          />
          <TonalButton
            title="Nuevo Atleta"
            onClick={createAthlete}
            containerStyles="ml-8"
            icon="add"
          />
        </div>
        <div className="grid grid-cols-3 gap-x-[5%] gap-y-16 w-full  px-36">
          {filteredAthletes.map(([key, athlete]) => (
            <AthleteCard
              key={key}
              athlete={athlete}
              onClick={() => {
                onClick(key);
              }}
              onDelete={(name) => setAthleteToDelete(name)}
            />
          ))}
        </div>
        {!loadedAthletes.length && (
          <>
            <p className=" text-xl mt-16">No hay atletas cargados</p>
            <TonalButton
              containerStyles=" mt-8"
              title="Nuevo Atleta"
              icon="add"
              onClick={createAthlete}
            />
          </>
        )}
      </div>

      {athleteToDelete.length && (
        <div
          className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 px-8 w-[500px]
             top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        >
          <p className="text-darkGray text-lg my-8">
            Está seguro que desea eliminar a{" "}
            <span className="text-black">{athleteToDelete}</span>?
          </p>
          <div className="flex justify-around w-full mb-8">
            <OutlinedButton
              icon="back"
              onClick={() => {
                setAthleteToDelete("");
              }}
              title="Volver"
              containerStyles="w-[35%]"
              inverse
            />
            <TonalButton
              icon="check"
              onClick={onDelete}
              title="Eliminar"
              containerStyles="w-[35%]"
            />
          </div>
        </div>
      )}
    </>
  );
}
export default Athletes;
