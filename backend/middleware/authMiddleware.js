const jwt = require('jsonwebtoken');
const { getDb } = require('../utils/db');
const { ObjectId } = require('mongodb');

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const db = await getDb();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(payload.sub) },
      { projection: { password: 0 } }
    );
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = { id: user._id.toString(), email: user.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
