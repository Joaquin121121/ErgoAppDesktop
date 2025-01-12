import React, { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import availableStudies from "../availableStudies";
import StudyCard from "../components/StudyCard";
import OutlinedButton from "../components/OutlinedButton";
import Filter from "../components/Filter";

function Studies({
  onBlurChange,
  isExpanded,
}: {
  onBlurChange: (isBlurred: boolean) => void;
  isExpanded: boolean;
}) {
  const user = {
    fullName: "Joaquin Berrini",
    email: "",
  };

  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, right: 0 });

  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);

  // Filter studies based on search term
  const [filteredStudies, setFilteredStudies] = useState(
    Object.entries(availableStudies)
  );

  const handleFilter = () => {
    updateOverlayPosition();
    setIsBlurred(true);
    onBlurChange(true);
    console.log(overlayPosition);
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

  useEffect(() => {
    setFilteredStudies(
      Object.entries(availableStudies).filter(([key, study]) =>
        study.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  return (
    <>
      <div
        className={`flex-1 relative flex flex-col items-center ${
          isBlurred && "blur-md pointer-events-none"
        } transition-all duration-300 ease-in-out`}
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
              searchBarFocus && "border border-secondary"
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
        </div>

        <div className="grid grid-cols-3 gap-x-[5%] gap-y-16 w-full  px-36">
          {filteredStudies.map(([key, study]) => (
            <StudyCard key={key} study={study} />
          ))}
        </div>
      </div>
      {isBlurred && (
        <Filter
          setFilteredStudies={setFilteredStudies}
          setIsBlurred={setIsBlurred}
          onBlurChange={onBlurChange}
          top={overlayPosition.top}
          right={overlayPosition.right}
        />
      )}
    </>
  );
}

export default Studies;
