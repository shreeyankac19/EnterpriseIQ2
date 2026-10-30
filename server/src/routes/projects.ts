import { Router } from 'express';
import { queryAll, queryGet, queryRun, saveDatabase } from '../db.js';

const router = Router();

// GET /api/projects
router.get('/', (req, res) => {
  const { dept, status, search } = req.query as {
    dept?: string;
    status?: string;
    search?: string;
  };

  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params: any[] = [];

  if (dept && dept !== 'All Departments') {
    sql += ' AND department = ?';
    params.push(dept);
  }

  if (status && status !== 'All Statuses') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (lower(code) LIKE ? OR lower(name) LIKE ? OR lower(lead) LIKE ? OR lower(scope) LIKE ?)';
    params.push(
      `%${search.toLowerCase()}%`,
      `%${search.toLowerCase()}%`,
      `%${search.toLowerCase()}%`,
      `%${search.toLowerCase()}%`
    );
  }

  sql += ' ORDER BY id ASC';

  const projects = queryAll<any>(sql, params);
  res.json({ projects });
});

// GET /api/projects/analytics
router.get('/analytics', (req, res) => {
  const projects = queryAll<any>('SELECT * FROM projects');
  const docs = queryAll<any>('SELECT department FROM documents');

  const total = projects.length;
  const active = projects.filter(p => p.status === 'Active').length;
  const completed = projects.filter(p => p.status === 'Completed').length;
  const pending = projects.filter(p => p.status === 'Pending').length;

  const departments = ['Engineering', 'Finance', 'HR', 'Legal', 'Operations'];

  const deptDistribution = departments.map(dept => {
    const deptProjects = projects.filter(p => p.department === dept);
    const deptDocs = docs.filter(d => d.department === dept);

    const totalBudget = deptProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = deptProjects.reduce((sum, p) => sum + (p.actual_spent || 0), 0);

    const completedCount = deptProjects.filter(p => p.status === 'Completed').length;
    const activeCount = deptProjects.filter(p => p.status === 'Active').length;
    const pendingCount = deptProjects.filter(p => p.status === 'Pending').length;

    // Percentages for multi-segment bar
    const projectTotal = Math.max(1, deptProjects.length);
    const completedPct = Math.round((completedCount / projectTotal) * 100);
    const activePct = Math.round((activeCount / projectTotal) * 100);
    const pendingPct = 100 - completedPct - activePct;

    return {
      department: dept,
      projectCount: deptProjects.length,
      docCount: deptDocs.length,
      budget: totalBudget,
      spent: totalSpent,
      formattedSpent: `$${Math.round(totalSpent / 1000)}K`,
      formattedBudget: `$${(totalBudget / 1000000 >= 1 ? (totalBudget / 1000000).toFixed(2) + 'M' : Math.round(totalBudget / 1000) + 'K')}`,
      completedCount,
      activeCount,
      pendingCount,
      completedPct,
      activePct,
      pendingPct
    };
  });

  res.json({
    kpis: {
      total,
      active,
      completed,
      pending
    },
    departmentDistribution: deptDistribution
  });
});

// POST /api/projects
router.post('/', (req, res) => {
  const { code, name, scope, department, status, progress, budget, actual_spent, lead } = req.body;

  if (!code || !name) {
    return res.status(400).json({ error: 'Project code and name are required' });
  }

  const id = 'proj-' + Date.now();
  const safeCode = code.toUpperCase().startsWith('PROJ-') ? code.toUpperCase() : `PROJ-${code.toUpperCase()}`;

  try {
    queryRun(
      `INSERT INTO projects (id, code, name, scope, department, status, progress, budget, actual_spent, lead)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        safeCode,
        name,
        scope || '',
        department || 'Engineering',
        status || 'Pending',
        progress || 0,
        Number(budget) || 0,
        Number(actual_spent) || 0,
        lead || 'Unassigned'
      ]
    );
    saveDatabase();

    const created = queryGet<any>('SELECT * FROM projects WHERE id = ?', [id]);
    res.status(201).json({ project: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

export default router;
