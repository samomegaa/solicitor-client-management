// File: routes/clients.js
import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/api/clients', authorizeRoles('staff', 'admin'), (req, res) => {
  // Fetch clients logic here
  res.status(200).json({ message: 'Clients endpoint secured' });
});

router.post('/api/clients', authorizeRoles('admin'), (req, res) => {
  // Create client logic here
  res.status(200).json({ message: 'Create client endpoint secured' });
});

export default router;
