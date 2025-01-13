import React from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import availableStudies from "../availableStudies";
import OutlinedButton from "../components/OutlinedButton";
import TonalButton from "../components/TonalButton";

function StartTest({ isExpanded }: { isExpanded: boolean }) {
  const [searchParams] = useSearchParams();
  const testName = searchParams.get("name");

  const navigate = useNavigate();

  const searchAthlete = () => {};

  return (
    <div
      className={`flex-1 relative flex flex-col items-center transition-all duration-300 ease-in-out`}
      style={{ paddingLeft: isExpanded ? "224px" : "128px" }}
    >
      <div className="w-[90%] bg-white shadow-sm rounded-2xl mt-8 flex flex-col px-16">
        <div
          className="absolute top-10 right-[6%] p-1 rounded-full bg-lightRed flex justify-center cursor-pointer"
          onClick={() => {
            navigate("/studies");
          }}
        >
          <img src="/close.png" className="h-10 w-10" alt="" />
        </div>
        <p className="text-5xl text-secondary mt-8 self-center ">
          {availableStudies[testName]["name"]}
        </p>
        <p className="text-4xl mt-16 text-black">Datos del Atleta</p>
        <div className="flex mt-12 justify-around items-center">
          <OutlinedButton
            large
            title="Buscar Atleta"
            onClick={searchAthlete}
            inverse
            icon="search"
            containerStyles="w-1/5"
          />
          <TonalButton
            large
            title="Añadir Atleta"
            onClick={searchAthlete}
            inverse
            icon="add"
            containerStyles="w-1/5"
          />
        </div>
        <p className="text-4xl mt-16 text-black">Datos del Test</p>
        <div className="mt-12 px-12 flex items-center">
          <p className="text-black text-xl">Pie de Despegue</p>
        </div>
        <div className="mt-8 px-12 flex items-center"></div>
      </div>
    </div>
  );
}

export default StartTest;
