import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Pages/Slidebar";
import DashboardTopbar from "./DashboardTopbar";

// Backend API Gateway address used by the frontend upload request.
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Rules used to validate files before sending them to the backend.
const MAX_FILES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// The shared Sidebar replaces the older Upload-only sidebar.
const shouldRenderOldUploadSidebar = false;

function Upload() {
  // Navigation helper and reference to the hidden file input.
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State for the sidebar, selected files, messages, and upload result.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Show a success or error message in the upload page.
  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  // Check that a selected file is CSV format and no larger than 5 MB.
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

  // Add valid, non-duplicate files until all four positions are filled.
  const addFiles = (selectedFiles) => {
    // Clear results from the previous file selection or upload.
    setMessage("");
    setUploadResult(null);

    const incomingFiles = Array.from(selectedFiles);

    if (incomingFiles.length === 0) {
      return;
    }

    const combinedFiles = [...files];

    for (const file of incomingFiles) {
      // Skip this file when its format or size is invalid.
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

      // Treat matching filename and size as the same selected file.
      if (isDuplicate) {
        showMessage("You have uploaded duplicate files.");
        continue;
      }

      if (combinedFiles.length >= MAX_FILES) {
        showMessage("You can upload exactly four CSV files only.");
        break;
      }

      combinedFiles.push(file);
    }

    // Save the final checked list in React state.
    setFiles(combinedFiles);

    if (combinedFiles.length === MAX_FILES) {
      showMessage(
        "Four CSV files selected. You can now upload them.",
        "success"
      );
    }
  };

  // Process files selected with the browser's file picker.
  const handleFileChange = (event) => {
    addFiles(event.target.files);

    // Allows selecting the same file again after removing it.
    event.target.value = "";
  };

  // Process files dropped into the drag-and-drop area.
  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove("upload-drop-zone-active");

    addFiles(event.dataTransfer.files);
  };

  // Highlight the drop area while files are dragged over it.
  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add("upload-drop-zone-active");
  };

  // Remove the highlight when dragged files leave the drop area.
  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove("upload-drop-zone-active");
  };

  // Remove one file from its selected position.
  const removeFile = (indexToRemove) => {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );

    setMessage("");
    setUploadResult(null);
  };

  // Remove every selected file and reset page feedback.
  const clearFiles = () => {
    setFiles([]);
    setMessage("");
    setMessageType("");
    setUploadResult(null);
  };

  // Send the four CSV files from the frontend to the backend.
  const handleUpload = async () => {
    // Stop before the API request if four files are not selected.
    if (files.length !== MAX_FILES) {
      showMessage("Please select exactly four CSV files.");
      return;
    }

    // FormData sends the actual files as multipart/form-data.
    const formData = new FormData();

    files.forEach((file) => {
      // "files" must match upload.array("files", 4) in the backend.
      formData.append("files", file);
    });

    // Read the authentication token saved after login.
    const token = localStorage.getItem("token");

    try {
      setIsUploading(true);
      setMessage("");
      setUploadResult(null);

      // POST the file data to the API Gateway /uploads endpoint.
      const response = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
        body: formData,
      });

      const responseText = await response.text();
      let data;

      // Convert the backend JSON response text into a JavaScript object.
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The Upload Service returned an invalid response."
        );
      }

      // Turn a backend 4xx or 5xx response into a frontend error.
      if (!response.ok) {
        throw new Error(data.message || "CSV upload failed.");
      }

      setUploadResult(data);

      // Save results for Dashboard, NIC Records, and Reports pages.
      sessionStorage.setItem(
        "nicValidationResult",
        JSON.stringify(data)
      );

      // Show the success message returned by the backend.
      showMessage(
        data.message ||
          "Four CSV files uploaded and validated successfully.",
        "success"
      );

      // Open NIC Records after the backend finishes successfully.
      navigate("/records");
    } catch (error) {
      // Handle connection errors and error messages from the backend.
      console.error("Upload error:", error);

      showMessage(
        error instanceof TypeError
          ? "You have uploaded duplicate files."
          : error.message || "CSV upload failed."
      );
    } finally {
      // Re-enable upload controls whether the request succeeds or fails.
      setIsUploading(false);
    }
  };

  // Clear login data and return the user to the login page.
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Convert a byte value into a readable bytes, KB, or MB label.
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
    <div className="dash-layout upload-page">
      {/* Shared navigation sidebar. */}
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

      {/* Old sidebar is kept in code but is currently disabled. */}
      {shouldRenderOldUploadSidebar && (
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
      )}

      <main className="upload-main">
        <DashboardTopbar />

        {/* Page heading, mobile menu, and selected-file counter. */}
        <header className="upload-header">
          <button
            type="button"
            className="dash-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

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

        {/* Main card containing requirements and upload controls. */}
        <section className="upload-card">
          {/* Explain the file count, format, and size rules. */}
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

          {/* Accept files by drag-and-drop or the hidden file input. */}
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

          {/* Display frontend validation or backend response messages. */}
          {message && (
            <div
              className={`upload-message upload-message-${messageType}`}
            >
              {message}
            </div>
          )}

          {/* Selected-file heading and clear-all control. */}
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

          {/* Render four positions so missing files are easy to see. */}
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

                  {/* Show file details or an empty-position message. */}
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

          {/* Cancel the operation or send all files to the backend. */}
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

        {/* Display totals returned after a successful backend request. */}
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
