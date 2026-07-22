import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Slidebar";
import DashboardTopbar from "../DashboardTopbar";


function NicRecords() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const storedResult = sessionStorage.getItem(
    "nicValidationResult"
  );

  const result = storedResult
    ? JSON.parse(storedResult)
    : null;

  const records = useMemo(() => {
    if (!result?.files) {
      return [];
    }

    return result.files.flatMap((file) =>
      file.records.map((record) => ({
        ...record,
        fileName: file.fileName,
      }))
    );
  }, [result]);

  const filteredRecords = useMemo(() => {
    switch (filter) {
      case "valid":
        return records.filter((record) => record.isValid);

      case "invalid":
        return records.filter((record) => !record.isValid);

      case "male":
        return records.filter(
          (record) => record.gender === "Male"
        );

      case "female":
        return records.filter(
          (record) => record.gender === "Female"
        );

      default:
        return records;
    }
  }, [records, filter]);

  if (!result) {
    return (
      <div className="dash-layout records-page">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {sidebarOpen && (
          <div
            className="dash-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="records-main records-empty-page">
          <DashboardTopbar />

          <button
            type="button"
            className="dash-menu-toggle records-empty-menu-toggle"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div>
            <h1>No validation results found</h1>
            <p>
              Upload and validate four CSV files before opening
              this page.
            </p>
            <button type="button" onClick={() => navigate("/upload")}>
              Go to Upload
            </button>
          </div>
        </main>
      </div>
    );
  }

  const summary = result.validation || {};

  return (
    <div className="dash-layout records-page">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="dash-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="records-main">
        <DashboardTopbar />

        <header className="records-header">
          <button
            type="button"
            className="dash-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div>
            <p>Dashboard / NIC Records</p>
            <h1>Validated NIC Records</h1>

            <span>
              Results from the four uploaded CSV files.
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/upload")}
          >
            Upload New Files
          </button>
        </header>

        <section className="records-summary">
          <div>
            <strong>{summary.totalRecords ?? 0}</strong>
            <span>Total Records</span>
          </div>

          <div>
            <strong>{summary.validRecords ?? 0}</strong>
            <span>Valid Records</span>
          </div>

          <div>
            <strong>{summary.invalidRecords ?? 0}</strong>
            <span>Invalid Records</span>
          </div>

          <div>
            <strong>{summary.male ?? 0}</strong>
            <span>Male</span>
          </div>

          <div>
            <strong>{summary.female ?? 0}</strong>
            <span>Female</span>
          </div>
        </section>

        <section className="records-table-card">
          <div className="records-table-header">
            <div>
              <h2>NIC Records</h2>

              <p>
                Showing {filteredRecords.length} of{" "}
                {records.length} records.
              </p>
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="all">All Records</option>
              <option value="valid">Valid Only</option>
              <option value="invalid">Invalid Only</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>

          <div className="records-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Row</th>
                  <th>NIC</th>
                  <th>Status</th>
                  <th>Format</th>
                  <th>Date of Birth</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Error</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr
                    key={`${record.fileName}-${record.rowNumber}-${index}`}
                  >
                    <td>{record.fileName}</td>
                    <td>{record.rowNumber}</td>
                    <td>{record.nic || "-"}</td>

                    <td>
                      <span
                        className={
                          record.isValid
                            ? "records-valid"
                            : "records-invalid"
                        }
                      >
                        {record.isValid
                          ? "Valid"
                          : "Invalid"}
                      </span>
                    </td>

                    <td>{record.format || "-"}</td>
                    <td>{record.dateOfBirth || "-"}</td>
                    <td>{record.age ?? "-"}</td>
                    <td>{record.gender || "-"}</td>
                    <td>{record.errorMessage || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default NicRecords;
