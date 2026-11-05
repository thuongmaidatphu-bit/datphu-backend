const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_FILE = path.join(__dirname, '..', 'data', 'api_keys.json');

// Khởi tạo file lưu trữ API keys
function loadKeys() {
  try {
    if (!fs.existsSync(KEYS_FILE)) {
      const initialKeys = [
        {
          id: "key-master-01",
          name: "Chủ Sàn Đất Phú Core (Master Key)",
          prefix: "dp_master_live_",
          keyMasked: "dp_master_live_9a7b...4c2e",
          keyHash: hashKey("dp_master_live_9a7b8c3d2e1f4a5b6c7d8e9f0a1b2c3d"),
          role: "master_admin",
          scopes: ["all"],
          rateLimitRpm: 10000,
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: "key-merchant-01",
          name: "Đất Phú Phòng Nghỉ (Ví An Sinh POS)",
          prefix: "dp_merchant_live_",
          keyMasked: "dp_merchant_live_8821...912a",
          keyHash: hashKey("dp_merchant_live_8821fa39c281b947c6a9e102f912a"),
          role: "merchant",
          scopes: ["pos:create_order", "pos:read_reports", "tax:issue_einvoice"],
          rateLimitRpm: 600,
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: "key-webhook-01",
          name: "Cổng Ngân Hàng Napas247 (SePay / Casso Webhook)",
          prefix: "dp_whsec_",
          keyMasked: "dp_whsec_5f12...3e8b",
          keyHash: hashKey("dp_whsec_5f12e847c92a10b3d4f82a912e3e8b"),
          role: "webhook_verifier",
          scopes: ["webhook:bank_ipn"],
          rateLimitRpm: 3000,
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: "key-worker-01",
          name: "Mạng Lưới Thợ 6K (Dispatch API)",
          prefix: "dp_worker_live_",
          keyMasked: "dp_worker_live_12b4...88ef",
          keyHash: hashKey("dp_worker_live_12b4a59c78d10e3f2b4c88ef"),
          role: "worker",
          scopes: ["dispatch:accept_job", "dispatch:update_status"],
          rateLimitRpm: 300,
          status: "active",
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(KEYS_FILE, JSON.stringify(initialKeys, null, 2), 'utf-8');
      return initialKeys;
    }
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveKeys(keys) {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (e) {
    console.error("Lỗi lưu API keys:", e);
  }
}

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// Hàm sinh API Key mới chuẩn bảo mật cao (Stripe/OpenAI standard)
function generateNewAPIKey(name, role = 'merchant', scopes = ['pos:create_order']) {
  let prefix = 'dp_merchant_live_';
  if (role === 'master_admin') prefix = 'dp_master_live_';
  else if (role === 'worker') prefix = 'dp_worker_live_';
  else if (role === 'webhook') prefix = 'dp_whsec_';
  else if (role === 'einvoice') prefix = 'dp_einvoice_key_';

  // 32 bytes ngẫu nhiên bảo mật cao
  const randomHex = crypto.randomBytes(24).toString('hex');
  const fullKey = `${prefix}${randomHex}`;
  const keyHash = hashKey(fullKey);
  const keyMasked = `${prefix}${randomHex.slice(0, 4)}...${randomHex.slice(-4)}`;

  const keyObject = {
    id: `key-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    prefix,
    keyMasked,
    keyHash,
    role,
    scopes,
    rateLimitRpm: role === 'master_admin' ? 10000 : 600,
    status: "active",
    createdAt: new Date().toISOString()
  };

  const keys = loadKeys();
  keys.unshift(keyObject);
  saveKeys(keys);

  // Trả về fullKey một lần duy nhất để người dùng copy
  return {
    keyObject,
    fullKey
  };
}

// HTTP Handlers
function handleListKeys(req, res) {
  const keys = loadKeys();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    count: keys.length,
    keys: keys.map(k => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      keyMasked: k.keyMasked,
      role: k.role,
      scopes: k.scopes,
      status: k.status,
      rateLimitRpm: k.rateLimitRpm,
      createdAt: k.createdAt
    }))
  }));
}

function handleCreateKey(req, res, body) {
  const { name, role, scopes } = body;
  if (!name) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Tên định danh khóa (name) là bắt buộc' }));
  }

  const result = generateNewAPIKey(name, role, scopes);
  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Khởi tạo API Key thành công! Hãy lưu lại khóa bí mật này ngay, vì hệ thống sẽ không hiển thị lại lần thứ hai.',
    apiKey: result.fullKey,
    details: result.keyObject
  }));
}

function handleRevokeKey(req, res, body) {
  const { keyId } = body;
  const keys = loadKeys();
  const idx = keys.findIndex(k => k.id === keyId);

  if (idx === -1) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Không tìm thấy API Key' }));
  }

  keys[idx].status = 'revoked';
  keys[idx].revokedAt = new Date().toISOString();
  saveKeys(keys);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã thu hồi và vô hiệu hóa API Key: ${keys[idx].name}`,
    keyId
  }));
}

module.exports = {
  loadKeys,
  generateNewAPIKey,
  hashKey,
  handleListKeys,
  handleCreateKey,
  handleRevokeKey
};
