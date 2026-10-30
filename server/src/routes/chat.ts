import { Router } from 'express';
import { queryAll, queryGet, queryRun, saveDatabase } from '../db.js';
import { askEnterpriseIQ } from '../gemini.js';

const router = Router();

// GET /api/chat/sessions
router.get('/sessions', (req, res) => {
  const sessions = queryAll<any>(`
    SELECT s.id, s.title, s.user_id, s.created_at, s.updated_at,
           (SELECT count(*) FROM chat_messages m WHERE m.session_id = s.id) as message_count
    FROM chat_sessions s
    ORDER BY s.updated_at DESC
  `);
  res.json({ sessions });
});

// POST /api/chat/sessions
router.post('/sessions', (req, res) => {
  const { title = 'New Conversation', user_id = 'usr-admin' } = req.body;
  const id = 'chat-' + Date.now();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  queryRun(
    'INSERT INTO chat_sessions (id, title, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, title, user_id, now, now]
  );
  saveDatabase();

  const session = queryGet<any>('SELECT * FROM chat_sessions WHERE id = ?', [id]);
  res.status(201).json({ session: { ...session, message_count: 0 } });
});

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;
  queryRun('DELETE FROM chat_messages WHERE session_id = ?', [id]);
  queryRun('DELETE FROM chat_sessions WHERE id = ?', [id]);
  saveDatabase();
  res.json({ message: 'Session deleted' });
});

// GET /api/chat/sessions/:id/messages
router.get('/sessions/:id/messages', (req, res) => {
  const messages = queryAll<any>(
    'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
    [req.params.id]
  );

  const formatted = messages.map(m => ({
    ...m,
    sources: m.sources_json ? JSON.parse(m.sources_json) : []
  }));

  res.json({ messages: formatted });
});

// POST /api/chat/sessions/:id/messages
router.post('/sessions/:id/messages', async (req, res) => {
  const { id: sessionId } = req.params;
  const { message, userRole = 'admin' } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const session = queryGet<any>('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const userMsgId = 'msg-' + Date.now();

  // Save user message
  queryRun(
    'INSERT INTO chat_messages (id, session_id, sender, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userMsgId, sessionId, 'user', message.trim(), JSON.stringify([]), now]
  );

  // Update session title if first message
  const msgCount = queryGet<{ count: number }>(
    'SELECT count(*) as count FROM chat_messages WHERE session_id = ?',
    [sessionId]
  )?.count || 0;

  if (msgCount <= 2 && session.title === 'New Conversation') {
    const newTitle = message.trim().length > 40 ? message.trim().substring(0, 40) + '...' : message.trim();
    queryRun('UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?', [newTitle, now, sessionId]);
  } else {
    queryRun('UPDATE chat_sessions SET updated_at = ? WHERE id = ?', [now, sessionId]);
  }

  // Get previous messages for multi-turn context
  const history = queryAll<any>(
    'SELECT sender, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );

  // Ask AI Engine with Grounding and RBAC
  const result = await askEnterpriseIQ(message.trim(), userRole, history);

  const botMsgId = 'msg-' + (Date.now() + 1);
  const botNow = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Save assistant message with verified sources
  queryRun(
    'INSERT INTO chat_messages (id, session_id, sender, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [botMsgId, sessionId, 'assistant', result.answer, JSON.stringify(result.sources), botNow]
  );
  saveDatabase();

  res.json({
    userMessage: {
      id: userMsgId,
      session_id: sessionId,
      sender: 'user',
      content: message.trim(),
      sources: [],
      created_at: now
    },
    assistantMessage: {
      id: botMsgId,
      session_id: sessionId,
      sender: 'assistant',
      content: result.answer,
      sources: result.sources,
      created_at: botNow
    }
  });
});

export default router;
