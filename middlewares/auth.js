export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Достъпът е отказан' });
    }
    next();
  };
}

export function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Само администратори имат достъп.' });
  }
  next();
}

export function isAuthenticated(req, res, next) {
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