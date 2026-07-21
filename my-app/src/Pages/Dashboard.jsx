import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import LogoutOverlay from "../LogoutOverlay";

function Dashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [navigate, user]);

  /*
   * Read the latest upload and validation result.
   */
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

  /*
   * Get the four uploaded files.
   */
  const uploadedFiles = useMemo(() => {
    return Array.isArray(validationResult?.files)
      ? validationResult.files
      : [];
  }, [validationResult]);

  /*
   * Combine all records from all four CSV files.
   */
  const records = useMemo(() => {
    return uploadedFiles.flatMap((file) => {
      const fileRecords = Array.isArray(file.records)
        ? file.records
        : [];

      return fileRecords.map((record) => ({
        ...record,
        fileName: file.fileName,
      }));
    });
  }, [uploadedFiles]);

  /*
   * Calculate dashboard totals from real records.
   */
  const summary = useMemo(() => {
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

  /*
   * Search and display recent NIC records.
   */
  const filteredRecords = useMemo(() => {
    const searchValue = searchText
      .trim()
      .toLowerCase();

    const recentRecords = [...records]
      .reverse()
      .slice(0, 10);

    if (!searchValue) {
      return recentRecords;
    }

    return records.filter((record) =>
      String(record.nic || "")
        .toLowerCase()
        .includes(searchValue)
    );
  }, [records, searchText]);

  const handleLogout = () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    window.setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      sessionStorage.removeItem(
        "nicValidationResult"
      );

      navigate("/");
    }, 800);
  };

  return (
    <div className="dash-layout">
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

      {isLoggingOut && <LogoutOverlay />}

      {sidebarOpen && (
        <div
          className="dash-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="dash-main">
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
