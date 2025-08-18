// server/utils/fileUtils.js
const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file: ${filePath}`, error);
  }
};

const getFullPath = (filename) => {
  return path.join(__dirname, '../uploads/posters', filename);
};

module.exports = { deleteFile, getFullPath };