import { Router } from 'express';
import { searchKnowledgeChunks } from '../rag.js';
import { queryAll } from '../db.js';

const router = Router();

// GET /api/search
router.get('/', (req, res) => {
  const { q = '', dept, format, role = 'admin' } = req.query as {
    q?: string;
    dept?: string;
    format?: string;
    role?: string;
  };

  if (!q || q.trim() === '') {
    return res.json({ results: [], projectMatches: [] });
  }

  // 1. Search document chunks
  const chunkResults = searchKnowledgeChunks(q.trim(), role, dept, format);

  // 2. Search projects
  const queryTerm = `%${q.trim().toLowerCase()}%`;
  const projectMatches = queryAll<any>(
    `SELECT code, name, scope, department, status, progress, budget, actual_spent, lead
     FROM projects
     WHERE lower(code) LIKE ? OR lower(name) LIKE ? OR lower(scope) LIKE ? OR lower(lead) LIKE ?`,
    [queryTerm, queryTerm, queryTerm, queryTerm]
  );

  res.json({
    query: q,
    count: chunkResults.length + projectMatches.length,
    results: chunkResults,
    projectMatches
  });
});

export default router;
