// File: routes/documents.js
import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/api/documents', authorizeRoles('staff', 'admin'), (req, res) => {
  // TODO: Add document upload logic here
  res.status(200).json({ message: 'Upload endpoint secured' });
});

router.delete('/api/documents/:id', authorizeRoles('admin'), (req, res) => {
  // TODO: Add document deletion logic here
  res.status(200).json({ message: 'Delete endpoint secured' });
});

export default router;
