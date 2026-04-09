const getInfo = (req, res) => {
  res.json({
    name: 'AI Codebase Copilot',
    version: '1.0.0',
    endpoints: ['/health', '/info', '/auth/register', '/auth/login', '/ingest-repo', '/retrieve', '/chat', '/search'],
  });
};

module.exports = { getInfo };
