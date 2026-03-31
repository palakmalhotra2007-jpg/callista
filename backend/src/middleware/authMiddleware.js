const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token — please log in' });
  try {
    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = protect;
