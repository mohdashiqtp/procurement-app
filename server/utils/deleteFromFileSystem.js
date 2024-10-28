const path = require('path');
const fs = require('fs').promises;

const deleteFromFileSystem = async (filename) => {
  const filePath = path.join(__dirname, '../uploads', filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error);
    throw error;
  }
};

module.exports = deleteFromFileSystem;
