import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import path from 'path'
import { fileURLToPath } from 'url'
import { setUserLocals } from './middlewares/setUserLocals.js'
import { ensureGuest } from './middlewares/ensureGuest.js'
import { apiLimiter } from './middlewares/rateLimiter.js';
import './config/passport.js'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import adminRoutes from './routes/admin.js'
import moderatorRoutes from './routes/moderator.js'
import userRoutes from './routes/user.js'
import accountRoutes from './routes/account.js'
import logsRoutes from './routes/logs.js'
import notificationsRouter from './routes/notifications.js';
import activityRoutes from './routes/activity.js';
import activityLogRoutes from './routes/activityLogs.js';
import logsExportRoutes from './routes/logsExport.js';
import { startLogCleanupJob } from './utils/cronJobs.js';
import cleanupInactiveAccounts from './cron/cleanupInactiveAccounts.js';
import connectDB from './config/db.js';

dotenv.config()
const app = express()

// Пътища
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(setUserLocals)
app.use(ensureGuest)
// Ограничаваме основните API пътища (примерно всички рутове под /api)
app.use('/api/', apiLimiter)
app.use('/auth/', apiLimiter)

// За специфични пътища като логин може да направим по-строг лимит
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // например 5 опита за логин на 15 минути
  message: 'Прекалено много опити за вход, моля опитайте по-късно.'
});

app.use('/auth/login', loginLimiter);

// View engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Сесия
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}))

// Passport
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/auth', authRoutes)
app.use('/', dashboardRoutes)
app.use('/admin', adminRoutes)
app.use('/admin', logsExportRoutes);
app.use('/moderator', moderatorRoutes)
app.use('/user', userRoutes)
app.use('/account', accountRoutes)
app.use('/api/logs', logsRoutes)
app.use('/notifications', notificationsRouter)
app.use('/activity', activityRoutes);
app.use('/activity-logs', activityLogRoutes);

// Старт
const PORT = process.env.PORT || 3000
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB свързан')
    app.listen(PORT, () => console.log(`Сървърът работи на порт ${PORT}`))
    startLogCleanupJob();
    cleanupInactiveAccounts();
  })
  .catch(err => console.error('Грешка при Mongo свързване:', err))