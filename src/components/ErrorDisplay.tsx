import React from "react";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";
function ErrorDisplay({ setIsBlurred, redoTest }) {
  return (
    <div
      className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 px-8 w-[800px]
             top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
    >
      <p className="text-secondary text-2xl my-8">Error</p>
      <p className="text-black text-lg mb-12">
        No hay saltos registrados en este test. Qué desea hacer?
      </p>
      <div className="flex justify-around w-full mb-8">
        <OutlinedButton
          icon="back"
          onClick={() => {
            setIsBlurred(false);
          }}
          title="Volver"
          containerStyles="w-[25%]"
          inverse
        />
        <TonalButton
          icon="againWhite"
          onClick={redoTest}
          title="Rehacer Test"
          containerStyles="w-[25%]"
        />
      </div>
    </div>
  );
}

export default ErrorDisplay;
