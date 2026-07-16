const express = require('express');
const multer = require('multer');
const { getTerminals, getRevisions, uploadBook, assistantQuery } = require('../controllers/terminalController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos.'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit for 117-page PDF
  }
});

router.get('/', authenticateToken, getTerminals);
router.get('/revisions', authenticateToken, getRevisions);
router.post('/upload', authenticateToken, authorizeRoles('Admin'), upload.single('bookFile'), uploadBook);
router.post('/assistant', authenticateToken, assistantQuery);

module.exports = router;
