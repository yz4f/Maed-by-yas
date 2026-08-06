import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UPLOADS_DIR } from '../db';

// Configure storage with UUID filenames to prevent overwrite and directory traversal attacks
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter to block dangerous executables or unwanted files if needed
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  // We allow general archive and software files (.zip, .rar, .exe, .dll, .txt, .pdf, etc.)
  // Block potentially dangerous web script extensions to prevent web server execution
  const blockedExtensions = ['.php', '.js', '.html', '.htm', '.sh', '.bat', '.cmd', '.vbs', '.ps1'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (blockedExtensions.includes(ext)) {
    return cb(new Error('هذا النوع من الملفات محظور أمنياً لأسباب تتعلق بحماية الخادم'));
  }
  
  cb(null, true);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max file size
  }
});
