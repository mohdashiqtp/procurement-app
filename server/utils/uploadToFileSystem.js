const path = require('path');
const fs = require('fs').promises;

const uploadToFileSystem = async (file) => {
  const filename = `${Date.now()}-${file.originalname}`;
  const uploadPath = path.join(__dirname, '../uploads', filename);
  
  await fs.mkdir(path.join(__dirname, '../uploads'), { recursive: true });
  
  await fs.writeFile(uploadPath, file.buffer);
  
  return {
    filename,
    path: uploadPath
  };
};

module.exports = uploadToFileSystem;
