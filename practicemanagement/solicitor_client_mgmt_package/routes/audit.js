// File: routes/audit.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const auditRouter = express.Router();
const logFile = path.join(process.cwd(), 'audit-log.json');

auditRouter.use(authenticateJWT);

auditRouter.post('/api/audit', authorizeRoles('staff', 'admin'), (req, res) => {
  const logEntry = req.body;
  fs.readFile(logFile, 'utf-8', (err, data) => {
    const logs = !err && data ? JSON.parse(data) : [];
    logs.push(logEntry);
    fs.writeFile(logFile, JSON.stringify(logs, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to write log' });
      }
      res.status(200).json({ success: true });
    });
  });
});

auditRouter.get('/api/audit', authorizeRoles('staff', 'admin'), (req, res) => {
  fs.readFile(logFile, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read audit logs' });
    }
    const logs = data ? JSON.parse(data) : [];
    res.status(200).json(logs);
  });
});

export default auditRouter;
