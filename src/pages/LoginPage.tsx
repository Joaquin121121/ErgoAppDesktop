import React, { useEffect, useState } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import TonalButton from "../components/TonalButton";
import { useUser } from "../contexts/UserContext";
import { Window } from "@tauri-apps/api/window";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { supabase } from "../supabase";
function LoginPage() {
  const { login, loginWithGoogle } = useUser();
  const [formState, setFormState] = useState({
    email: {
      value: "",
      error: "",
    },
    password: {
      value: "",
      error: "",
    },
  });
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setValidationAttempted(true);
    setErrorMessage("");

    // Basic validation
    let isValid = true;
    const updatedState = { ...formState };

    if (!formState.email.value) {
      updatedState.email.error = "Email es requerido";
      isValid = false;
    }

    if (!formState.password.value) {
      updatedState.password.error = "Contraseña es requerida";
      isValid = false;
    }

    if (!isValid) {
      setFormState(updatedState);
      return;
    }

    const { error } = await login(
      formState.email.value,
      formState.password.value
    );
    if (error) {
      console.error("Login error:", error);
      // Set field error instead of general error message for credential issues
      if (error.message?.includes("Invalid login credentials")) {
        setFormState({
          ...formState,
          password: {
            ...formState.password,
            error: "Usuario o contraseña incorrectos",
          },
        });
      } else {
        setErrorMessage("Error al iniciar sesión. Por favor intente de nuevo.");
      }
    } else {
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    try {
      const { error } = await loginWithGoogle();
      if (error) {
        console.error("Google login error:", error);
        if (
          error.error_code === "validation_failed" &&
          error.msg?.includes("provider is not enabled")
        ) {
          setErrorMessage(
            "Inicio de sesión con Google no está disponible. Por favor use el email."
          );
        } else {
          setErrorMessage(
            "Error al iniciar sesión con Google. Por favor intente de nuevo."
          );
        }
      } else {
      }
    } catch (err) {
      console.error("Google login error:", err);
      setErrorMessage(
        "Error al iniciar sesión con Google. Por favor use el email."
      );
    }
  };

  return (
    <div className="bg-white w-[100vw] h-[100vh] shadow-sm p-8">
      <div className="flex flex-col items-center">
        <img src="/logo.png" alt="logo" className="h-16 w-16 my-8" />

        <p className="text-2xl">
          Bienvenido a{" "}
          <span className="text-secondary font-medium">ErgoLab</span>
        </p>

        {errorMessage && (
          <div
            className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-col mt-8">
          <p>Email</p>
          <input
            type="text"
            className={`${
              inputStyles.input
            } bg-offWhite rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
              validationAttempted &&
              formState.email.error &&
              inputStyles.focused
            } `}
            value={formState.email.value}
            onChange={(e) =>
              setFormState({
                ...formState,
                email: { value: e.target.value, error: "" },
              })
            }
          />
          {validationAttempted && formState.email.error && (
            <p className="text-red-500 text-sm mt-1">{formState.email.error}</p>
          )}

          <p className="mt-4">Contraseña</p>
          <input
            type="password"
            className={`${
              inputStyles.input
            } bg-offWhite rounded-2xl shadow-sm pl-2 w-80 h-10 text-tertiary ${
              validationAttempted &&
              formState.password.error &&
              inputStyles.focused
            } `}
            value={formState.password.value}
            onChange={(e) =>
              setFormState({
                ...formState,
                password: { value: e.target.value, error: "" },
              })
            }
          />
          {validationAttempted && formState.password.error && (
            <p className="text-red-500 text-sm mt-1">
              {formState.password.error}
            </p>
          )}

          <TonalButton
            title="Iniciar sesión"
            icon="next"
            onClick={handleLogin}
            containerStyles="mt-8 self-center"
          />

          <div className="flex justify-between items-center w-full mt-4">
            <div className="h-[1px] w-[40%] bg-offWhite" />
            <p className="text-darkGray text-sm">O</p>
            <div className="h-[1px] w-[40%] bg-offWhite" />
          </div>

          <div
            className="mt-4 h-[41px] border self-center px-4 border-lightRed rounded-2xl flex items-center justify-center gap-x-4 hover:opacity-70 hover:cursor-pointer active:opacity-40 shadow-sm"
            onClick={handleGoogleLogin}
          >
            <p className="text-darkGray">Continuar con Google</p>
            <img src="/google.png" alt="" className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
