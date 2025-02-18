import React, { useEffect, useState } from "react";
import inputStyles from "../styles/inputStyles.module.css";
import TonalButton from "./TonalButton";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";
import OutlinedButton from "./OutlinedButton";

interface Errors {
  email: string;
  password: string;
}
interface LoginQuery {
  email: string;
  password: string;
}

interface RegisterQuery extends LoginQuery {
  name: "";
}

function Login() {
  const [errors, setErrors] = useState<Errors>({ email: "", password: "" });
  const [loginQuery, setLoginQuery] = useState<LoginQuery>({
    email: "",
    password: "",
  });

  const [registerQuery, setRegisterQuery] = useState<RegisterQuery>({
    email: "",
    password: "",
    name: "",
  });
  const [registering, setRegistering] = useState(false);

  const handleInputChange = (field: keyof RegisterQuery, value: string) => {
    if (registering) {
      setRegisterQuery({ ...registerQuery, [field]: value });
    } else {
      setLoginQuery({ ...registerQuery, [field]: value });
    }
  };

  const validateEmail = (email) => {
    // Basic email regex pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return "El email es requerido";
    }
    if (!emailPattern.test(email)) {
      return "Por favor ingrese un email válido";
    }
    return ""; // no error
  };

  const validatePassword = (password) => {
    if (!password) {
      return "La contraseña es requerida";
    }
    if (password.length < 8) {
      return "La contraseña debe tener 8 caracteres como mínimo";
    }

    return "";
  };

  const validateQuery = () => {
    const queryToAnalyze = registering ? registerQuery : loginQuery;
    const emailError = validateEmail(queryToAnalyze.email);
    const passwordError = validatePassword(queryToAnalyze.password);

    if (emailError.length > 0) {
      setErrors({ ...errors, email: emailError });
      return;
    }
    if (passwordError.length > 0) {
      setErrors({ ...errors, password: passwordError });
      return;
    }
  };

  const handleLogin = async () => {
    validateQuery();
    try {
      await signInWithEmailAndPassword(
        auth,
        loginQuery.email,
        loginQuery.password
      );
    } catch (error) {
      console.log(error.code);
      if (error.code === "auth/invalid-credential") {
        setErrors({ ...errors, email: "Credenciales inválidas" });
      }
    }
  };

  const loginWithGoogle = async () => {};

  const handleRegister = async () => {
    validateQuery();

    try {
      await createUserWithEmailAndPassword(
        auth,
        registerQuery.email,
        registerQuery.password
      );
      await handleLogin();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setErrors({ email: "", password: "" });
  }, [loginQuery]);

  useEffect(() => {
    console.log(auth.currentUser);
  }, [auth]);

  return (
    <div
      className="bg-white shadow-sm fixed z-50 rounded-2xl py-2 px-8 w-1/2
             top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
    >
      <img src="/logo.png" className="mt-8 self-center w-20 h-20" alt="" />
      <p className="text-3xl self-center mt-8 mb-12">Iniciar Sesión</p>
      <div className="flex flex-col w-3/5">
        {registering && (
          <>
            <p className="text-xl text-darkGray mb-2">Nombre</p>
            <input
              type="text"
              className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-full h-10 text-tertiary ${
                inputStyles.input
              } ${errors.email && inputStyles.focused}`}
              value={loginQuery.email}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
            {errors.email.length > 0 && (
              <p className="text-secondary">{errors.email}</p>
            )}
          </>
        )}
        <p className="text-xl text-darkGray mb-2">Email</p>
        <input
          type="text"
          className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-full h-10 text-tertiary ${
            inputStyles.input
          } ${errors.email && inputStyles.focused}`}
          value={loginQuery.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
        />
        {errors.email.length > 0 && (
          <p className="text-secondary">{errors.email}</p>
        )}
        <p className="text-xl text-darkGray mt-8 mb-2">Contraseña</p>
        <input
          type="text"
          className={`bg-offWhite focus:outline-secondary rounded-2xl shadow-sm pl-2 w-full h-10 text-tertiary ${
            inputStyles.input
          } ${errors.password && inputStyles.focused}`}
          value={loginQuery.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
        />
        {errors.password.length > 0 && (
          <p className="text-secondary">{errors.password}</p>
        )}
        <div className="flex justify-around items-center mt-12 mb-4">
          <OutlinedButton
            title={registering ? "Volver" : "Registrarse"}
            icon={registering ? "back" : "addRed"}
            onClick={() => {
              setRegistering(!registering);
            }}
          />
          <TonalButton
            title={registering ? "Registrarse" : "Iniciar Sesión"}
            icon="next"
            onClick={registering ? handleRegister : handleLogin}
          />
        </div>
      </div>
    </div>
  );
}

export default Login;
