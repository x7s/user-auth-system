export function setUserLocals(req, res, next) {
  res.locals.user = req.user || null
  res.locals.role = req.user?.role || null
  next()
}