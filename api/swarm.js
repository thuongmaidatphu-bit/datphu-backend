/**
 * CỔNG API XỬ LÝ ĐA TÁC TỬ AI SWARM ĐẤT PHÚ GEN 4
 * Endpoint: /api/swarm
 */
const { processAgentSwarm } = require('../src/agents/swarmEngine');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const message = (payload.message || '').trim();

        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ 
            success: false, 
            message: 'Vui lòng cung cấp nội dung câu hỏi cho AI Swarm!' 
          }));
        }

        const result = await processAgentSwarm(message);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(result));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ 
          success: false, 
          error: err.message,
          fallbackReply: 'Hệ thống Đa tác tử AI Đất Phú đang bận xử lý dữ liệu. Vui lòng nhắn tin trực tiếp qua Zalo 0979.991.898 để được chuyên viên hỗ trợ tức thì!' 
        }));
      }
    });
    return;
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
