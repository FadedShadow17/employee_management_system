import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import mfaRoutes from './routes/mfaRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import userRoutes from './routes/userRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { announcementRoutes, departmentRoutes, notificationRoutes, performanceRoutes } from './routes/resourceRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { enforceHttps, additionalSecurityHeaders } from './middleware/httpsEnforce.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { setCsrfToken, verifyCsrfToken, getCsrfToken } from './middleware/csrf.js';
import { auditLog } from './middleware/auditLog.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy for correct IP detection
app.use(enforceHttps);
app.use(helmet());
app.use(additionalSecurityHeaders);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }
    const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
    callback(null, origin === allowed);
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

// Input sanitization (XSS + NoSQL injection prevention)
app.use(sanitizeInput);

// CSRF protection
app.use(setCsrfToken);     // Set CSRF cookie on every request
app.use(verifyCsrfToken);  // Verify CSRF token on state-changing requests

// Audit logging — records all state-changing requests
app.use(auditLog);

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'EMS API is healthy' }));
app.get('/api/csrf-token', getCsrfToken); // Endpoint for SPA to get CSRF token
app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
