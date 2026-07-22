import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
export function auth(req, res, next) { try { const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', ''); req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET); next(); } catch { res.status(401).json({ error: 'Authentication required' }); } }
export function admin(req, res, next) { if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' }); next(); }
export const commentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
export const inquiryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many enquiries. Please try again later or contact us on the official website.' } });
export function errorHandler(err, req, res, next) { console.error(err); res.status(err.status || 500).json({ error: err.message || 'Internal server error' }); }
