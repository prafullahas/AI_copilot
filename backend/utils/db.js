const { MongoClient } = require('mongodb');
const logger = require('./logger');

let db = null;

const getDb = async () => {
  if (db) return db;
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  db = client.db(process.env.DB_NAME);
  logger.info('Connected to MongoDB');
  return db;
};

module.exports = { getDb };
