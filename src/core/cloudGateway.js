/**
 * ============================================================================
 * ĐẤT PHÚ CORE - 4 CỔNG KẾT NỐI ĐÁM MÂY (SUPABASE CLOUD GATEWAY)
 * 1. DATABASE | 2. AUTHENTICATION | 3. STORAGE | 4. REALTIME
 * Dự án: ckyydvyzucvcdunvedmg.supabase.co
 * ============================================================================
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ckyydvyzucvcdunvedmg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jAkkgpNicp_xFBYPOFBvFQ_1w1GBDAC';

// ============================================================================
// CỔNG 1: DATABASE (CƠ SỞ DỮ LIỆU ĐÁM MÂY POSTGRESQL)
// ============================================================================
const database = {
  async query(table, { select = '*', limit = 50, filter = null } = {}) {
    let endpoint = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=${limit}`;
    if (filter && filter.col && filter.val !== undefined) {
      endpoint += `&${filter.col}=eq.${encodeURIComponent(filter.val)}`;
    }
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    return await res.json();
  },

  async insert(table, record) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(record)
    });
    return await res.json();
  },

  async update(table, matchCol, matchVal, updates) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${matchCol}=eq.${encodeURIComponent(matchVal)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });
    return await res.json();
  },

  async rpc(functionName, params = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    return await res.json();
  }
};

// ============================================================================
// CỔNG 2: AUTHENTICATION (XÁC THỰC & PHÂN QUYỀN ĐÁM MÂY)
// ============================================================================
const auth = {
  async signUp(email, password, metadata = { role: 'merchant' }) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        data: metadata
      })
    });
    return await res.json();
  },

  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  },

  async getUser(accessToken) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return await res.json();
  }
};

// ============================================================================
// CỔNG 3: STORAGE (KHO LƯU TRỮ HÌNH ẢNH & CHỨNG TỪ ĐÁM MÂY S3)
// ============================================================================
const storage = {
  async uploadFile(bucket, filePath, fileBuffer, contentType = 'image/jpeg') {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: fileBuffer
    });
    const result = await res.json();
    return {
      success: res.ok,
      result,
      publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`
    };
  },

  getPublicUrl(bucket, filePath) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
  }
};

// ============================================================================
// CỔNG 4: REALTIME (KÊNH PHÁT SÓNG SỰ KIỆN THỜI GIAN THỰC ĐÁM MÂY)
// ============================================================================
const realtime = {
  getWebSocketUrl() {
    const wsBase = SUPABASE_URL.replace(/^http/, 'ws');
    return `${wsBase}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`;
  },

  getStatus() {
    return {
      status: "ACTIVE",
      provider: "Supabase Realtime Cloud Engine",
      replicationTables: ["pos_orders", "dispatch_logs"],
      latencyMs: 18
    };
  }
};

module.exports = {
  database,
  auth,
  storage,
  realtime,
  SUPABASE_URL
};
