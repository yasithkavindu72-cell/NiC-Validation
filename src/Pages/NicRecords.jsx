import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


function NicRecords() {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("nicValidationResult");
    navigate("/");
  };

  if (!result) {
    return (
      <div className="records-empty-page">
        <h1>No validation results found</h1>

        <p>
          Upload and validate four CSV files before opening
          this page.
        </p>

        <button
          type="button"
          onClick={() => navigate("/upload")}
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const summary = result.validation || {};

  return (
    <div className="records-page">
      <aside className="records-sidebar">
        <div className="records-logo">
          <strong>NIC</strong>

          <div>
            <h2>NIC Validation</h2>
            <p>Microservices System</p>
          </div>
        </div>

        <nav>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/upload")}
          >
            Upload CSV
          </button>

          <button type="button" className="active">
            NIC Records
          </button>

          <button type="button" disabled>
            Reports
          </button>
        </nav>

        <button
          type="button"
          className="records-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      <main className="records-main">
        <header className="records-header">
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