import React, { useState, useRef, useEffect } from "react";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import inputStyles from "../styles/inputStyles.module.css";
import { Athlete, transformToAthlete } from "../types/Athletes";
import { useJsonFiles } from "../hooks/useJsonFiles";
import AthleteCard from "../components/AthleteCard";
import { useStudyContext } from "../contexts/StudyContext";
import { naturalToCamelCase } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import AthleteFilter from "../components/AthleteFilter";
import { athleteAgeRanges } from "../types/Athletes";
import { useAthleteComparison } from "../contexts/AthleteComparisonContext";
// New interface for filter state
interface FilterState {
  age: string[];
  gender: string[];
  discipline: string[];
  institution: string[];
  category: string[];
}

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
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterTextPosition, setFilterTextPosition] = useState({
    left: 0,
    top: 0,
  });
  // Updated filter state to handle multiple criteria
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    age: [],
    gender: [],
    discipline: [],
    institution: [],
    category: [],
  });

  const [keyToCompare, setKeyToCompare] = useState("");

  const navigate = useNavigate();

  const user = {
    fullName: "Joaquin Berrini",
    email: "",
  };

  const [loadedAthletes, setLoadedAthletes] = useState<[string, Athlete][]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<[string, Athlete][]>(
    []
  );
  const [comparing, setComparing] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState("");

  const { readDirectoryJsons, deleteJson } = useJsonFiles();
  const { resetAthlete, setAthlete } = useStudyContext();
  const filterButtonRef = useRef(null);
  const { setAthleteToCompare1, setAthleteToCompare2 } = useAthleteComparison();

  // Effect to update categories when discipline changes
  useEffect(() => {
    if (selectedFilters.discipline.length === 0) {
      setCategories([]);
      return;
    }

    const filteredAthletes = loadedAthletes.filter(([_, athlete]) =>
      selectedFilters.discipline.includes(athlete.discipline)
    );

    const uniqueCategories = Array.from(
      new Set(filteredAthletes.map(([_, athlete]) => athlete.category))
    );

    setCategories(uniqueCategories);
  }, [selectedFilters.discipline, loadedAthletes]);

  // Updated validation function to handle multiple criteria
  const validateAthlete = (athlete: Athlete): boolean => {
    const hasNoFilters = Object.values(selectedFilters).every(
      (filters) => filters.length === 0
    );
    if (hasNoFilters) return true;

    const validations = {
      age: (): boolean => {
        if (selectedFilters.age.length === 0) return true;
        const age = Math.floor(
          (new Date().getTime() - new Date(athlete.birthDate).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        );
        return athleteAgeRanges
          .filter((range) => selectedFilters.age.includes(range.id.toString()))
          .some((range) => range.minAge <= age && range.maxAge >= age);
      },
      gender: (): boolean =>
        selectedFilters.gender.length === 0 ||
        selectedFilters.gender.includes(athlete.gender),
      discipline: (): boolean =>
        selectedFilters.discipline.length === 0 ||
        selectedFilters.discipline.includes(athlete.discipline),
      institution: (): boolean =>
        selectedFilters.institution.length === 0 ||
        selectedFilters.institution.includes(athlete.institution),
      category: (): boolean =>
        selectedFilters.category.length === 0 ||
        selectedFilters.category.includes(athlete.category),
    };

    return Object.values(validations).every((validation) => validation());
  };

  // Load athletes
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
      setInstitutions(
        Array.from(
          new Set(parsedAthletes.map((athlete) => athlete.institution))
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  // Other handlers
  const handleFilter = () => {
    setIsBlurred(true);
    onBlurChange(true);
  };

  const createAthlete = () => {
    customNavigate("forward", "athletes", "newAthlete");
    setTimeout(() => {
      navigate("/newAthlete?from=athletes");
    }, 300);
  };

  const compare = (key1: string, key2: string) => {
    setAthleteToCompare1(
      loadedAthletes.find((athlete) => athlete[0] === key1)?.[1]
    );
    setAthleteToCompare2(
      loadedAthletes.find((athlete) => athlete[0] === key2)?.[1]
    );
    customNavigate("forward", "athletes", "compareTwoAthletes");
    setTimeout(() => {
      navigate("/compareTwoAthletes");
    }, 300);
  };

  const onClick = (key: string) => {
    if (comparing) {
      if (keyToCompare.length > 0) {
        if (keyToCompare === key) {
          setKeyToCompare("");
        } else {
          compare(keyToCompare, key);
        }
      } else {
        setKeyToCompare(key);
      }
      return;
    }

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

  const resetFilters = () => {
    setSelectedFilters({
      age: [],
      gender: [],
      discipline: [],
      institution: [],
      category: [],
    });
  };

  // Effects
  useEffect(() => {
    loadAthletes();
    resetAthlete();
  }, []);

  useEffect(() => {
    setFilteredAthletes(
      loadedAthletes.filter(
        ([_, athlete]) =>
          athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          validateAthlete(athlete)
      )
    );
  }, [loadedAthletes, searchTerm, selectedFilters]);

  useEffect(() => {
    if (athleteToDelete.length) {
      onBlurChange(true);
      return;
    }
    onBlurChange(false);
  }, [athleteToDelete.length]);

  useEffect(() => {
    const updatePosition = () => {
      if (filterButtonRef.current) {
        const rect = filterButtonRef.current.getBoundingClientRect();
        setFilterTextPosition({
          left: rect.left + rect.width / 2,
          top: rect.bottom + 16, // 8px spacing below the button
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => window.removeEventListener("resize", updatePosition);
  }, [filterButtonRef.current]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center ${
          (isBlurred || athleteToDelete.length) && "blur-md pointer-events-none"
        } transition-all duration-300 ease-in-out ${animation}`}
        style={{
          paddingLeft: isExpanded ? "100px" : "32px",
        }}
      >
        {/* <div className="absolute w-16 h-16 top-8 right-8 bg-gray rounded-full"></div> */}
        <div className="flex mt-12">
          <h1 className="pt-2">Hola Profe!</h1>
          <img src="/hand.png" className="h-16 w-16 ml-12" />
        </div>
        <div className="w-4/5  flex items-center justify-center">
          {comparing ? (
            <div className="flex items-center justify-center h-40  ">
              <div className="w-40"></div>
              <p className="text-3xl text-dark self-center text-tertiary">
                Seleccione los atletas a comparar
              </p>
              <TonalButton
                title="Comparacion Múltiple"
                onClick={() => {}}
                containerStyles="ml-16"
                icon="compare"
              />
              <OutlinedButton
                title="Cancelar"
                onClick={() => {
                  setComparing(false);
                  setKeyToCompare("");
                }}
                containerStyles="ml-16"
                icon="close"
              />
            </div>
          ) : (
            <>
              <TonalButton
                title="Nuevo Atleta"
                onClick={createAthlete}
                containerStyles="mr-16"
                icon="add"
              />
              <div
                className={`w-1/2 h-16 rounded-2xl bg-white shadow-sm flex items-center mt-12 px-4 mb-12 ${
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
              {Object.values(selectedFilters).some(
                (value) => Array.isArray(value) && value.length > 0
              ) ? (
                <div className="flex ml-8 flex-col gap-y-2 items-center">
                  <div className="w-[182px] h-6 " />
                  <OutlinedButton
                    title="Filtrar"
                    onClick={handleFilter}
                    icon="filter"
                    ref={filterButtonRef}
                  />
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={resetFilters}
                  >
                    <p className="text-secondary hover:text-lightRed transition-all duration-300 ease-in-out">
                      Restablecer Filtros
                    </p>
                    <img src="/reset.png" alt="" className="h-5 w-5 ml-4" />
                  </div>
                </div>
              ) : (
                <OutlinedButton
                  title="Filtrar"
                  onClick={handleFilter}
                  containerStyles="ml-8"
                  icon="filter"
                  ref={filterButtonRef}
                />
              )}

              <TonalButton
                title="Comparar"
                onClick={() => {
                  setComparing(true);
                }}
                containerStyles="ml-8"
                icon="compare"
              />
            </>
          )}
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
              selected={keyToCompare === key}
              comparing={comparing}
            />
          ))}
        </div>
        {!loadedAthletes.length && (
          <>
            <p className=" text-xl mt-16 text-tertiary">
              No hay atletas cargados
            </p>
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
            <span className="text-tertiary">{athleteToDelete}</span>?
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
      {isBlurred && (
        <AthleteFilter
          onClose={() => {
            setIsBlurred(false);
            onBlurChange(false);
          }}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          resetFilters={resetFilters}
          institutions={institutions}
          categories={categories}
        />
      )}
    </>
  );
}
export default Athletes;
