import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минути
  max: 100, // максимум 100 заявки на IP за windowMs
  standardHeaders: true, // връща RateLimit-* заглавки
  legacyHeaders: false, // изключва X-RateLimit-* заглавки
  message: {
    status: 429,
    error: "Твърде много заявки от този IP, моля опитайте отново по-късно."
  }
});