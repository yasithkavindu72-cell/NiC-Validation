import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Slidebar";
import DashboardTopbar from "../DashboardTopbar";


function NicRecords() {
  // React Router navigation and page UI state.
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  // Read the latest NIC validation response saved by the upload page.
  const storedResult = sessionStorage.getItem(
    "nicValidationResult"
  );

  // Convert the stored JSON text back into an object.
  // Use null when the user has not completed a validation yet.
  const result = storedResult
    ? JSON.parse(storedResult)
    : null;

  // Combine records from every uploaded file into one table-ready array.
  // This is recalculated only when the validation result changes.
  const records = useMemo(() => {
    // Return an empty list safely when the response has no files.
    if (!result?.files) {
      return [];
    }

    return result.files.flatMap((file) =>
      file.records.map((record) => ({
        ...record,
        // Keep the source filename so it can be displayed in the table.
        fileName: file.fileName,
      }))
    );
  }, [result]);

  // Create the visible record list from the selected dropdown filter.
  const filteredRecords = useMemo(() => {
    switch (filter) {
      case "valid":
        // Show records that passed NIC validation.
        return records.filter((record) => record.isValid);

      case "invalid":
        // Show records that failed NIC validation.
        return records.filter((record) => !record.isValid);

      case "male":
        // Show only records identified as male.
        return records.filter(
          (record) => record.gender === "Male"
        );

      case "female":
        // Show only records identified as female.
        return records.filter(
          (record) => record.gender === "Female"
        );

      default:
        // "all" displays every record without filtering.
        return records;
    }
  }, [records, filter]);
  // Show an empty state when no validation result is stored.
  if (!result) {
    return (
      <div className="dash-layout records-page">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Close the mobile sidebar when the overlay is clicked. */}
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
          {/* Explain why there are no records and guide the user to Upload. */}
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

  // Use an empty object as a safe fallback for missing summary values.
  const summary = result.validation || {};

  return (
    <div className="dash-layout records-page">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Close the mobile sidebar when the overlay is clicked. */}
      {sidebarOpen && (
        <div
          className="dash-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="records-main">
        <DashboardTopbar />

        {/* Page title, mobile menu control, and new-upload action. */}
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

        {/* Display the validation totals returned by the backend. */}
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

        {/* Filter control and detailed NIC record table. */}
        <section className="records-table-card">
          <div className="records-table-header">
            <div>
              <h2>NIC Records</h2>

              <p>
                Showing {filteredRecords.length} of{" "}
                {records.length} records.
              </p>
            </div>

            {/* Changing this value updates the visible record list. */}
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
                {/* Render one row for each record that matches the filter. */}
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
