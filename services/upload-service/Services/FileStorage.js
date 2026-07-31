const crypto = require("crypto");
const path = require("path");
const fs = require("fs/promises");

// Select the main upload folder.
// Production can provide UPLOAD_STORAGE_PATH; otherwise use local storage.
const uploadRoot = process.env.UPLOAD_STORAGE_PATH
  ? path.resolve(process.env.UPLOAD_STORAGE_PATH)
  : path.resolve(__dirname, "../storage/uploads");

// Convert an uploaded filename into a safe filename for server storage.
function createSafeFileName(originalName, index) {
  // Keep the original extension and normalize it to lowercase.
  const extension = path.extname(originalName).toLowerCase();

  // Remove the extension, replace unsafe characters, trim underscores,
  // and limit the name length to avoid filesystem problems.
  const baseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);

  // Add the file position so all four stored names remain distinguishable.
  return `${index + 1}-${baseName || "upload"}${extension}`;
}

// Save all uploaded file buffers into one unique batch directory.
async function saveFilesToServer(files) {
  // A timestamp and UUID prevent different uploads from sharing a folder.
  const storageBatch = `${Date.now()}-${crypto.randomUUID()}`;
  const batchDirectory = path.join(uploadRoot, storageBatch);

  // Create the upload folder and any missing parent folders.
  await fs.mkdir(batchDirectory, { recursive: true });

  try {
    // Save all files concurrently and collect their storage information.
    const storedFiles = await Promise.all(
      files.map(async (file, index) => {
        const storedName = createSafeFileName(
          file.originalname,
          index
        );
        const absolutePath = path.join(batchDirectory, storedName);

        // Write the in-memory upload buffer to disk.
        // The "wx" flag prevents accidentally overwriting an existing file.
        await fs.writeFile(absolutePath, file.buffer, {
          flag: "wx",
        });

        return {
          originalName: file.originalname,
          storedName,
          // Store a platform-independent path using forward slashes.
          relativePath: path
            .join("storage", "uploads", storageBatch, storedName)
            .replaceAll("\\", "/"),
          size: file.size,
        };
      })
    );

    // Return the information needed by the route and API response.
    return {
      storageBatch,
      batchDirectory,
      storedFiles,
    };
  } catch (error) {
    // Remove partially saved files if any file write fails.
    await fs.rm(batchDirectory, {
      recursive: true,
      force: true,
    });
    throw error;
  }
}

// Remove a previously stored batch, normally during error rollback.
async function removeStoredBatch(batchDirectory) {
  // Resolve both paths before checking that deletion stays under uploadRoot.
  const resolvedDirectory = path.resolve(batchDirectory);
  const resolvedRoot = path.resolve(uploadRoot);

  // Never delete the upload root itself or a directory outside that root.
  if (
    resolvedDirectory === resolvedRoot ||
    !resolvedDirectory.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error("Refusing to remove an unsafe upload path.");
  }

  // Delete the verified batch directory and all files inside it.
  await fs.rm(resolvedDirectory, {
    recursive: true,
    force: true,
  });
}

// Expose only the save and rollback operations to other backend modules.
module.exports = {
  saveFilesToServer,
  removeStoredBatch,
};
