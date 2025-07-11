import React, { useEffect, useState } from "react";
import navAnimations from "../styles/animations.module.css";
import { useBlur } from "../contexts/BlurContext";
import OutlinedButton from "./OutlinedButton";
import TonalButton from "./TonalButton";
import { useDatabaseSync } from "../hooks/useDatabaseSync";

interface CloseConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CloseConfirmationModal: React.FC<CloseConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const [animation, setAnimation] = useState(navAnimations.popupFadeInTop);

  const localOnCancel = () => {
    setIsBlurred(false);
    setAnimation(navAnimations.popupFadeOutTop);
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  const { setIsBlurred } = useBlur();
  const { syncStatus } = useDatabaseSync();
  useEffect(() => {
    if (isOpen) {
      setIsBlurred(true);
    } else {
      setIsBlurred(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (syncStatus !== "syncing") {
      onConfirm();
    }
  }, [syncStatus]);

  return (
    <div
      className={`fixed top-8 left-1/2 -translate-x-1/2 bg-white shadow-sm rounded-2xl flex flex-col items-center z-50 p-8 ${animation}`}
    >
      <div
        className="absolute z-50 hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={localOnCancel}
      >
        <img src="/close.png" className="h-6 w-6" alt="" />
      </div>
      <p className="text-2xl font-medium mb-4">Sincronizacion Pendiente</p>
      <p className="mb-4">Hay cambios pendientes de sincronizar.</p>
      <p className="mb-4">
        La aplicacion se cerrara automaticamente cuando se complete la
        sincronizacion.
      </p>
      <div className="flex justify-center gap-x-8 items-center ">
        <OutlinedButton onClick={localOnCancel} title="Cancelar" icon="close" />
        <TonalButton
          onClick={onConfirm}
          title="Cerrar Aplicación"
          icon="next"
        />
      </div>
    </div>
  );
};

export default CloseConfirmationModal;
