import fs from 'fs';
import multer from "multer";
import __dirname from './utils.js';

const uploadDir = __dirname + '/public/img';

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});

export const uploader = multer({ storage });

