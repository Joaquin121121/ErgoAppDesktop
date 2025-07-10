import React, { useState } from "react";
import navAnimations from "../styles/animations.module.css";
import SessionInfoStage from "./SessionInfoStage";

function EditSessionPopup({
  onClose,
  isModel,
  sessionId,
  sessionIndex,
  setSessionIndex,
}: {
  onClose: () => void;
  isModel: boolean;
  sessionId: string;
  sessionIndex?: number;
  setSessionIndex?: (index: number) => void;
}) {
  const [animation, setAnimation] = useState(navAnimations.popupFadeInTop);
  const localOnClose = () => {
    setAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      onClose();
    }, 200);
  };
  return (
    <div
      className={`absolute flex flex-col items-center top-8 left-1/2 transform -translate-x-1/2 bg-white shadow-sm rounded-2xl ${animation} w-3/4`}
    >
      <div
        className="absolute z-50 hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={localOnClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>
      <SessionInfoStage
        animation=""
        onNext={() => {}}
        isModel={isModel}
        sessionId={sessionId}
        onClose={localOnClose}
        sessionIndex={sessionIndex}
        setSessionIndex={setSessionIndex}
      />
    </div>
  );
}

export default EditSessionPopup;
