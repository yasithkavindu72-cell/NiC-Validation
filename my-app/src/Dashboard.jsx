import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [user, setUser] = useState(null);

  const records = [
    {
      id: 1,
      nic: "991234567V",
      birthday: "1999-05-03",
      age: 27,
      gender: "Male",
      status: "Valid",
    },
    {
      id: 2,
      nic: "200056789123",
      birthday: "2000-04-20",
      age: 26,
      gender: "Female",
      status: "Valid",
    },
    {
      id: 3,
      nic: "882345678V",
      birthday: "-",
      age: "-",
      gender: "-",
      status: "Invalid",
    },
    {
      id: 4,
      nic: "951234567V",
      birthday: "1995-04-18",
      age: 31,
      gender: "Male",
      status: "Valid",
    },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredRecords = records.filter((record) =>
    record.nic.toLowerCase().includes(searchText.toLowerCase())
  );

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
          <button className="dash-menu-item dash-active">
            <span>🏠</span>
            Dashboard
          </button>

          <button
            className="dash-menu-item"
            onClick={() => navigate("/upload")}
          >
            <span>📤</span>
            Upload CSV
          </button>

          <button className="dash-menu-item">
            <span>📋</span>
            NIC Records
          </button>

          <button className="dash-menu-item">
            <span>📊</span>
            Reports
          </button>

          <button className="dash-menu-item">
            <span>⚙️</span>
            Settings
          </button>
        </nav>

        <button
          className="dash-logout-button"
          onClick={handleLogout}
        >
          <span>🚪</span>
          Logout
        </button>
      </aside>

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
              className="dash-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
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
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="dash-user-info">
              <strong>{user?.username || "User"}</strong>
              <span>{user?.role || "user"}</span>
            </div>
          </div>
        </header>

        <main className="dash-content">
          <section className="dash-welcome">
            <div>
              <h2>
                Welcome back, {user?.username || "User"}!
              </h2>

              <p>
                Monitor NIC validation records and system activity.
              </p>
            </div>

            <button
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
                <h3>1,250</h3>
                <span>All uploaded records</span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-green">
                ✅
              </div>

              <div>
                <p>Valid NICs</p>
                <h3>1,190</h3>
                <span>95.2% validation rate</span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-red">
                ❌
              </div>

              <div>
                <p>Invalid NICs</p>
                <h3>60</h3>
                <span>4.8% invalid records</span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-icon dash-purple">
                📁
              </div>

              <div>
                <p>Uploaded Files</p>
                <h3>48</h3>
                <span>8 files uploaded today</span>
              </div>
            </div>
          </section>

          <section className="dash-chart-grid">
            <div className="dash-panel">
              <div className="dash-panel-heading">
                <div>
                  <h3>Gender Distribution</h3>
                  <p>Validated NIC records by gender</p>
                </div>
              </div>

              <div className="dash-bar-section">
                <div className="dash-bar-row">
                  <div className="dash-bar-label">
                    <span>Male</span>
                    <strong>650</strong>
                  </div>

                  <div className="dash-bar-track">
                    <div className="dash-bar-fill dash-male-bar" />
                  </div>
                </div>

                <div className="dash-bar-row">
                  <div className="dash-bar-label">
                    <span>Female</span>
                    <strong>540</strong>
                  </div>

                  <div className="dash-bar-track">
                    <div className="dash-bar-fill dash-female-bar" />
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-panel">
              <div className="dash-panel-heading">
                <div>
                  <h3>Validation Status</h3>
                  <p>Valid and invalid percentage</p>
                </div>
              </div>

              <div className="dash-circle-area">
                <div className="dash-circle-chart">
                  <div className="dash-circle-center">
                    <strong>95.2%</strong>
                    <span>Valid</span>
                  </div>
                </div>

                <div className="dash-chart-details">
                  <p>
                    <span className="dash-dot dash-valid-dot" />
                    Valid Records
                    <strong>1,190</strong>
                  </p>

                  <p>
                    <span className="dash-dot dash-invalid-dot" />
                    Invalid Records
                    <strong>60</strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="dash-panel">
            <div className="dash-table-header">
              <div>
                <h3>Recent NIC Records</h3>
                <p>Recently processed NIC information</p>
              </div>

              <div className="dash-search">
                <span>🔍</span>

                <input
                  type="text"
                  placeholder="Search NIC..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
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
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="dash-nic-number">
                        {record.nic}
                      </td>

                      <td>{record.birthday}</td>
                      <td>{record.age}</td>
                      <td>{record.gender}</td>

                      <td>
                        <span
                          className={
                            record.status === "Valid"
                              ? "dash-status dash-status-valid"
                              : "dash-status dash-status-invalid"
                          }
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        className="dash-empty-message"
                        colSpan="5"
                      >
                        No NIC records found.
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