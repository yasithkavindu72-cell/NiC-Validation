import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import LogoutOverlay from "../LogoutOverlay";

function Dashboard() {
  // React Router helper used to move between application pages.
  const navigate = useNavigate();

  // Control the mobile sidebar and logout loading overlay.
  const [sidebarOpen, setSidebarOpen] =
    useState(false);
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  // Store the text entered in the NIC search field.
  const [searchText, setSearchText] =
    useState("");

  // Read the logged-in user once when the Dashboard first loads.
  const [user] = useState(() => {
    const savedUser = localStorage.getItem("user");

    // No saved user means that there is no active login.
    if (!savedUser) {
      return null;
    }

    try {
      // Convert the saved JSON text back into a user object.
      return JSON.parse(savedUser);
    } catch {
      // Remove invalid saved data so it is not reused later.
      localStorage.removeItem("user");
      return null;
    }
  });

  // Redirect visitors to the login page when no user is available.
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [navigate, user]);

  // Read and parse the latest NIC validation result once.
  const validationResult = useMemo(() => {
    try {
      const savedResult = sessionStorage.getItem(
        "nicValidationResult"
      );

      return savedResult
        ? JSON.parse(savedResult)
        : null;
    } catch (error) {
      console.error(
        "Cannot read validation result:",
        error
      );

      return null;
    }
  }, []);

  // Safely get the uploaded files, or use an empty array.
  const uploadedFiles = useMemo(() => {
    return Array.isArray(validationResult?.files)
      ? validationResult.files
      : [];
  }, [validationResult]);

  // Combine records from all uploaded CSV files into one array.
  const records = useMemo(() => {
    return uploadedFiles.flatMap((file) => {
      const fileRecords = Array.isArray(file.records)
        ? file.records
        : [];

      return fileRecords.map((record) => ({
        ...record,
        // Keep the source filename with every individual record.
        fileName: file.fileName,
      }));
    });
  }, [uploadedFiles]);

  // Calculate all totals and chart percentages from the real records.
  const summary = useMemo(() => {
    // A record is valid only when isValid is explicitly true.
    const validRecords = records.filter(
      (record) => record.isValid === true
    );

    const invalidRecords = records.filter(
      (record) => record.isValid !== true
    );

    const maleRecords = validRecords.filter(
      (record) => record.gender === "Male"
    );

    const femaleRecords = validRecords.filter(
      (record) => record.gender === "Female"
    );

    const totalRecords = records.length;

    // Avoid division by zero when the user has uploaded no records.
    const validPercentage =
      totalRecords > 0
        ? (validRecords.length / totalRecords) * 100
        : 0;

    const invalidPercentage =
      totalRecords > 0
        ? (invalidRecords.length / totalRecords) *
          100
        : 0;

    const malePercentage =
      validRecords.length > 0
        ? (maleRecords.length /
            validRecords.length) *
          100
        : 0;

    const femalePercentage =
      validRecords.length > 0
        ? (femaleRecords.length /
            validRecords.length) *
          100
        : 0;

    return {
      totalRecords,
      validRecords: validRecords.length,
      invalidRecords: invalidRecords.length,
      uploadedFiles: uploadedFiles.length,
      male: maleRecords.length,
      female: femaleRecords.length,
      validPercentage,
      invalidPercentage,
      malePercentage,
      femalePercentage,
    };
  }, [records, uploadedFiles]);

  // Show the 10 newest records, or all matching records during a search.
  const filteredRecords = useMemo(() => {
    // Ignore extra spaces and letter case in the search value.
    const searchValue = searchText
      .trim()
      .toLowerCase();

    // Copy before reversing so the original records array is not changed.
    const recentRecords = [...records]
      .reverse()
      .slice(0, 10);

    if (!searchValue) {
      return recentRecords;
    }

    // Match the typed value against any part of the NIC number.
    return records.filter((record) =>
      String(record.nic || "")
        .toLowerCase()
        .includes(searchValue)
    );
  }, [records, searchText]);

  // Display the logout overlay, clear stored data, and return to login.
  const handleLogout = () => {
    // Prevent multiple logout timers from being started.
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    window.setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Remove private validation data from the current browser session.
      sessionStorage.removeItem(
        "nicValidationResult"
      );

      navigate("/");
    }, 800);
  };

  return (
    <div className="dash-layout">
      {/* Main navigation sidebar for desktop and mobile screens. */}
      <aside
        className={`dash-sidebar ${
          sidebarOpen ? "dash-sidebar-open" : ""
        }`}
      >
        <div className="dash-logo">
          <div className="dash-logo-icon">N</div>

          <div>
            <h2>NIC System</h2>
            <p>Validation Portal</p>
          </div>
        </div>

        <nav className="dash-menu">
          <button
            type="button"
            className="dash-menu-item dash-active"
            onClick={() => navigate("/dashboard")}
          >
            <span>🏠</span>
            Dashboard
          </button>

          <button
            type="button"
            className="dash-menu-item"
            onClick={() => navigate("/upload")}
          >
            <span>📤</span>
            Upload CSV
          </button>

          <button
            type="button"
            className="dash-menu-item"
            onClick={() => navigate("/records")}
          >
            <span>📋</span>
            NIC Records
          </button>

          <button
            type="button"
            className="dash-menu-item"
            onClick={() => navigate("/reports")}
          >
            <span>📊</span>
            Reports
          </button>

        </nav>

        <button
          type="button"
          className="dash-logout-button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <span>🚪</span>
          Logout
        </button>
      </aside>

      {/* Cover the page with a loading message while logout finishes. */}
      {isLoggingOut && <LogoutOverlay />}

      {/* Clicking outside the mobile sidebar closes it. */}
      {sidebarOpen && (
        <div
          className="dash-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="dash-main">
        {/* Dashboard title and the currently logged-in user. */}
        <header className="dash-header">
          <div className="dash-header-left">
            <button
              type="button"
              className="dash-menu-toggle"
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
            >
              ☰
            </button>

            <div>
              <h1>Dashboard</h1>
              <p>NIC Validation System Overview</p>
            </div>
          </div>

          <div className="dash-user-section">
            <div className="dash-avatar">
              {user?.username
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>

            <div className="dash-user-info">
              <strong>
                {user?.username || "User"}
              </strong>

              <span>{user?.role || "user"}</span>
            </div>
          </div>
        </header>

        <main className="dash-content">
          {/* Welcome message and shortcut to upload new CSV files. */}
          <section className="dash-welcome">
            <div>
              <h2>
                Welcome back,{" "}
                {user?.username || "User"}!
              </h2>

              <p>
                Monitor NIC validation records and
                system activity.
              </p>
            </div>

            <button
              type="button"
              className="dash-primary-button"
              onClick={() => navigate("/upload")}
            >
              + Upload CSV
            </button>
          </section>

          {/* High-level totals calculated from the uploaded records. */}
          <section className="dash-stat-grid">
            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-blue">
                📄
              </div>

              <div>
                <p>Total Records</p>

                <h3>{summary.totalRecords}</h3>

                <span>All uploaded records</span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-green">
                ✅
              </div>

              <div>
                <p>Valid NICs</p>

                <h3>{summary.validRecords}</h3>

                <span>
                  {summary.validPercentage.toFixed(1)}%
                  validation rate
                </span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-red">
                ❌
              </div>

              <div>
                <p>Invalid NICs</p>

                <h3>{summary.invalidRecords}</h3>

                <span>
                  {summary.invalidPercentage.toFixed(1)}%
                  invalid records
                </span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-purple">
                📁
              </div>

              <div>
                <p>Uploaded Files</p>

                <h3>{summary.uploadedFiles}</h3>

                <span>Latest upload batch</span>
              </div>
            </div>
          </section>

          {/* Gender and validation-percentage visualizations. */}
          <section className="dash-chart-grid">
            <div className="dash-panel">
              <div className="dash-panel-heading">
                <div>
                  <h3>Gender Distribution</h3>
                  <p>
                    Validated NIC records by gender
                  </p>
                </div>
              </div>

              <div className="dash-bar-section">
                <div className="dash-bar-row">
                  <div className="dash-bar-label">
                    <span>Male</span>
                    <strong>{summary.male}</strong>
                  </div>

                  <div className="dash-bar-track">
                    {/* The percentage controls the length of the male bar. */}
                    <div
                      className="dash-bar-fill dash-male-bar"
                      style={{
                        width: `${summary.malePercentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="dash-bar-row">
                  <div className="dash-bar-label">
                    <span>Female</span>
                    <strong>{summary.female}</strong>
                  </div>

                  <div className="dash-bar-track">
                    {/* The percentage controls the length of the female bar. */}
                    <div
                      className="dash-bar-fill dash-female-bar"
                      style={{
                        width: `${summary.femalePercentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-panel">
              <div className="dash-panel-heading">
                <div>
                  <h3>Validation Status</h3>
                  <p>
                    Valid and invalid percentage
                  </p>
                </div>
              </div>

              <div className="dash-circle-area">
                {/* A conic gradient draws the valid/invalid circle chart. */}
                <div
                  className="dash-circle-chart"
                  style={{
                    background: `conic-gradient(
                      #22c55e 0 ${summary.validPercentage}%,
                      #ef4444 ${summary.validPercentage}% 100%
                    )`,
                  }}
                >
                  <div className="dash-circle-center">
                    <strong>
                      {summary.validPercentage.toFixed(1)}
                      %
                    </strong>

                    <span>Valid</span>
                  </div>
                </div>

                <div className="dash-chart-details">
                  <p>
                    <span className="dash-dot dash-valid-dot" />
                    Valid Records
                    <strong>
                      {summary.validRecords}
                    </strong>
                  </p>

                  <p>
                    <span className="dash-dot dash-invalid-dot" />
                    Invalid Records
                    <strong>
                      {summary.invalidRecords}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Recent records table with optional NIC-number searching. */}
          <section className="dash-panel">
            <div className="dash-table-header">
              <div>
                <h3>Recent NIC Records</h3>

                <p>
                  Recently processed NIC information
                </p>
              </div>

              <div className="dash-search">
                <span>🔍</span>

                <input
                  type="text"
                  placeholder="Search NIC..."
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>NIC Number</th>
                    <th>Birthday</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Display each recent record or search result as a row. */}
                  {filteredRecords.map(
                    (record, index) => (
                      <tr
                        key={`${record.fileName}-${record.rowNumber}-${index}`}
                      >
                        <td className="dash-nic-number">
                          {record.nic || "-"}
                        </td>

                        <td>
                          {record.dateOfBirth || "-"}
                        </td>

                        <td>{record.age ?? "-"}</td>

                        <td>
                          {record.gender || "-"}
                        </td>

                        <td>
                          <span
                            className={
                              record.isValid
                                ? "dash-status dash-status-valid"
                                : "dash-status dash-status-invalid"
                            }
                          >
                            {record.isValid
                              ? "Valid"
                              : "Invalid"}
                          </span>
                        </td>
                      </tr>
                    )
                  )}

                  {/* Show guidance when no records match the current view. */}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        className="dash-empty-message"
                        colSpan="5"
                      >
                        No validation records found.
                        Upload four CSV files first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
