import express from 'express';
import { getUserInvoices, getInvoiceById } from '../controllers/invoices.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All invoice routes require authentication
router.use(authenticate);

// Get user invoices
router.get('/', getUserInvoices);

// Get specific invoice by ID
router.get('/:id', getInvoiceById);

export default router;
