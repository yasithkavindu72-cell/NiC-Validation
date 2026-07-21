import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password) {
      alert("Please complete all fields");
      return;
    }

    if (cleanEmail.length > 254 || !EMAIL_PATTERN.test(cleanEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (cleanUsername.length < 3) {
      alert("Username must contain at least 3 characters");
      return;
    }

    if (password.length < 8) {
      alert("Password must contain at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/auth/register",
        {
          username: cleanUsername,
          email: cleanEmail,
          password: password,
        }
      );

      console.log("Registration response:", response.data);

      if (response.data.success) {
        alert(
          response.data.message ||
            "Registration Successful"
        );

        navigate("/");
      } else {
        alert(
          response.data.message ||
            "Registration Failed"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      console.error(
        "Backend status:",
        error.response?.status
      );
      console.error(
        "Backend response:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          "Registration Failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1 className="register-title">
          Create Account
        </h1>

        <p className="register-subtitle">
          NIC Validation System
        </p>

        <form
          className="register-form"
          onSubmit={handleRegister}
        >
          <input
            className="register-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            minLength={3}
            required
          />

          <input
            className={`register-input ${emailError ? "register-input-error" : ""}`}
            type="email"
            placeholder="Email Address"
            value={email}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "register-email-error" : undefined}
            maxLength={254}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError("");
            }}
            onBlur={() => {
              const cleanEmail = email.trim().toLowerCase();

              if (cleanEmail && !EMAIL_PATTERN.test(cleanEmail)) {
                setEmailError("Please enter a valid email address");
              }
            }}
            required
          />

          {emailError && (
            <p id="register-email-error" className="register-error-message" role="alert">
              {emailError}
            </p>
          )}

          <input
            className="register-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            minLength={8}
            required
          />

          <input
            className="register-input"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            minLength={8}
            required
          />

          <button
            className="register-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Registering..."
              : "Register"}
          </button>
        </form>

        <p className="register-login">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
