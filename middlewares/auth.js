export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/auth/login')
}

export function ensureRole(role) {
  return (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === role) {
      return next()
    }
    res.status(403).send('Достъпът е отказан.')
  }
}

export function ensureRoles(roles) {
  return (req, res, next) => {
    if (req.isAuthenticated() && roles.includes(req.user.role)) {
      return next()
    }
    res.status(403).send('Нямате необходимите права.')
  }
}