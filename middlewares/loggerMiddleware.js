import { createLog } from '../utils/logger.js'

export function logRouteAccess(action) {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await createLog({
          user: req.user._id,
          action,
          details: `Потребител ${req.user.email} достъпи ${req.originalUrl}`,
          ip: req.ip,
        })
      }
    } catch (error) {
      console.error('Грешка в логването на рут:', error)
    }
    next()
  }
}