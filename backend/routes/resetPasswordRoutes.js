// routes/resetPasswordRoutes.js - COMPLETE FIXED VERSION
import express from 'express';
import { 
  forgotPassword, 
  resetPassword
} from '../controllers/resetPassword.js';

const router = express.Router();

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset link to user email (BLOCKS admin accounts)
 * @access  Public
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "platform": "web" or "mobile" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Password reset email sent! Please check your inbox."
 * }
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token in URL path (PRIMARY - for web)
 * @access  Public
 * 
 * URL: /api/auth/reset-password/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * Request body:
 * {
 *   "newPassword": "newSecurePassword123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Password reset successfully! You can now login with your new password."
 * }
 */
router.post('/reset-password/:token', resetPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token in request body (FALLBACK - for mobile/compatibility)
 * @access  Public
 * 
 * ⭐ IMPORTANT: This route MUST come AFTER the /:token route
 * Express matches routes in order, so specific routes must be defined first
 * 
 * Request body:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "newPassword": "newSecurePassword123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Password reset successfully! You can now login with your new password."
 * }
 */
router.post('/reset-password', resetPassword);

export default router;