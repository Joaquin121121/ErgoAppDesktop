import React, { createContext, useState, useContext, ReactNode } from "react";

interface BlurContextProps {
  isBlurred: boolean;
  setIsBlurred: (isBlurred: boolean) => void;
  hideNav: boolean;
  setHideNav: (hideNav: boolean) => void;
}

const BlurContext = createContext<BlurContextProps | undefined>(undefined);

export const BlurProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isBlurred, setIsBlurred] = useState<boolean>(false);
  const [hideNav, setHideNav] = useState<boolean>(false);

  return (
    <BlurContext.Provider
      value={{ isBlurred, setIsBlurred, hideNav, setHideNav }}
    >
      {children}
    </BlurContext.Provider>
  );
};

export const useBlur = (): BlurContextProps => {
  const context = useContext(BlurContext);
  if (context === undefined) {
    throw new Error("useBlur must be used within a BlurProvider");
  }
  return context;
};
