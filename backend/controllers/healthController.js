const healthService = require('../services/healthService');

const getHealth = (req, res) => {
  const status = healthService.checkHealth();
  res.json(status);
};

module.exports = { getHealth };
