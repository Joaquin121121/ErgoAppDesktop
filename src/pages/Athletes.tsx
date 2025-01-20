import React, { useState, useRef, useEffect } from "react";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import inputStyles from "../styles/inputStyles.module.css";
import { Athlete, isAthlete, transformToAthlete } from "../types/Athletes";
import { useJsonFiles } from "../hooks/useJsonFiles";
import AthleteCard from "../components/AthleteCard";
import { set } from "react-hook-form";

function Athletes({
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
  const [isBlurred, setIsBlurred] = useState(false);
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const user = {
    fullName: "Joaquin Berrini",
    email: "",
  };

  const [loadedAthletes, setLoadedAthletes] = useState<[string, Athlete][]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<[string, Athlete][]>(
    []
  );

  const { readDirectoryJsons, deleteJson } = useJsonFiles();

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

  const createAthlete = () => {};

  const onClick = (key: string) => {};

  const setAthleteToDelete = (name: string) => {};

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    setFilteredAthletes(
      loadedAthletes.filter(([_, athlete]) =>
        athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [loadedAthletes, searchTerm]);

  return (
    <div
      className={`flex-1 relative flex flex-col items-center ${
        isBlurred && "blur-md pointer-events-none"
      } transition-all duration-300 ease-in-out ${animation}`}
      style={{ paddingLeft: isExpanded ? "100px" : "32px" }}
    >
      <div className="absolute w-16 h-16 top-8 right-8 bg-gray rounded-full"></div>
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
    </div>
  );
}
export default Athletes;
