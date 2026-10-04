const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'classwork_scheduler_secret_key_2026';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access restricted to administrators / faculty only.' });
    }
  });
}

function requireStudent(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === 'student') {
      next();
    } else {
      res.status(403).json({ error: 'Access restricted to students only.' });
    }
  });
}

module.exports = {
  JWT_SECRET,
  verifyToken,
  requireAdmin,
  requireStudent,
};
