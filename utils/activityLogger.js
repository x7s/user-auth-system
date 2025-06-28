/*
// utils/activityLogger.js
// Този файл е с оригиналния код съдържа функции за логване на потребителски дейности като влизане, изход и промяна на профил.

import ActivityLog from '../models/ActivityLog.js';

export async function logActivity(userId, action, req = null) {
  try {
    const ip = req?.ip || null;
    const userAgent = req?.headers['user-agent'] || null;

    const log = new ActivityLog({ userId, action, ip, userAgent });
    await log.save();
  } catch (error) {
    console.error('Грешка при запис на активност:', error);
  }
}
*/