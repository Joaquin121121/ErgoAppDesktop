import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PhysicalSize, Window, getCurrentWindow } from "@tauri-apps/api/window";
import { supabase } from "../supabase";
import ErrorPage from "../pages/ErrorPage";
import LoginPage from "../pages/LoginPage";
import UpdateChecker from "./UpdateChecker";
import ConnectionStatus from "./ConnectionStatus";
import ErrorBoundary from "./ErrorBoundary";
import styles from "../styles/animations.module.css";
import { useUser } from "../contexts/UserContext";
import { useBlur } from "../contexts/BlurContext";

// Define types for props
type AuthGateProps = {
  children: React.ReactNode;
  WithLayout: React.ComponentType<any>;
  layoutProps: any;
};

// Define list of pages for animation keys
const animationKeys = [
  "dashboard",
  "studies",
  "athletes",
  "library",
  "about",
  "notFound",
  "startTest",
  "newTest",
  "selectAthlete",
  "newAthlete",
  "athleteStudies",
  "studyInfo",
  "completedStudyInfo",
  "compareTwoStudies",
  "compareThreeStudies",
  "compareTwoAthletes",
  "error",
  "completedStudyDashboard",
  "athleteMenu",
  "trainingMenu",
] as const;

type Page = (typeof animationKeys)[number];

const AuthGate = ({ children, WithLayout, layoutProps }: AuthGateProps) => {
  // Get authentication state from context
  const { isLoggedIn } = useUser();
  const { hideNav, setHideNav } = useBlur();

  // Update state
  const [showUpdate, setShowUpdate] = useState(false);

  // Animation state
  const [animations, setAnimations] = useState(
    Object.fromEntries(animationKeys.map((key) => [key, ""]))
  );

  // Error handling state
  const [hasGlobalError, setHasGlobalError] = useState(false);

  // UI interaction state
  const [isBlockingClicks, setIsBlockingClicks] = useState(false);

  // Window state
  const [isMaximized, setIsMaximized] = useState(true);
  const appWindow = Window.getCurrent();

  // Animation functions
  const resetAnimations = () => {
    setAnimations(Object.fromEntries(animationKeys.map((key) => [key, ""])));
  };

  const customNavigate = (
    direction: "back" | "forward",
    page: Page,
    nextPage: Page
  ) => {
    setTimeout(() => {
      resetAnimations();
    }, 600);
    if (direction === "back") {
      setAnimations({
        ...animations,
        [page]: styles.fadeOutRight,
        [nextPage]: styles.fadeInLeft,
      });
      return;
    }
    setAnimations({
      ...animations,
      [page]: styles.fadeOutLeft,
      [nextPage]: styles.fadeInRight,
    });
  };

  // Error handling functions
  const handleError = () => {
    setHasGlobalError(true);
  };

  const handleErrorReset = () => {
    setHasGlobalError(false);
    setHideNav(false);
    layoutProps.setSelectedOption("studies");
  };

  // Check window maximized state
  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();

    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then((unsubscribe) => unsubscribe());
    };
  }, []);

  // If not logged in, show login page
  if (!isLoggedIn) {
    const window = getCurrentWindow();
    window.setSize(new PhysicalSize(1000, 800));
    return <LoginPage />;
  } else {
    const window = getCurrentWindow();
    window.maximize();
  }

  // If there's a global error, show error page
  if (hasGlobalError) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <ErrorPage
              onReset={handleErrorReset}
              customNavigate={customNavigate}
            />
          }
        />
      </Routes>
    );
  }

  // Render the authenticated application
  return (
    <>
      <UpdateChecker showUpdate={showUpdate} setShowUpdate={setShowUpdate} />
      <ConnectionStatus showUpdate={showUpdate} />
      {isBlockingClicks && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "transparent",
            zIndex: 9999,
          }}
        />
      )}

      <Routes>
        <Route
          path="/error"
          element={
            <ErrorPage
              onReset={handleErrorReset}
              customNavigate={customNavigate}
            />
          }
        />
        <Route
          path="*"
          element={
            <WithLayout {...layoutProps} resetAnimations={resetAnimations}>
              <ErrorBoundary
                onError={handleError}
                onReset={handleErrorReset}
                fallback={<Navigate to="/error" replace />}
              >
                {React.Children.map(children, (child) => {
                  if (React.isValidElement(child)) {
                    return React.cloneElement(
                      child as React.ReactElement<any>,
                      {
                        animations,
                        customNavigate,
                        resetAnimations,
                      }
                    );
                  }
                  return child;
                })}
              </ErrorBoundary>
            </WithLayout>
          }
        />
      </Routes>
    </>
  );
};

export default AuthGate;
export { animationKeys };
export type { Page };
