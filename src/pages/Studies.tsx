import React, { useEffect, useRef } from "react";
import { useState } from "react";
import availableStudies from "../types/Studies";
import type { Studies, Study } from "../types/Studies";
import StudyCard from "../components/StudyCard";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";
import { useStudyContext } from "../contexts/StudyContext";
import { useNavigate } from "react-router-dom";
import { useJsonFiles } from "../hooks/useJsonFiles";
import { naturalToCamelCase } from "../utils/utils";
import inputStyles from "../styles/inputStyles.module.css";
import { availableEquipment } from "../types/Studies";
import ReusableFilter from "../components/ReusableFilter";
import { useUser } from "../contexts/UserContext";
import HandleUpdate from "../components/HandleUpdate";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";

function Studies({
  onBlurChange,
  isExpanded,
  animation,
  customNavigate,
}: {
  onBlurChange: (isBlurred: boolean) => void;
  isExpanded: boolean;
  animation: string;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) {
  const { setStudy, resetAthlete } = useStudyContext();

  const { readDirectoryJsons, deleteJson } = useJsonFiles();

  const { user } = useUser();
  const navigate = useNavigate();

  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, right: 0 });

  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedStatsToMeasure, setSelectedStatsToMeasure] = useState<
    string[]
  >([]);
  const [studyToDelete, setStudyToDelete] = useState("");

  const [allStudies, setAllStudies] = useState([
    ...Object.entries(availableStudies),
  ]);
  const [filteredStudies, setFilteredStudies] = useState(allStudies);

  const filterSections = [
    {
      title: "Equipamiento",
      options: availableEquipment.map((equipment) => ({
        id: equipment,
        label: equipment,
      })),
      selectedOptions: selectedEquipment,
      onOptionSelect: (equipment: string) => {
        setSelectedEquipment((prev) =>
          prev.includes(equipment)
            ? prev.filter((e) => e !== equipment)
            : [...prev, equipment]
        );
      },
    },
  ];

  const loadCustomStudies = async () => {
    try {
      const result = await readDirectoryJsons("customStudies");
      console.log(result.message);
      const customStudies = result.files;
      const formattedCustomStudies: [string, any][] = customStudies.map(
        (study) => {
          return [study.content.name, study.content];
        }
      );
      setAllStudies([...filteredStudies, ...formattedCustomStudies]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFilter = () => {
    setSearchTerm("");
    updateOverlayPosition();
    setIsBlurred(true);
    onBlurChange(true);
  };

  const createTest = () => {
    customNavigate("forward", "studies", "newTest");
    setTimeout(() => {
      navigate("/newTest");
    }, 300);
  };

  // Add a function to calculate position
  const updateOverlayPosition = () => {
    if (filterButtonRef.current) {
      const buttonRect = filterButtonRef.current.getBoundingClientRect();
      setOverlayPosition({
        top: buttonRect.bottom + 8, // Adding 8px gap
        right: window.innerWidth - buttonRect.right,
      });
    }
  };
  const onClick = (key) => {
    console.log(filteredStudies);
    console.log(filteredStudies.find((array) => array[0] === key)?.[1]);
    setStudy(filteredStudies.find((array) => array[0] === key)?.[1]);
    customNavigate("forward", "studies", "startTest");
    setTimeout(() => {
      navigate("/startTest");
    }, 200);
  };

  const onDelete = async () => {
    try {
      const result = await deleteJson(
        naturalToCamelCase(studyToDelete) + ".json",
        "customStudies"
      );
      console.log(result);
      setAllStudies(allStudies.filter((e) => e[1].name !== studyToDelete));
      setStudyToDelete("");
    } catch (error) {
      console.log(error);
    }
  };

  const checkForUpdates = async () => {
    try {
      const update = await check();
      if (update) {
        console.log(update);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setFilteredStudies(
      allStudies.filter(([_, study]) =>
        study.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, allStudies]);

  useEffect(() => {
    loadCustomStudies();
    resetAthlete();
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (studyToDelete.length /* || !user.name.length */) {
      onBlurChange(true);
      return;
    }
    onBlurChange(false);
  }, [studyToDelete.length, user]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center ${
          (isBlurred || studyToDelete.length) /* || !user.name.length */ &&
          "blur-md pointer-events-none"
        } transition-all duration-300 ease-in-out ${animation}`}
        style={{ paddingLeft: isExpanded ? "100px" : "32px" }}
      >
        {/* <div className="absolute w-16 h-16 top-8 right-8 bg-gray rounded-full"></div> */}
        <div className="flex mt-12">
          <h1 className="pt-2">Hola Profe!</h1>
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
              placeholder="Buscar estudios..."
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
            title="Crear Test"
            onClick={createTest}
            containerStyles="ml-8"
            icon="add"
          />
        </div>

        <div className="grid grid-cols-3 gap-x-[5%] gap-y-16 w-full  px-36">
          {filteredStudies.map(([key, study]) => (
            <StudyCard
              key={key}
              study={study}
              onClick={() => {
                onClick(key);
              }}
              onDelete={(name) => setStudyToDelete(name)}
            />
          ))}
        </div>
      </div>
      {isBlurred && (
        <ReusableFilter
          sections={filterSections}
          position={overlayPosition}
          onClose={() => {
            setIsBlurred(false);
            onBlurChange(false);
          }}
          onReset={() => {
            setSelectedEquipment([]);
            setSelectedStatsToMeasure([]);
          }}
          onApply={() => {
            setFilteredStudies(
              Object.entries(availableStudies).filter(([_, study]) => {
                // If no filters are selected, show all studies
                if (
                  selectedEquipment.length === 0 &&
                  selectedStatsToMeasure.length === 0
                ) {
                  return true;
                }

                // If only equipment filters are selected
                if (
                  selectedEquipment.length > 0 &&
                  selectedStatsToMeasure.length === 0
                ) {
                  return study.preview.equipment.some((e: string) =>
                    selectedEquipment.includes(e)
                  );
                }

                // If only stats filters are selected
                if (
                  selectedEquipment.length === 0 &&
                  selectedStatsToMeasure.length > 0
                ) {
                  return study.preview.statsToMeasure.some((e: string) =>
                    selectedStatsToMeasure.includes(e)
                  );
                }

                // If both filters are selected
                return (
                  study.preview.equipment.some((e: string) =>
                    selectedEquipment.includes(e)
                  ) &&
                  study.preview.statsToMeasure.some((e: string) =>
                    selectedStatsToMeasure.includes(e)
                  )
                );
              }) as [keyof Studies, Study][]
            );
            setIsBlurred(false);
            onBlurChange(false);
          }}
        />
      )}
      {studyToDelete.length && (
        <div
          className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 px-8 w-[500px]
             top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        >
          <p className="text-darkGray text-lg my-8">
            Está seguro que desea eliminar el test{" "}
            <span className="text-black">{studyToDelete}</span>?
          </p>
          <div className="flex justify-around w-full mb-8">
            <OutlinedButton
              icon="back"
              onClick={() => {
                setStudyToDelete("");
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
      {/* {!user.name.length && <Login />} */}
    </>
  );
}

export default Studies;
