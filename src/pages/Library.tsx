import { useBlur } from "../contexts/BlurContext";
import React from "react";

const Library = ({
  isExpanded,
  animation,
  customNavigate,
}: {
  isExpanded: boolean;
  animation: any;
  customNavigate: (
    direction: "back" | "forward",
    page: string,
    nextPage: string
  ) => void;
}) => {
  const { isBlurred } = useBlur();
  return (
    <div
      className={`flex-1 relative flex flex-col items-center ${
        isBlurred && "blur-md pointer-events-none"
      } transition-all duration-300 ease-in-out ${animation}`}
      style={{
        paddingLeft: isExpanded ? "100px" : "32px",
      }}
    ></div>
  );
};

export default Library;
