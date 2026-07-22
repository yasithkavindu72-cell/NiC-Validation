import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from "./Slidebar";



function Reports() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState("all");
  const [message, setMessage] = useState("");

  const validationResult = useMemo(() => {
    try {
      const storedResult = sessionStorage.getItem(
        "nicValidationResult"
      );

      return storedResult
        ? JSON.parse(storedResult)
        : null;
    } catch (error) {
      console.error("Cannot read validation results:", error);
      return null;
    }
  }, []);

  const allRecords = useMemo(() => {
    if (!validationResult?.files) {
      return [];
    }

    return validationResult.files.flatMap((file) =>
      (file.records || []).map((record) => ({
        ...record,
        fileName: file.fileName,
      }))
    );
  }, [validationResult]);

  const fileNames = useMemo(() => {
    if (!validationResult?.files) {
      return [];
    }

    return validationResult.files.map(
      (file) => file.fileName
    );
  }, [validationResult]);

  const filteredRecords = useMemo(() => {
    if (selectedFile === "all") {
      return allRecords;
    }

    return allRecords.filter(
      (record) => record.fileName === selectedFile
    );
  }, [allRecords, selectedFile]);

  const summary = useMemo(() => {
    return {
      totalRecords: filteredRecords.length,

      validRecords: filteredRecords.filter(
        (record) => record.isValid
      ).length,

      invalidRecords: filteredRecords.filter(
        (record) => !record.isValid
      ).length,

      male: filteredRecords.filter(
        (record) => record.gender === "Male"
      ).length,

      female: filteredRecords.filter(
        (record) => record.gender === "Female"
      ).length,
    };
  }, [filteredRecords]);

  const getExportRows = () => {
    return filteredRecords.map((record) => ({
      File: record.fileName,
      Row: record.rowNumber,
      NIC: record.nic || "",
      Status: record.isValid ? "Valid" : "Invalid",
      Format: record.format || "",
      "Date of Birth": record.dateOfBirth || "",
      Age: record.age ?? "",
      Gender: record.gender || "",
      Error: record.errorMessage || "",
    }));
  };

  const createFileName = (extension) => {
    const date = new Date()
      .toISOString()
      .substring(0, 10);

    const filePart =
      selectedFile === "all"
        ? "all-files"
        : selectedFile.replace(".csv", "");

    return `nic-validation-${filePart}-${date}.${extension}`;
  };

  const downloadCsv = () => {
    const rows = getExportRows();

    if (rows.length === 0) {
      setMessage("There are no records to export.");
      return;
    }

    const headers = Object.keys(rows[0]);

    const escapeCsvValue = (value) => {
      return `"${String(value ?? "").replace(
        /"/g,
        '""'
      )}"`;
    };

    const csvRows = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            escapeCsvValue(row[header])
          )
          .join(",")
      ),
    ];

    const csvContent = `\uFEFF${csvRows.join(
      "\r\n"
    )}`;

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const downloadUrl =
      URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = createFileName("csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(downloadUrl);

    setMessage("CSV report downloaded successfully.");
  };

  const downloadExcel = () => {
    const rows = getExportRows();

    if (rows.length === 0) {
      setMessage("There are no records to export.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      ["NIC Validation Report"],
      ["Generated", new Date().toLocaleString()],
      [
        "Selected File",
        selectedFile === "all"
          ? "All CSV Files"
          : selectedFile,
      ],
      [],
      ["Total Records", summary.totalRecords],
      ["Valid Records", summary.validRecords],
      ["Invalid Records", summary.invalidRecords],
      ["Male", summary.male],
      ["Female", summary.female],
    ];

    const summarySheet =
      XLSX.utils.aoa_to_sheet(summaryData);

    const recordsSheet =
      XLSX.utils.json_to_sheet(rows);

    recordsSheet["!cols"] = [
      { wch: 22 },
      { wch: 8 },
      { wch: 18 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 },
      { wch: 8 },
      { wch: 12 },
      { wch: 45 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      recordsSheet,
      "NIC Records"
    );

    XLSX.writeFile(
      workbook,
      createFileName("xlsx")
    );

    setMessage("Excel report downloaded successfully.");
  };

  const downloadPdf = () => {
    const rows = getExportRows();

    if (rows.length === 0) {
      setMessage("There are no records to export.");
      return;
    }

    const document = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    document.setFontSize(17);
    document.text(
      "NIC Validation Report",
      14,
      15
    );

    document.setFontSize(9);

    document.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      22
    );

    document.text(
      `File: ${
        selectedFile === "all"
          ? "All CSV Files"
          : selectedFile
      }`,
      14,
      28
    );

    document.text(
      `Total: ${summary.totalRecords}   Valid: ${summary.validRecords}   Invalid: ${summary.invalidRecords}   Male: ${summary.male}   Female: ${summary.female}`,
      14,
      34
    );

    autoTable(document, {
      startY: 40,

      head: [
        [
          "File",
          "Row",
          "NIC",
          "Status",
          "Format",
          "Birthday",
          "Age",
          "Gender",
          "Error",
        ],
      ],

      body: rows.map((row) => [
        row.File,
        row.Row,
        row.NIC,
        row.Status,
        row.Format,
        row["Date of Birth"],
        row.Age,
        row.Gender,
        row.Error,
      ]),

      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
      },

      headStyles: {
        fontStyle: "bold",
      },

      margin: {
        left: 8,
        right: 8,
      },

      horizontalPageBreak: true,
      horizontalPageBreakRepeat: [0, 2],
    });

    document.save(createFileName("pdf"));

    setMessage("PDF report downloaded successfully.");
  };

  if (!validationResult) {
    return (
      <div className="dash-layout reports-page">
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

        <main className="reports-main reports-empty-page">
          <button
            type="button"
            className="dash-menu-toggle reports-empty-menu-toggle"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div>
            <h1>No report data found</h1>
            <p>
              Upload and validate four CSV files before
              generating reports.
            </p>
            <button type="button" onClick={() => navigate("/upload")}>
              Go to Upload
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-layout reports-page">
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

      <main className="reports-main">
        <header className="reports-header">
          <button
            type="button"
            className="dash-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div>
            <p>Dashboard / Reports</p>
            <h1>NIC Validation Reports</h1>

            <span>
              Download validation results as CSV,
              Excel or PDF.
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/upload")}
          >
            Upload New Files
          </button>
        </header>

        <section className="reports-filter-card">
          <div>
            <label htmlFor="report-file">
              Select report data
            </label>

            <select
              id="report-file"
              value={selectedFile}
              onChange={(event) => {
                setSelectedFile(event.target.value);
                setMessage("");
              }}
            >
              <option value="all">
                All four CSV files
              </option>

              {fileNames.map((fileName) => (
                <option
                  value={fileName}
                  key={fileName}
                >
                  {fileName}
                </option>
              ))}
            </select>
          </div>

          <span>
            {filteredRecords.length} records selected
          </span>
        </section>

        <section className="reports-summary">
          <div>
            <strong>{summary.totalRecords}</strong>
            <span>Total Records</span>
          </div>

          <div>
            <strong>{summary.validRecords}</strong>
            <span>Valid</span>
          </div>

          <div>
            <strong>{summary.invalidRecords}</strong>
            <span>Invalid</span>
          </div>

          <div>
            <strong>{summary.male}</strong>
            <span>Male</span>
          </div>

          <div>
            <strong>{summary.female}</strong>
            <span>Female</span>
          </div>
        </section>

        <section className="reports-downloads">
          <article>
            <div className="reports-format-icon">
              CSV
            </div>

            <h2>CSV Report</h2>

            <p>
              Download the records in a simple
              comma-separated format.
            </p>

            <button
              type="button"
              onClick={downloadCsv}
            >
              Download CSV
            </button>
          </article>

          <article>
            <div className="reports-format-icon">
              XLSX
            </div>

            <h2>Excel Report</h2>

            <p>
              Download a workbook containing summary
              and NIC record sheets.
            </p>

            <button
              type="button"
              onClick={downloadExcel}
            >
              Download Excel
            </button>
          </article>

          <article>
            <div className="reports-format-icon">
              PDF
            </div>

            <h2>PDF Report</h2>

            <p>
              Download a printable validation summary
              and records table.
            </p>

            <button
              type="button"
              onClick={downloadPdf}
            >
              Download PDF
            </button>
          </article>
        </section>

        {message && (
          <div className="reports-message">
            {message}
          </div>
        )}

        <section className="reports-preview">
          <div>
            <h2>Report Preview</h2>

            <p>
              Showing {filteredRecords.length} records.
            </p>
          </div>

          <div className="reports-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Row</th>
                  <th>NIC</th>
                  <th>Status</th>
                  <th>Birthday</th>
                  <th>Age</th>
                  <th>Gender</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map(
                  (record, index) => (
                    <tr
                      key={`${record.fileName}-${record.rowNumber}-${index}`}
                    >
                      <td>{record.fileName}</td>
                      <td>{record.rowNumber}</td>
                      <td>{record.nic || "-"}</td>

                      <td>
                        {record.isValid
                          ? "Valid"
                          : "Invalid"}
                      </td>

                      <td>
                        {record.dateOfBirth || "-"}
                      </td>

                      <td>{record.age ?? "-"}</td>
                      <td>{record.gender || "-"}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Reports;
