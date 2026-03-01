import { AppError, ERROR_CODES } from "../utils/appError.js";
import { sendSuccess } from "../utils/response.helper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/app.constants.js";

/**
 * Get user invoices
 * @route GET /api/invoices
 */
export const getUserInvoices = asyncHandler(async (req, res) => {
  // For now, return empty array as invoice system is not implemented yet
  // This can be expanded to integrate with payment systems like Stripe
  const invoices = [];

  sendSuccess(res, invoices, "Invoices retrieved successfully");
});

/**
 * Get specific invoice by ID
 * @route GET /api/invoices/:id
 */
export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // For now, return not found as invoice system is not implemented yet
  throw new AppError("Invoice not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
});
