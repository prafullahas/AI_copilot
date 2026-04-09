const getInfo = (req, res) => {
  res.json({
    name: 'AI Codebase Copilot',
    version: '1.0.0',
    endpoints: ['/health', '/info', '/ingest-repo', '/retrieve', '/chat'],
  });
};

module.exports = { getInfo };
