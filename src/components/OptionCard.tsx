import React from "react";
import TonalButton from "./TonalButton";
import { useNavigate } from "react-router-dom";

// Define the interface for the props
interface OptionCardProps {
  value: string;
  title: string;
  subtitle: string;
  param?: string; // Optional param with default handled in the component
  className?: string;
  callToAction?: string;
  onClick?: () => void;
  icon?: string;
}

// Update the component to accept props
function OptionCard({
  value,
  title,
  subtitle,
  param = "",
  className = "",
  callToAction = "",
  onClick = () => {},
  icon,
}: OptionCardProps) {
  return (
    <div
      className={`flex flex-col w-1/2 items-center bg-white rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out ${className}`}
    >
      <div className="flex justify-center items-center gap-x-4 mt-4">
        <p className="text-2xl">{title}</p>
        {icon && <img src={`${icon}.png`} alt={title} className="w-7 h-7" />}
      </div>
      <p className="text-darkGray">{subtitle}</p>
      {/* You can use value, target, and param here as needed */}
      {callToAction && (
        <TonalButton
          title={callToAction}
          icon="next"
          containerStyles="self-center my-4"
          onClick={onClick}
        />
      )}
    </div>
  );
}

export default OptionCard;
