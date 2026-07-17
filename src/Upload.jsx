import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const MAX_FILES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const validateFile = (file) => {
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".csv")) {
      return `${file.name} is not a CSV file.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is larger than 5 MB.`;
    }

    return null;
  };

  const addFiles = (selectedFiles) => {
    setMessage("");
    setUploadResult(null);

    const incomingFiles = Array.from(selectedFiles);

    if (incomingFiles.length === 0) {
      return;
    }

    const combinedFiles = [...files];

    for (const file of incomingFiles) {
      const validationError = validateFile(file);

      if (validationError) {
        showMessage(validationError);
        continue;
      }

      const isDuplicate = combinedFiles.some(
        (existingFile) =>
          existingFile.name === file.name &&
          existingFile.size === file.size
      );

      if (isDuplicate) {
        showMessage(`${file.name} has already been selected.`);
        continue;
      }

      if (combinedFiles.length >= MAX_FILES) {
        showMessage("You can upload exactly four CSV files only.");
        break;
      }

      combinedFiles.push(file);
    }

    setFiles(combinedFiles);

    if (combinedFiles.length === MAX_FILES) {
      showMessage(
        "Four CSV files selected. You can now upload them.",
        "success"
      );
    }
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);

    // Allows selecting the same file again after removing it.
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove("upload-drop-zone-active");

    addFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add("upload-drop-zone-active");
  };

  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove("upload-drop-zone-active");
  };

  const removeFile = (indexToRemove) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );

    setMessage("");
    setUploadResult(null);
  };

  const clearFiles = () => {
    setFiles([]);
    setMessage("");
    setMessageType("");
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (files.length !== MAX_FILES) {
      showMessage("Please select exactly four CSV files.");
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const token = localStorage.getItem("token");

    try {
      setIsUploading(true);
      setMessage("");
      setUploadResult(null);

      const response = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "CSV upload failed.");
      }

      setUploadResult(data);

// Save results so the NIC Records page can read them.
sessionStorage.setItem(
  "nicValidationResult",
  JSON.stringify(data)
);

showMessage(
  data.message ||
    "Four CSV files uploaded and validated successfully.",
  "success"
);

// Open the NIC Records page.
navigate("/records");
    } catch (error) {
      console.error("Upload error:", error);

      showMessage(
        error.message ||
          "Unable to connect to the Upload Service."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} bytes`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="upload-page">
      <aside className="upload-sidebar">
        <div className="upload-logo">
          <div className="upload-logo-icon">NIC</div>

          <div>
            <h2>NIC Validation</h2>
            <p>Microservices System</p>
          </div>
        </div>

        <nav className="upload-navigation">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            type="button"
            className="active"
            onClick={() => navigate("/upload")}
          >
            <span>⇧</span>
            Upload CSV
          </button>

            <button
       type="button"
      onClick={() => navigate("/records")}
>
  <span>✓</span>
  NIC Records
       </button>

          <button
  type="button"
  onClick={() => navigate("/reports")}
>
  <span>▤</span>
  Reports
</button>
        </nav>

        <button
          type="button"
          className="upload-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      <main className="upload-main">
        <header className="upload-header">
          <div>
            <p className="upload-breadcrumb">
              Dashboard / Upload CSV
            </p>

            <h1>Upload NIC CSV Files</h1>

            <p>
              Select exactly four CSV files. All four files will
              be uploaded and processed together.
            </p>
          </div>

          <div className="upload-file-counter">
            <strong>{files.length}</strong>
            <span>of 4 files</span>
          </div>
        </header>

        <section className="upload-card">
          <div className="upload-requirements">
            <div>
              <span className="requirement-number">4</span>

              <div>
                <strong>Exactly four files</strong>
                <p>Fewer or more files will not be accepted.</p>
              </div>
            </div>

            <div>
              <span className="requirement-number">CSV</span>

              <div>
                <strong>CSV format only</strong>
                <p>Each file must contain an NIC column.</p>
              </div>
            </div>

            <div>
              <span className="requirement-number">5MB</span>

              <div>
                <strong>Maximum file size</strong>
                <p>Each CSV file must be 5 MB or smaller.</p>
              </div>
            </div>
          </div>

          <div
            className="upload-drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-cloud-icon">⇧</div>

            <h2>Drag and drop CSV files here</h2>

            <p>
              You can select all four files together or add them
              one at a time.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={handleFileChange}
              hidden
            />

            <button
              type="button"
              className="upload-browse-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES || isUploading}
            >
              Browse CSV Files
            </button>
          </div>

          {message && (
            <div
              className={`upload-message upload-message-${messageType}`}
            >
              {message}
            </div>
          )}

          <div className="upload-selected-header">
            <div>
              <h3>Selected Files</h3>
              <p>
                All four file positions must be completed before
                uploading.
              </p>
            </div>

            {files.length > 0 && (
              <button
                type="button"
                className="upload-clear-button"
                onClick={clearFiles}
                disabled={isUploading}
              >
                Clear all
              </button>
            )}
          </div>

          <div className="upload-file-list">
            {Array.from({ length: MAX_FILES }).map((_, index) => {
              const file = files[index];

              return (
                <div
                  className={`upload-file-item ${
                    file ? "upload-file-item-complete" : ""
                  }`}
                  key={`file-position-${index}`}
                >
                  <div className="upload-file-position">
                    {index + 1}
                  </div>

                  {file ? (
                    <>
                      <div className="upload-file-icon">CSV</div>

                      <div className="upload-file-information">
                        <strong>{file.name}</strong>
                        <span>{formatFileSize(file.size)}</span>
                      </div>

                      <span className="upload-file-status">
                        Ready
                      </span>

                      <button
                        type="button"
                        className="upload-remove-button"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                        aria-label={`Remove ${file.name}`}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="upload-empty-file">
                      <strong>CSV file {index + 1}</strong>
                      <span>No file selected</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="upload-actions">
            <button
              type="button"
              className="upload-cancel-button"
              onClick={() => navigate("/dashboard")}
              disabled={isUploading}
            >
              Cancel
            </button>

            <button
              type="button"
              className="upload-submit-button"
              onClick={handleUpload}
              disabled={
                files.length !== MAX_FILES || isUploading
              }
            >
              {isUploading
                ? "Uploading four files..."
                : "Upload and Process Files"}
            </button>
          </div>
        </section>

        {uploadResult && (
          <section className="upload-result-card">
            <div className="upload-result-icon">✓</div>

            <div>
              <h2>Upload completed successfully</h2>

              <p>
                The Upload Service accepted all four CSV files.
              </p>
            </div>

            <div className="upload-result-stats">
              <div>
                <strong>
                  {uploadResult.totalFiles ?? files.length}
                </strong>
                <span>Files</span>
              </div>

              <div>
                <strong>
                  {uploadResult.totalRecords ?? 0}
                </strong>
                <span>Records</span>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Upload;