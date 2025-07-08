import React, { useRef, useState } from "react";
import { useBlur } from "../contexts/BlurContext";
import TonalButton from "../components/TonalButton";
import OutlinedButton from "../components/OutlinedButton";
import inputStyles from "../styles/inputStyles.module.css";
import ContentCard from "../components/ContentCard";
import { useNavigate } from "react-router-dom";
import useBackspaceNavigation from "../hooks/useBackspaceNavigation";
function ContentLibrary({
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
  const { isBlurred } = useBlur();
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [filteredContent, setFilteredContent] = useState<any[]>([]);
  const [contentToDelete, setContentToDelete] = useState<any>(null);

  const onClose = () => {
    customNavigate("back", "contentLibrary", "library");
    setTimeout(() => {
      navigate("/library");
    }, 300);
  };
  const onClick = (key: string) => {
    console.log(key);
  };
  const handleFilter = () => {
    console.log("Filtrar");
  };

  useBackspaceNavigation(onClose);

  return (
    <div
      className={`flex-1 relative flex flex-col items-center ${
        isBlurred && "blur-md pointer-events-none"
      } transition-all duration-300 ease-in-out ${animation}`}
      style={{
        paddingLeft: isExpanded ? "100px" : "32px",
      }}
    >
      <div className="my-10 w-4/5 flex justify-around items-center">
        <div className="w-[122px]" />
        <p className="text-3xl text-secondary">Biblioteca de Ejercicios</p>
        <TonalButton
          inverse
          title="Volver"
          icon="backWhite"
          onClick={onClose}
        />
      </div>

      <div className="self-end w-3/4 flex items-center">
        <div
          className={`w-3/5 h-16 rounded-2xl bg-white shadow-sm flex items-center px-4 ${
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
            placeholder="Buscar tests..."
          />
        </div>
        {/*       <OutlinedButton
          title="Filtrar"
          onClick={handleFilter}
          containerStyles="ml-8"
          icon="filter"
          ref={filterButtonRef}
        /> */}
      </div>
      <div className="grid grid-cols-3 gap-x-[5%] gap-y-16 w-full  px-36">
        {filteredContent.map(([key, content]) => (
          <ContentCard
            key={key}
            content={content}
            onClick={() => {
              onClick(key);
            }}
            onDelete={(name) => setContentToDelete(name)}
          />
        ))}
      </div>
    </div>
  );
}

export default ContentLibrary;
