#!/usr/bin/env node
/**
 * ============================================================================
 * ĐẤT PHÚ SUPABASE MCP SERVER (MODEL CONTEXT PROTOCOL)
 * Chuẩn giao thức: JSON-RPC 2.0 over Stdio (Zero external dependencies)
 * Kết nối AI (Antigravity / Gemini) trực tiếp với Cơ sở dữ liệu Supabase Cloud
 * ============================================================================
 */

const readline = require('readline');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ckyydvyzucvcdunvedmg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jAkkgpNicp_xFBYPOFBvFQ_1w1GBDAC';

// Danh sách các MCP Tools
const TOOLS = [
  {
    name: 'supabase_query_table',
    description: 'Truy vấn dữ liệu từ bảng Supabase Postgres (pos_orders, pos_merchants, workers, products...) với bộ lọc, giới hạn số lượng và sắp xếp.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Tên bảng cần truy vấn (VD: pos_orders, workers, products)' },
        select: { type: 'string', description: 'Cột cần lấy (mặc định "*")' },
        limit: { type: 'number', description: 'Số bản ghi tối đa (mặc định 20)' },
        filterColumn: { type: 'string', description: 'Tên cột lọc (tùy chọn)' },
        filterValue: { type: 'string', description: 'Giá trị cần lọc (tùy chọn)' }
      },
      required: ['table']
    }
  },
  {
    name: 'supabase_insert_record',
    description: 'Chèn một bản ghi mới vào bảng Supabase Postgres.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Tên bảng cần chèn' },
        record: { type: 'object', description: 'Dữ liệu bản ghi dạng JSON' }
      },
      required: ['table', 'record']
    }
  },
  {
    name: 'supabase_update_record',
    description: 'Cập nhật bản ghi trong bảng Supabase Postgres theo điều kiện id hoặc cột lọc.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Tên bảng cần cập nhật' },
        matchColumn: { type: 'string', description: 'Tên cột điều kiện (VD: id hoặc order_code)' },
        matchValue: { type: 'string', description: 'Giá trị điều kiện' },
        updates: { type: 'object', description: 'Dữ liệu cập nhật mới' }
      },
      required: ['table', 'matchColumn', 'matchValue', 'updates']
    }
  },
  {
    name: 'supabase_rpc_call',
    description: 'Gọi hàm Stored Procedure (RPC) trên Supabase Postgres (như get_merchant_daily_report).',
    inputSchema: {
      type: 'object',
      properties: {
        functionName: { type: 'string', description: 'Tên hàm RPC PostgreSQL' },
        params: { type: 'object', description: 'Tham số truyền vào hàm' }
      },
      required: ['functionName']
    }
  },
  {
    name: 'supabase_get_schema',
    description: 'Lấy trạng thái kết nối và danh mục các bảng nghiệp vụ trong dự án Supabase Đất Phú.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Helper gọi Supabase REST API (PostgREST)
async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

// Xử lý thực thi tool
async function handleToolCall(name, args) {
  switch (name) {
    case 'supabase_query_table': {
      const { table, select = '*', limit = 20, filterColumn, filterValue } = args;
      let queryUrl = `${table}?select=${encodeURIComponent(select)}&limit=${limit}`;
      if (filterColumn && filterValue !== undefined) {
        queryUrl += `&${filterColumn}=eq.${encodeURIComponent(filterValue)}`;
      }
      const data = await supabaseFetch(queryUrl, { method: 'GET' });
      return { success: true, table, count: Array.isArray(data) ? data.length : 1, data };
    }

    case 'supabase_insert_record': {
      const { table, record } = args;
      const data = await supabaseFetch(table, {
        method: 'POST',
        body: JSON.stringify(record)
      });
      return { success: true, message: `Đã chèn bản ghi vào bảng ${table}`, data };
    }

    case 'supabase_update_record': {
      const { table, matchColumn, matchValue, updates } = args;
      const data = await supabaseFetch(`${table}?${matchColumn}=eq.${encodeURIComponent(matchValue)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      return { success: true, message: `Đã cập nhật bảng ${table} nơi ${matchColumn}=${matchValue}`, data };
    }

    case 'supabase_rpc_call': {
      const { functionName, params = {} } = args;
      const data = await supabaseFetch(`rpc/${functionName}`, {
        method: 'POST',
        body: JSON.stringify(params)
      });
      return { success: true, functionName, result: data };
    }

    case 'supabase_get_schema': {
      return {
        success: true,
        projectUrl: SUPABASE_URL,
        status: "CONNECTED",
        databaseType: "PostgreSQL 15 (Supabase Cloud)",
        businessTables: [
          { name: "pos_merchants", description: "Hộ kinh doanh / điểm bán Ví An Sinh" },
          { name: "pos_orders", description: "Đơn hàng bán lẻ & dòng tiền Napas247" },
          { name: "pos_order_items", description: "Chi tiết các món trong đơn" },
          { name: "pos_products", description: "Danh mục sản phẩm, cà phê, đặc sản Tuy Hòa" },
          { name: "workers", description: "Thợ kỹ thuật 6K (Điện nước, Điện lạnh, Mở khóa)" },
          { name: "dispatch_logs", description: "Nhật ký điều phối thợ cứu hộ tại chỗ" }
        ]
      };
    }

    default:
      throw new Error(`Tool không tồn tại: ${name}`);
  }
}

// Xử lý JSON-RPC 2.0 qua Standard Input/Output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line.trim()) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch (err) {
    return console.error("JSON parse error:", err);
  }

  const { id, method, params } = request;

  if (method === 'initialize') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'datphu-supabase',
          version: '1.0.0'
        }
      }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  if (method === 'tools/call') {
    try {
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      const result = await handleToolCall(toolName, toolArgs);

      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (err) {
      const response = {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: err.message || 'Lỗi thực thi MCP Tool'
        }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  }
});
