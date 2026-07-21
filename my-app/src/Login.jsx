import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/auth/login",
        {
          username: username.trim(),
          password,
        }
      );

      if (response.data.success) {
        localStorage.setItem(
          "token",
          response.data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        alert(
          response.data.message || "Login Successful"
        );

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(
        error.response?.data?.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className={`login-card ${loginError ? "login-card-error" : ""}`}>
        <h1 className="login-title">Welcome Back</h1>

        <p className="login-subtitle">
          NIC Validation System
        </p>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <input
            className={`login-input ${loginError ? "login-input-error" : ""}`}
            type="text"
            placeholder="Username"
            value={username}
            aria-invalid={Boolean(loginError)}
            onChange={(e) => {
              setUsername(e.target.value)
              setLoginError("");
            }}
            required
          />

          <input
            className={`login-input ${loginError ? "login-input-error" : ""}`}
            type="password"
            placeholder="Password"
            value={password}
            aria-invalid={Boolean(loginError)}
            onChange={(e) => {
              setPassword(e.target.value)
              setLoginError("");
            }}
            required
          />

          {loginError && (
            <p className="login-error-message" role="alert">
              {loginError}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="login-link">
            Don't have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
