// multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure upload folders exist
const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
ensureDir(path.join(__dirname, 'uploads', 'records'));
ensureDir(path.join(__dirname, 'uploads', 'profile'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // store records files under uploads/records, profile images under uploads/profile (fieldname)
    if (file.fieldname === 'profile') {
      cb(null, path.join(__dirname, 'uploads', 'profile'));
    } else {
      cb(null, path.join(__dirname, 'uploads', 'records'));
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  // accept most document and image types
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
