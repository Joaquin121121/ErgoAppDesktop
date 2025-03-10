import React from "react";
import { useTranslation } from "react-i18next";
import scrollBarStyles from "../styles/scrollbar.module.css";
import { JumpTime } from "../types/Studies";

interface StudyResultsTableProps {
  studyType: "multipleJumps" | "multipleDropJump" | "bosco" | "standard";
  jumpTimes?: JumpTime[];
  dropJumps?: any[];
  boscoTests?: any[];
  stiffness?: number[];
  performance?: number[];
  showDeleted?: boolean;
  handleDelete?: (index: number) => void;
  maxHeight?: number;
  data?: {
    avgFlightTime?: number;
    avgHeightReached?: number;
    avgFloorTime?: number;
    avgStiffness?: number;
    avgPerformance?: number;
    maxAvgHeightReached?: number;
  };
  compactView?: boolean;
  scrollable?: boolean;
  maxTableHeight?: string;
}

const StudyResultsTable: React.FC<StudyResultsTableProps> = ({
  studyType,
  jumpTimes = [],
  dropJumps = [],
  boscoTests = [],
  stiffness = [],
  performance = [],
  showDeleted = false,
  handleDelete,
  data = {},
  compactView = false,
  scrollable = true,
  maxTableHeight = "600px",
}) => {
  const { t } = useTranslation();

  return (
    <table className="w-full mt-8">
      <thead className="w-full">
        <tr className="flex justify-around items-center w-full">
          <th
            className={`text-2xl w-${
              studyType === "multipleDropJump" ? "60" : "40"
            } font-normal text-tertiary`}
          >
            {studyType === "multipleDropJump"
              ? "Altura de Caída"
              : studyType === "bosco"
              ? "Test"
              : "Saltos"}
          </th>
          <th className="text-2xl w-52 font-normal text-tertiary">
            Tiempo de Vuelo
          </th>
          {studyType === "multipleJumps" && (
            <th className="text-2xl w-52 font-normal text-tertiary">
              Tiempo de Piso
            </th>
          )}
          <th className="text-2xl w-36 font-normal text-tertiary">Altura</th>
          {studyType === "multipleJumps" && (
            <>
              <th className="text-2xl w-36 font-normal text-tertiary">
                Stiffness
              </th>
              <th className="text-2xl w-36 font-normal text-tertiary">
                Rendimiento
              </th>
            </>
          )}
          {handleDelete && (
            <th className="text-2xl w-24 font-normal text-tertiary">
              {studyType === "multipleDropJump" ? "Ver Detalle" : "Eliminar"}
            </th>
          )}
        </tr>
      </thead>
      <tbody
        className={`w-full block ${
          scrollable ? scrollBarStyles.customScrollbar : ""
        }`}
        style={{
          maxHeight: scrollable ? maxTableHeight : "none",
          overflowY: scrollable ? "auto" : "visible",
        }}
      >
        {/* Conditionally render different table body based on study type */}
        {/* ... implementation for rendering rows based on study type ... */}
      </tbody>
      <tfoot className="w-full block">
        {/* Average/summary row */}
        {/* ... implementation for displaying averages ... */}
      </tfoot>
    </table>
  );
};

export default StudyResultsTable;
