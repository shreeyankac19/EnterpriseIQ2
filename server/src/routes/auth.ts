import { Router } from 'express';
import { queryAll, queryGet } from '../db.js';

const router = Router();

// Get current user profile or list demo users
router.get('/users', (req, res) => {
  const users = queryAll<any>('SELECT id, username, name, role, department, avatar_initial FROM users');
  res.json({ users });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = queryGet<any>(
    'SELECT id, username, name, role, department, avatar_initial FROM users WHERE username = ? AND password = ?',
    [username, password || '']
  );

  if (!user) {
    // If demo login with just username
    const demoUser = queryGet<any>(
      'SELECT id, username, name, role, department, avatar_initial FROM users WHERE username = ?',
      [username]
    );
    if (demoUser) {
      return res.json({ user: demoUser });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json({ user });
});

export default router;
