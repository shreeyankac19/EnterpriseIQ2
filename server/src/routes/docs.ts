import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { queryAll, queryGet, queryRun, saveDatabase, UPLOADS_DIR } from '../db.js';
import { parseFileContent } from '../rag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// GET /api/docs
router.get('/', (req, res) => {
  const { dept, format, search, role } = req.query as {
    dept?: string;
    format?: string;
    search?: string;
    role?: string;
  };

  let sql = 'SELECT * FROM documents WHERE 1=1';
  const params: any[] = [];

  if (dept && dept !== 'All Departments') {
    sql += ' AND department = ?';
    params.push(dept);
  }

  if (format && format !== 'All Formats') {
    sql += ' AND file_type = ?';
    params.push(format.toUpperCase());
  }

  if (search) {
    sql += ' AND (lower(title) LIKE ? OR lower(filename) LIKE ? OR lower(department) LIKE ?)';
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }

  sql += ' ORDER BY id ASC';

  const docs = queryAll<any>(sql, params);

  // Add RBAC accessible status flag
  const userRole = role || 'admin';
  const enhancedDocs = docs.map(doc => ({
    ...doc,
    isAccessible: userRole === 'admin' || doc.confidentiality === 'Internal'
  }));

  res.json({ documents: enhancedDocs });
});

// GET /api/docs/stats
router.get('/stats', (req, res) => {
  const docs = queryAll<any>('SELECT file_type, confidentiality FROM documents');
  
  const byFormat = {
    CSV: docs.filter(d => d.file_type === 'CSV').length,
    DOCX: docs.filter(d => d.file_type === 'DOCX').length,
    PDF: docs.filter(d => d.file_type === 'PDF').length,
    XLSX: docs.filter(d => d.file_type === 'XLSX').length,
  };

  const byClearance = {
    Confidential: docs.filter(d => d.confidentiality === 'Confidential' || d.confidentiality === 'Restricted').length,
    Internal: docs.filter(d => d.confidentiality === 'Internal').length,
  };

  res.json({
    total: docs.length,
    byFormat,
    byClearance
  });
});

// GET /api/docs/:id
router.get('/:id', (req, res) => {
  const doc = queryGet<any>('SELECT * FROM documents WHERE id = ?', [req.params.id]);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const chunks = queryAll<any>(
    'SELECT id, chunk_index, content, page_number, token_count FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC',
    [req.params.id]
  );

  res.json({
    document: doc,
    chunks
  });
});

// POST /api/docs/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const {
      title,
      department = 'General',
      confidentiality = 'Internal',
      uploaded_by = 'Eleanor Vance'
    } = req.body;

    const originalname = req.file.originalname;
    const fileExt = path.extname(originalname).replace('.', '').toUpperCase() || 'TXT';
    const fileSize = req.file.size;
    const docId = 'doc-' + Date.now();

    // Parse real content
    const parsed = await parseFileContent(req.file.buffer, originalname, fileExt);

    // Save physical file
    const safeFilename = `${docId}-${originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    fs.writeFileSync(filePath, req.file.buffer);

    // Format metadata
    const formattedSize = formatBytes(fileSize);
    const uploadDate = formatDate(new Date());
    const finalTitle = title || originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    queryRun(
      `INSERT INTO documents (id, title, filename, file_type, department, confidentiality, file_size_bytes, formatted_size, content_length_desc, uploaded_by, upload_date, file_path, raw_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docId,
        finalTitle,
        originalname,
        fileExt,
        department,
        confidentiality,
        fileSize,
        formattedSize,
        parsed.contentLengthDesc,
        uploaded_by,
        uploadDate,
        filePath,
        parsed.rawText
      ]
    );

    // Insert chunks
    parsed.chunks.forEach((chunkContent, idx) => {
      queryRun(
        `INSERT INTO document_chunks (id, document_id, chunk_index, content, page_number, token_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `chk-${docId}-${idx}`,
          docId,
          idx + 1,
          chunkContent,
          Math.floor(idx / 2) + 1,
          chunkContent.split(/\s+/).length
        ]
      );
    });

    saveDatabase();

    const created = queryGet<any>('SELECT * FROM documents WHERE id = ?', [docId]);
    res.status(201).json({
      message: 'Document successfully indexed into EnterpriseIQ knowledge repository',
      document: created
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process document' });
  }
});

// DELETE /api/docs/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const doc = queryGet<any>('SELECT * FROM documents WHERE id = ?', [id]);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Remove file if exists
  if (doc.file_path && fs.existsSync(doc.file_path)) {
    try {
      fs.unlinkSync(doc.file_path);
    } catch (e) {}
  }

  queryRun('DELETE FROM document_chunks WHERE document_id = ?', [id]);
  queryRun('DELETE FROM documents WHERE id = ?', [id]);
  saveDatabase();

  res.json({ message: 'Document and vectorized chunks successfully removed' });
});

export default router;
