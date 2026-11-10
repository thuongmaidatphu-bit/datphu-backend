/**
 * ============================================================================
 * VERCEL SERVERLESS FUNCTION HANDLER: ĐẤT PHÚ CORE ENGINE & TTS STREAMING
 * ============================================================================
 */
const https = require('https');
const server = require('../src/server');

module.exports = (req, res) => {
  const reqUrl = req.url || '';
  const parsed = new URL(reqUrl, 'http://localhost');
  const q = parsed.searchParams.get('q') || '';

  // 1. CỔNG PHÁT ÂM THANH GIỌNG NÓI TTS TIẾNG VIỆT (STREAMING MP3)
  if (reqUrl.includes('tts') || q) {
    const textToSpeak = q || 'Lịch Đất Phú';
    const ttsUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=' + encodeURIComponent(textToSpeak);

    return https.get(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });
      proxyRes.pipe(res);
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('TTS Error: ' + err.message);
    });
  }

  // 2. CHUYỂN TIẾP ĐẾN MÁY CHỦ HTTP ĐẤT PHÚ
  server.emit('request', req, res);
};
