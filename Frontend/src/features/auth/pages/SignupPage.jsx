import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignupPage.css";
import { register } from "../services/authApi";

const SignupPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    // Student specific fields
    name: "",
    university: "",
    graduationYear: "",
    // Company specific fields
    companyName: "",
    industry: "",
    companySize: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        userType: userType,
        ...(userType === "student"
          ? {
              name: formData.name,
              university: formData.university,
              graduationYear: formData.graduationYear,
            }
          : {
              companyName: formData.companyName,
              industry: formData.industry,
              companySize: formData.companySize,
            }),
      });

      // Redirect to login page after successful registration
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <div className="left-section">
          <div className="ai-animation">
            <div className="pulse-circle"></div>
            <i className="fas fa-robot"></i>
          </div>
          <h1>Join QuickHire AI</h1>
          <p>Create your account and start your journey with AI-powered interviews</p>
        </div>

        <div className="right-section">
          <div className="signup-form-container">
            <h2>
              <i className="fas fa-user-plus"></i>
              Create Your Account
            </h2>

            <div className="toggle-buttons">
              <button
                className={userType === "student" ? "active" : ""}
                onClick={() => setUserType("student")}
              >
                <i className="fas fa-user-graduate"></i>
                Student
              </button>
              <button
                className={userType === "company" ? "active" : ""}
                onClick={() => setUserType("company")}
              >
                <i className="fas fa-building"></i>
                Company
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {userType === "student" ? (
                <>
                  <div className="input-group">
                    <i className="fas fa-user"></i>
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-university"></i>
                    <input
                      type="text"
                      name="university"
                      placeholder="University"
                      value={formData.university}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-calendar"></i>
                    <input
                      type="number"
                      name="graduationYear"
                      placeholder="Expected Graduation Year"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <i className="fas fa-building"></i>
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Company Name"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-industry"></i>
                    <input
                      type="text"
                      name="industry"
                      placeholder="Industry"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <i className="fas fa-users"></i>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Company Size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                </>
              )}

              <button type="submit" className="signup-button">
                <i className="fas fa-user-plus"></i>
                Create Account
              </button>
            </form>

            <p className="login-text">
              Already have an account?{" "}
              <span onClick={() => navigate("/login")}>Login</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 