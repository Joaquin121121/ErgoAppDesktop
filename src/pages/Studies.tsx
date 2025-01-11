import React from "react";
import { useState } from "react";
import availableStudies from "../availableStudies";
import StudyCard from "../components/StudyCard";

function Studies() {
  const user = {
    fullName: "Joaquin Berrini",
    email: "",
  };

  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter studies based on search term
  const filteredStudies = Object.entries(availableStudies).filter(
    ([key, study]) =>
      study.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex-1 relative flex flex-col items-center">
      <div className="absolute w-16 h-16 top-8 right-8 bg-gray rounded-full"></div>
      <div className="flex mt-12">
        <h1 className="pt-2">
          Bienvenido,{" "}
          {user.fullName.split(" ")[0].charAt(0).toUpperCase() +
            user.fullName.split(" ")[0].slice(1)}
        </h1>
        <img src="/hand.png" className="h-16 w-16 ml-12" />
      </div>
      <div
        className={`w-1/2 h-16 rounded-2xl bg-white shadow-sm flex items-center mt-12 px-4 mb-12 ${
          searchBarFocus && "border border-secondary"
        }`}
      >
        <img src="/search.png" alt="Buscar" className="h-8 w-8 mr-8" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 h-full focus:outline-none text-lg"
          onFocus={() => setSearchBarFocus(true)}
          onBlur={() => setSearchBarFocus(false)}
          placeholder="Buscar estudios..."
        />
      </div>
      <div className="grid grid-cols-3 gap-x-48 gap-y-16 w-full  px-36">
        {filteredStudies.map(([key, study]) => (
          <StudyCard key={key} study={study} />
        ))}
      </div>
    </div>
  );
}

export default Studies;
