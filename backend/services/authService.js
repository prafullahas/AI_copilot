const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../utils/db');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const verifyPassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};

const createToken = (userId, email) => {
  return jwt.sign(
    { sub: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const register = async (email, password) => {
  const db = await getDb();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.collection('users').findOne({ email: normalizedEmail });
  if (existing) {
    throw { status: 409, message: 'Email already registered' };
  }

  const passwordHash = await hashPassword(password);
  const user = {
    email: normalizedEmail,
    password: passwordHash,
    createdAt: new Date().toISOString(),
  };

  const result = await db.collection('users').insertOne(user);
  const token = createToken(result.insertedId.toString(), normalizedEmail);

  return {
    token,
    user: { id: result.insertedId.toString(), email: normalizedEmail, createdAt: user.createdAt },
  };
};

const login = async (email, password) => {
  const db = await getDb();
  const normalizedEmail = email.toLowerCase().trim();

  const user = await db.collection('users').findOne({ email: normalizedEmail });
  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const token = createToken(user._id.toString(), normalizedEmail);

  return {
    token,
    user: { id: user._id.toString(), email: user.email, createdAt: user.createdAt },
  };
};

const seedAdmin = async () => {
  const db = await getDb();
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const existing = await db.collection('users').findOne({ email: adminEmail });
  if (!existing) {
    const passwordHash = await hashPassword(adminPassword);
    await db.collection('users').insertOne({
      email: adminEmail,
      password: passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    logger.info(`Admin user seeded: ${adminEmail}`);
  }

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
};

module.exports = { register, login, seedAdmin, createToken };
