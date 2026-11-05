const fs = require('fs');

// 1. Update src/controllers/aiController.js
const aiControllerPath = 'E:/datphu-backend/src/controllers/aiController.js';

const newAiControllerCode = `/**
 * ============================================================================
 * ĐẤT PHÚ CORE - AI ASSISTANT CONTROLLER (HYBRID VERTEX AI & LOCAL ENGINE)
 * Kết nối Google Cloud Vertex AI (Gemini 1.5 Flash) qua Service Account Key
 * ============================================================================
 */

const vertexAiClient = require('../core/vertexAiClient');
const cartStore = require('../modules/pos/cartStore');

// Khai báo Tools / Function Calling cho Vertex AI
const vertexTools = [{
  functionDeclarations: [
    {
      name: 'create_pos_order',
      description: 'Lên đơn hàng POS cho khách tại bàn hoặc mang về',
      parameters: {
        type: 'OBJECT',
        properties: {
          tableNumber: { type: 'STRING', description: 'Số bàn hoặc số phòng (VD: Bàn 02, Phòng 101)' },
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                quantity: { type: 'NUMBER' }
              }
            }
          }
        },
        required: ['tableNumber', 'items']
      }
    },
    {
      name: 'check_inventory',
      description: 'Kiểm tra tồn kho nguyên vật liệu pha chế (ml/g) và đặc sản OCOP',
      parameters: {
        type: 'OBJECT',
        properties: {
          productName: { type: 'STRING', description: 'Tên món hoặc nguyên vật liệu cần kiểm tra' }
        },
        required: ['productName']
      }
    },
    {
      name: 'dispatch_worker',
      description: 'Tìm kiếm và điều phối thợ kỹ thuật 6K (điện nước, điện lạnh, khóa)',
      parameters: {
        type: 'OBJECT',
        properties: {
          trade: { type: 'STRING', description: 'Nghề cần tìm (dien_nuoc, dien_lanh, sua_khoa)' },
          location: { type: 'STRING', description: 'Địa chỉ sự cố (VD: 86 Lê Duẩn, P.7, Tuy Hòa)' }
        },
        required: ['trade']
      }
    }
  ]
}];

async function handleAIChat(req, res, body = {}) {
  const { message = "" } = body;
  const q = message.toLowerCase().trim();

  // Kiểm tra trạng thái kết nối Google Cloud Vertex AI
  const vStatus = vertexAiClient.getVertexStatus();
  const vClient = vertexAiClient.getVertexClient();

  // 1. NẾU CÓ SERVICE ACCOUNT KEY VÀ KẾT NỐI VERTEX AI THÀNH CÔNG
  if (vStatus.connected && vClient) {
    try {
      const model = vClient.preview.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: 'Bạn là Trợ lý AI Đất Phú Core điều hành tại Thanh Giang Hometel & Cafe, 86 Lê Duẩn, TP. Tuy Hòa. Bạn có quyền tạo đơn hàng POS, kiểm tra đa kho (ml/g & Hộp/kg) và điều phối thợ kỹ thuật 6K.',
        tools: vertexTools
      });

      const chatSession = model.startChat();
      const result = await chatSession.sendMessage(message);
      const candidates = result.response.candidates;

      if (candidates && candidates.length > 0) {
        const part = candidates[0].content.parts[0];

        // Nếu Vertex AI gọi Tool (Function Calling)
        if (part && part.functionCall) {
          const { name, args } = part.functionCall;
          let responseType = 'general';
          let payload = { action: name, args };

          if (name === 'create_pos_order') {
            responseType = 'pos_order';
            payload = {
              action: 'CREATE_ORDER',
              tableNumber: args.tableNumber || 'Bàn Quầy',
              suggestedItems: args.items || [],
              replyText: \`[Vertex AI] Đã lên đơn cho \${args.tableNumber || 'quầy'}: \${(args.items || []).map(i => i.quantity + 'x ' + i.name).join(', ')}!\`
            };
          } else if (name === 'check_inventory') {
            responseType = 'inventory_check';
            const check = cartStore.validateCartInventory([{ name: args.productName, qty: 1 }]);
            payload = {
              action: 'INVENTORY_RESULT',
              productName: args.productName,
              checkResult: check,
              replyText: \`[Vertex AI] Kiểm tra kho: \${check.valid ? 'Đủ tồn kho khả dụng' : check.errors.join('; ')}\`
            };
          } else if (name === 'dispatch_worker') {
            responseType = 'worker_dispatch';
            payload = {
              action: 'SUGGEST_WORKER',
              trade: args.trade,
              workerName: args.trade.includes('dien_lanh') ? 'Trần Quốc Hùng (Điện Lạnh)' : 'Nguyễn Văn Tùng (Điện Nước)',
              phone: '0912.345.678',
              eta: '15 phút',
              replyText: \`[Vertex AI] Đã điều phối thợ \${args.trade} tới hỗ trợ tại \${args.location || '86 Lê Duẩn'} trong 15 phút!\`
            };
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            provider: 'vertex_ai_gemini_1.5_flash',
            projectId: vStatus.projectId,
            responseType,
            payload
          }));
        }

        // Đàm thoại văn bản thông thường từ Vertex AI
        if (part && part.text) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            provider: 'vertex_ai_gemini_1.5_flash',
            projectId: vStatus.projectId,
            responseType: 'general',
            payload: {
              action: 'ASSISTANT_REPLY',
              replyText: part.text
            }
          }));
        }
      }
    } catch (err) {
      console.warn('[Vertex AI Chat Error - Fallback to Local Engine]:', err.message);
    }
  }

  // 2. FALLBACK: CƠ CHẾ NỘI BỘ THÔNG MINH (KHI CHỜ NẠP SERVICE ACCOUNT KEY)
  let responseType = "general";
  let payload = {};

  if (q.includes('bán') || q.includes('cafe') || q.includes('bánh mì') || q.includes('order')) {
    responseType = "pos_order";
    payload = {
      action: "CREATE_ORDER",
      suggestedItems: [
        { name: "Cà phê Sữa Đá Tuy Hòa", qty: 2, price: 40000 },
        { name: "Bánh Mì Chả Cá Nóng", qty: 1, price: 20000 }
      ],
      totalAmount: 60000,
      replyText: "Đã phân tích yêu cầu bán hàng! Tổng cộng 60.000 đ cho 2 ly cafe sữa đá và 1 bánh mì chả cá."
    };
  } else if (q.includes('chập điện') || q.includes('điện') || q.includes('nước') || q.includes('thợ')) {
    responseType = "worker_dispatch";
    payload = {
      action: "SUGGEST_WORKER",
      workerId: "THO-01",
      workerName: "Nguyễn Văn Tùng (Chú Tùng)",
      phone: "0912345678",
      trade: "Điện Nước & Lắp Máy Bơm",
      eta: "15 phút",
      replyText: "Đã phát hiện sự cố điện nước! Đề xuất Chú Tùng (Phường 7, Tuy Hòa) có mặt trong 15 phút."
    };
  } else if (q.includes('tủ đông') || q.includes('tủ mát') || q.includes('máy lạnh') || q.includes('gas')) {
    responseType = "worker_dispatch";
    payload = {
      action: "SUGGEST_WORKER",
      workerId: "THO-02",
      workerName: "Trần Quốc Hùng",
      phone: "0987654321",
      trade: "Điện Lạnh & Tủ Đông Minh Phát",
      eta: "20 phút",
      replyText: "Đã phát hiện sự cố tủ mát/điện lạnh! Đề xuất Anh Hùng (Phường 5, Tuy Hòa) kiểm tra và bơm gas."
    };
  } else if (q.includes('thuế') || q.includes('thông tư') || q.includes('123')) {
    responseType = "tax_info";
    payload = {
      action: "TAX_EXPLANATION",
      rate: "4.5% (Ăn uống / Cafe)",
      replyText: "Theo Thông tư 40/2021/TT-BTC & NĐ 123/2020/NĐ-CP, dịch vụ ăn uống & cà phê chịu thuế suất 4.5% (3% GTGT + 1.5% TNCN). Hóa đơn máy tính tiền ký hiệu 1C26MDP."
    };
  } else {
    payload = {
      action: "ASSISTANT_REPLY",
      replyText: \`Trợ lý AI Đất Phú đã ghi nhận: "\${message}". Bạn có thể yêu cầu bán hàng, kiểm tra kho hoặc điều phối thợ kỹ thuật.\`
    };
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    provider: 'local_smart_engine',
    vertexStatus: vStatus,
    responseType,
    payload
  }));
}

module.exports = {
  handleAIChat
};
`;

fs.writeFileSync(aiControllerPath, newAiControllerCode, 'utf8');
console.log('Successfully updated aiController.js with Vertex AI Gemini 1.5 Flash + Tools!');

// 2. Update src/server.js with GET /api/ai/vertex-status
const serverPath = 'E:/datphu-backend/src/server.js';
let serverCode = fs.readFileSync(serverPath, 'utf8');

const statusRoute = `  // Trạng thái kết nối Google Cloud Vertex AI
  if (pathname === '/api/ai/vertex-status' && req.method === 'GET') {
    const vertexAiClient = require('./core/vertexAiClient');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(vertexAiClient.getVertexStatus()));
  }
`;

if (!serverCode.includes('/api/ai/vertex-status')) {
  serverCode = serverCode.replace("if (pathname === '/api/ai/chat' && req.method === 'POST') {", statusRoute + "\n  if (pathname === '/api/ai/chat' && req.method === 'POST') {");
  fs.writeFileSync(serverPath, serverCode, 'utf8');
  console.log('Successfully added /api/ai/vertex-status to server.js');
}
