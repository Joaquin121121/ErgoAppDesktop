import React from "react";

function AddEventModal({
  onClose,
  targetDate,
}: {
  onClose: () => void;
  targetDate: Date;
}) {
  return (
    <div className="flex flex-col items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-sm bg-white rounded-2xl w-1/2">
      <div
        className="absolute hover:opacity-70 transition-all duration-200 top-4 right-4 p-1 rounded-full bg-lightRed flex items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        <img src="/close.png" className="h-6 w-6" alt="Close" />
      </div>
      <p className="text-lg">
        Añadir Evento para{" "}
        {new Date(targetDate)
          .toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
          .replace(/^\w/, (c) => c.toUpperCase())
          .replace(/\b\w+\b/g, (w, i) =>
            i > 0 && w.length > 3 ? w.charAt(0).toUpperCase() + w.slice(1) : w
          )}
      </p>
    </div>
  );
}

export default AddEventModal;
