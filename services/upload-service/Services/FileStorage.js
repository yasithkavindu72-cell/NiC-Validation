const crypto = require("crypto");
const path = require("path");
const fs = require("fs/promises");

const uploadRoot = process.env.UPLOAD_STORAGE_PATH
  ? path.resolve(process.env.UPLOAD_STORAGE_PATH)
  : path.resolve(__dirname, "../storage/uploads");

function createSafeFileName(originalName, index) {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);

  return `${index + 1}-${baseName || "upload"}${extension}`;
}

async function saveFilesToServer(files) {
  const storageBatch = `${Date.now()}-${crypto.randomUUID()}`;
  const batchDirectory = path.join(uploadRoot, storageBatch);

  await fs.mkdir(batchDirectory, { recursive: true });

  try {
    const storedFiles = await Promise.all(
      files.map(async (file, index) => {
        const storedName = createSafeFileName(
          file.originalname,
          index
        );
        const absolutePath = path.join(batchDirectory, storedName);

        await fs.writeFile(absolutePath, file.buffer, {
          flag: "wx",
        });

        return {
          originalName: file.originalname,
          storedName,
          relativePath: path
            .join("storage", "uploads", storageBatch, storedName)
            .replaceAll("\\", "/"),
          size: file.size,
        };
      })
    );

    return {
      storageBatch,
      batchDirectory,
      storedFiles,
    };
  } catch (error) {
    await fs.rm(batchDirectory, {
      recursive: true,
      force: true,
    });
    throw error;
  }
}

async function removeStoredBatch(batchDirectory) {
  const resolvedDirectory = path.resolve(batchDirectory);
  const resolvedRoot = path.resolve(uploadRoot);

  if (
    resolvedDirectory === resolvedRoot ||
    !resolvedDirectory.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error("Refusing to remove an unsafe upload path.");
  }

  await fs.rm(resolvedDirectory, {
    recursive: true,
    force: true,
  });
}

module.exports = {
  saveFilesToServer,
  removeStoredBatch,
};
