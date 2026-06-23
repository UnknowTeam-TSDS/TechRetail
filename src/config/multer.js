const multer = require('multer');
const path = require('path');
const fs = require('fs');

const destino = path.join(__dirname, '../../public/uploads/productos');
if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, destino),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(null, false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
