/**
 * ============================================================================
 * VERCEL SERVERLESS FUNCTION HANDLER: ĐẤT PHÚ CORE ENGINE
 * ============================================================================
 */
const server = require('../src/server');

module.exports = (req, res) => {
  server.emit('request', req, res);
};
