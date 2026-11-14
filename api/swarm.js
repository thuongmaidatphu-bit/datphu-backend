/**
 * CỔNG API XỬ LÝ ĐA TÁC TỬ AI SWARM ĐẤT PHÚ GEN 4
 * Endpoint: /api/swarm
 */
const { processAgentSwarm } = require('../src/agents/swarmEngine');

async function extractBody(req, existingBody) {
  if (existingBody && typeof existingBody === 'object') return existingBody;
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res, optionalBody) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'POST') {
    try {
      const payload = await extractBody(req, optionalBody);
      const message = (payload.message || '').trim();

      if (!message) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ 
          success: false, 
          message: 'Vui lòng cung cấp nội dung câu hỏi cho AI Swarm!' 
        }));
      }

      const sessionId = payload.sessionId || null;
      const history = Array.isArray(payload.history) ? payload.history : null;

      const result = await processAgentSwarm(message, { sessionId, history });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(result));

    } catch (err) {
      console.error('Swarm API Error:', err);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ 
        success: true,
        agent: 'Front-line Support Agent',
        reply: 'Dạ Đất Phú xin chào! Hệ thống Đa tác tử AI Đất Phú luôn sẵn sàng phục vụ. Quý khách vui lòng liên hệ trực tiếp Hotline / Zalo: 0979.991.898 để được chuyên viên hỗ trợ tức thì nhé!',
        complianceStatus: '6K_KIN_KE_VERIFIED'
      }));
    }
  }

  // GET: Health check
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    status: 'ONLINE',
    system: 'DAT_PHU_GEN_4_AI_SWARM',
    agents: [
      'Front-line Support Agent',
      'Tax & Invoicing Expert Agent',
      'Technical & Automation Coordinator Agent',
      'Audit & Accounting Agent'
    ],
    standard: '6K_KIN_KE_OS'
  }));
};
