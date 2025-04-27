import React, { useState } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import TonalButton from "../components/TonalButton";
import animations from "../styles/animations.module.css";
function LoginPageWithSignup() {
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
  const [animation, setAnimation] = useState(animations.fadeIn);

  const [signingUp, setSigningUp] = useState(false);

  const logIn = async () => {};

  const showSignUp = () => {
    setAnimation(animations.fadeOutLeft);
    setTimeout(() => {
      setSigningUp(true);
      setAnimation(animations.fadeInRight);
    }, 300);
  };

  const showLogin = () => {
    setAnimation(animations.fadeOutRight);
    setTimeout(() => {
      setSigningUp(false);
      setAnimation(animations.fadeInLeft);
    }, 300);
  };

  const register = async () => {};

  return (
    <div className="bg-white w-[100vw] h-[100vh] shadow-sm  p-8">
      <div className={`flex flex-col items-center ${animation}`}>
        <img src="/logo.png" alt="logo" className="h-16 w-16 my-8" />

        {signingUp ? (
          <>
            <p className="text-2xl">Nuevo Usuario</p>
            <p className="mt-2">
              Ya tienes una cuenta?{" "}
              <span
                onClick={showLogin}
                className="text-secondary hover:opacity-70 active:opacity-40 cursor-pointer"
              >
                Iniciar sesión
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl">
              Bienvenido a{" "}
              <span className="text-secondary font-medium">ErgoLab</span>
            </p>{" "}
            <p className="mt-2">
              No tienes una cuenta?{" "}
              <span
                onClick={showSignUp}
                className="text-secondary hover:opacity-70 active:opacity-40 cursor-pointer"
              >
                Registrarse
              </span>
            </p>
          </>
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
          <p className="mt-4">Contraseña</p>
          <input
            type="text"
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
          <TonalButton
            title={signingUp ? "Registrarse" : "Iniciar sesión"}
            icon={signingUp ? "add" : "next"}
            onClick={signingUp ? register : logIn}
            containerStyles="mt-8 self-center "
          />
          <div className="flex justify-between items-center w-full mt-4">
            <div className="h-[1px] w-[40%] bg-offWhite" />
            <p className="text-darkGray text-sm">O</p>
            <div className="h-[1px] w-[40%] bg-offWhite" />
          </div>
          <div className="mt-4 h-[41px] border self-center px-4 border-lightRed rounded-2xl flex items-center justify-center gap-x-4  hover:opacity-70 hover:cursor-pointer active:opacity-40 shadow sm">
            <p className="text-darkGray">Continuar con Google</p>
            <img src="/google.png" alt="" className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPageWithSignup;
