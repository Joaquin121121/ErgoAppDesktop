import React from "react";

function MaximizePopUp() {
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center bg-secondary overflow-hidden ">
      <img className="w-1/2 h-1/2 object-contain" src="/splash.png" />
      <p className="text-2xl text-offWhite mt-8">
        Maximice la ventana para usar la app
      </p>
    </div>
  );
}

export default MaximizePopUp;
