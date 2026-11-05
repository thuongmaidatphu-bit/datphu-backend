/**
 * ============================================================================
 * ĐẤT PHÚ CORE - AI ASSISTANT CONTROLLER (THƯƠNG HIỆU ĐẤT PHÚ)
 * Bộ não xử lý tác vụ thông minh độc quyền cho Hệ Sinh Thái Đất Phú
 * ============================================================================
 */

const vertexAiClient = require('../core/vertexAiClient');
const cartStore = require('../modules/pos/cartStore');

// Khai báo Tools / Nghiệp vụ cho Trợ Lý AI Đất Phú
const datphuTools = [{
  functionDeclarations: [
    {
      name: 'create_pos_order',
      description: 'Lên đơn hàng POS cho khách tại bàn hoặc mang về',
      parameters: {
        type: 'OBJECT',
        properties: {
          tableNumber: { type: 'STRING', description: 'Số bàn hoặc số phòng (VD: Bàn 02, Phòng 101, Bàn Quầy)' },
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING', description: 'Tên món ăn, đồ uống hoặc đặc sản Đất Phú' },
                quantity: { type: 'NUMBER', description: 'Số lượng' }
              },
              required: ['name', 'quantity']
            }
          }
        },
        required: ['tableNumber', 'items']
      }
    },
    {
      name: 'check_inventory',
      description: 'Kiểm tra tồn kho nguyên vật liệu pha chế (ml/g) và đặc sản Đất Phú OCOP (Hộp/Gói/Kg)',
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
      description: 'Tìm kiếm và điều phối thợ kỹ thuật Đất Phú 6K (điện nước, điện lạnh, máy bơm, khóa)',
      parameters: {
        type: 'OBJECT',
        properties: {
          trade: { type: 'STRING', description: 'Nghề cần tìm (dien_nuoc, dien_lanh, sua_khoa, may_bom)' },
          location: { type: 'STRING', description: 'Địa chỉ xảy ra sự cố (VD: Cửa hàng Đất Phú)' }
        },
        required: ['trade']
      }
    }
  ]
}];

async function handleAIChat(req, res, body = {}) {
  const { message = "" } = body;
  const q = message.toLowerCase().trim();

  // Kiểm tra trạng thái Bộ não AI Đất Phú
  const { genAIClient, vertexClient, status } = vertexAiClient.getGenAI();

  // 1. KẾT NỐI QUA BỘ NÃO THÔNG MINH ĐẤT PHÚ
  if (status.connected && (genAIClient || vertexClient)) {
    try {
      let part = null;

      if (genAIClient) {
        const model = genAIClient.getGenerativeModel({
          model: 'gemini-3.5-flash',
          systemInstruction: 'Bạn là Trợ lý AI Thông Minh Đất Phú POS (Hệ sinh thái Đất Phú 6K). Bạn hỗ trợ thu ngân lên đơn, kiểm tra tồn kho đa kho (ml/g đồ uống & Hộp/kg OCOP Đất Phú) và điều phối thợ kỹ thuật 6K. Luôn trả lời với phong cách Đất Phú nhanh gọn, chuyên nghiệp, hiếu khách.',
          tools: datphuTools
        });

        const chatSession = model.startChat();
        const result = await chatSession.sendMessage(message);
        const candidates = result.response.candidates;
        if (candidates && candidates.length > 0) {
          part = candidates[0].content && candidates[0].content.parts ? candidates[0].content.parts[0] : null;
        }
      } else if (vertexClient) {
        const model = vertexClient.preview.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: 'Bạn là Trợ lý AI Thông Minh Đất Phú POS điều hành hệ sinh thái Đất Phú 6K.',
          tools: datphuTools
        });
        const chatSession = model.startChat();
        const result = await chatSession.sendMessage(message);
        const candidates = result.response.candidates;
        if (candidates && candidates.length > 0) {
          part = candidates[0].content && candidates[0].content.parts ? candidates[0].content.parts[0] : null;
        }
      }

      // Xử lý khi AI gọi Nghiệp Vụ (Function Calling)
      if (part && part.functionCall) {
        const { name, args } = part.functionCall;
        let responseType = 'general';
        let payload = { action: name, args };

        if (name === 'create_pos_order') {
          responseType = 'pos_order';
          const table = args.tableNumber ? (args.tableNumber.toLowerCase().includes('bàn') ? args.tableNumber : 'Bàn ' + args.tableNumber) : 'Bàn Quầy';
          const items = (args.items || []).map(it => ({
            name: it.name,
            qty: it.quantity || 1,
            price: it.name.toLowerCase().includes('bò') ? 185000 : (it.name.toLowerCase().includes('cà phê') || it.name.toLowerCase().includes('cafe') ? 25000 : 35000)
          }));
          const totalAmount = items.reduce((sum, it) => sum + (it.price * it.qty), 0);

          payload = {
            action: 'CREATE_ORDER',
            tableNumber: table,
            suggestedItems: items,
            totalAmount,
            replyText: `[AI Đất Phú] Đã lên đơn cho ${table}: ${items.map(i => i.qty + 'x ' + i.name).join(', ')} (Tổng: ${totalAmount.toLocaleString('vi-VN')} đ)!`
          };
        } else if (name === 'check_inventory') {
          responseType = 'inventory_check';
          const check = cartStore.validateCartInventory([{ name: args.productName, qty: 1 }]);
          payload = {
            action: 'INVENTORY_RESULT',
            productName: args.productName,
            checkResult: check,
            replyText: `[AI Đất Phú] Kiểm tra kho cho "${args.productName}": ${check.valid ? '✅ Đủ tồn kho khả dụng!' : '⚠️ ' + check.errors.join('; ')}`
          };
        } else if (name === 'dispatch_worker') {
          responseType = 'worker_dispatch';
          const isLanh = args.trade && (args.trade.includes('lanh') || args.trade.includes('mát') || args.trade.includes('đông'));
          payload = {
            action: 'SUGGEST_WORKER',
            trade: args.trade,
            workerName: isLanh ? 'Trần Quốc Hùng (Điện Lạnh Đất Phú)' : 'Nguyễn Văn Tùng (Thợ Điện Nước Đất Phú)',
            phone: isLanh ? '0987.654.321' : '0912.345.678',
            eta: '15 phút',
            replyText: `[AI Đất Phú] Đã điều phối thợ ${args.trade} tới hỗ trợ tại ${args.location || 'cửa hàng Đất Phú'} trong 15 phút!`
          };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          provider: 'datphu_ai_core',
          model: 'Đất Phú AI Pro',
          responseType,
          payload
        }));
      }

      // Đàm thoại văn bản thông thường từ AI
      if (part && part.text) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          provider: 'datphu_ai_core',
          model: 'Đất Phú AI Pro',
          responseType: 'general',
          payload: {
            action: 'ASSISTANT_REPLY',
            replyText: part.text
          }
        }));
      }
    } catch (err) {
      console.warn('[AI Đất Phú Chat Error - Fallback to Local Engine]:', err.message);
    }
  }

  // 2. FALLBACK: ĐẤT PHÚ OFFLINE ENGINE (KHI MẤT KẾT NỐI MẠNG)
  let responseType = "general";
  let payload = {};

  if (q.includes('bán') || q.includes('cafe') || q.includes('bánh mì') || q.includes('order')) {
    responseType = "pos_order";
    payload = {
      action: "CREATE_ORDER",
      tableNumber: "Bàn 02",
      suggestedItems: [
        { name: "Cà phê Sữa Đá Đất Phú", qty: 2, price: 40000 },
        { name: "Bánh Mì Chả Cá Đất Phú", qty: 1, price: 20000 }
      ],
      totalAmount: 60000,
      replyText: "[AI Đất Phú] Đã phân tích yêu cầu bán hàng! Tổng cộng 60.000 đ cho 2 ly cafe sữa đá và 1 bánh mì chả cá."
    };
  } else if (q.includes('chập điện') || q.includes('điện') || q.includes('nước') || q.includes('thợ')) {
    responseType = "worker_dispatch";
    payload = {
      action: "SUGGEST_WORKER",
      workerId: "THO-01",
      workerName: "Nguyễn Văn Tùng (Thợ Đất Phú 6K)",
      phone: "0912345678",
      trade: "Điện Nước & Lắp Máy Bơm",
      eta: "15 phút",
      replyText: "[AI Đất Phú] Đã phát hiện sự cố điện nước! Đề xuất Chú Tùng (Phường 7, Tuy Hòa) có mặt trong 15 phút."
    };
  } else if (q.includes('tủ đông') || q.includes('tủ mát') || q.includes('máy lạnh') || q.includes('gas')) {
    responseType = "worker_dispatch";
    payload = {
      action: "SUGGEST_WORKER",
      workerId: "THO-02",
      workerName: "Trần Quốc Hùng (Điện Lạnh Đất Phú 6K)",
      phone: "0987654321",
      trade: "Điện Lạnh & Tủ Đông",
      eta: "20 phút",
      replyText: "[AI Đất Phú] Đã phát hiện sự cố tủ mát/điện lạnh! Đề xuất Anh Hùng (Phường 5, Tuy Hòa) kiểm tra và bơm gas."
    };
  } else {
    payload = {
      action: "ASSISTANT_REPLY",
      replyText: `[AI Đất Phú] Đã ghi nhận: "${message}". Bạn có thể ra lệnh bằng giọng nói để lên đơn POS, kiểm tra tồn kho hoặc gọi thợ 6K.`
    };
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    provider: 'datphu_ai_core',
    aiStatus: status,
    responseType,
    payload
  }));
}

module.exports = {
  handleAIChat
};
