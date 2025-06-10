// File: routes/invoices.js
import express from 'express';
import { Invoice } from '../models/invoice.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/api/invoices', authorizeRoles('staff', 'admin'), async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.get('/api/invoices/:clientId', authorizeRoles('staff', 'admin'), async (req, res) => {
  try {
    const invoices = await Invoice.find({ clientId: req.params.clientId });
    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.put('/api/invoices/:id/pay', authorizeRoles('staff', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: 'Paid' }, { new: true });
    res.status(200).json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as paid' });
  }
});

export default router;
