const { getOrders, saveOrders, broadcastSSE } = require('./posController');

function handleBankWebhook(req, res, body, sseClients) {
  try {
    // 1. Kiểm tra xác thực Token (Nội bộ hoặc Gateway)
    const secret = req.headers['secure-token'] || req.headers['authorization'];
    const expectedSecret = process.env.BANK_WEBHOOK_SECRET || 'datphu_secure_token_2026';

    // Cho phép test demo nếu không truyền header
    if (secret && secret !== expectedSecret && !secret.includes(expectedSecret)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized Webhook' }));
    }

    const {
      amount = 0,
      content = '',
      transactionId = `TX-${Date.now()}`
    } = body;

    // 2. Trích xuất mã đơn hàng bằng Regex (tìm tiền tố AS)
    const match = content.match(/AS\d+/i);
    if (!match) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Webhook nhận nhưng không thấy mã đơn AS trong nội dung' }));
    }
    const orderCode = match[0].toUpperCase();

    // 3. Đối soát với Database
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.orderCode === orderCode);

    if (orderIndex === -1) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: `Không tìm thấy đơn hàng ${orderCode}` }));
    }

    const targetOrder = orders[orderIndex];

    // 4. Kiểm tra số tiền
    if (Number(amount) > 0 && Number(amount) < Number(targetOrder.totalAmount)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `Số tiền thanh toán ${amount} thấp hơn giá trị đơn ${targetOrder.totalAmount}` }));
    }

    // 5. Cập nhật trạng thái 'completed'
    targetOrder.paymentStatus = 'completed';
    targetOrder.paidAt = new Date().toISOString();
    targetOrder.transactionId = transactionId;
    orders[orderIndex] = targetOrder;
    saveOrders(orders);

    // 6. Phát sóng Realtime SSE tức thì (< 2s) đến máy thu ngân
    broadcastSSE(sseClients, 'ORDER_PAID', {
      orderId: targetOrder.id,
      orderCode: targetOrder.orderCode,
      amount: targetOrder.totalAmount,
      method: 'vietqr',
      transactionId,
      paidAt: targetOrder.paidAt
    });

    console.log(`[BANK WEBHOOK] Ting Ting! Đã nhận ${targetOrder.totalAmount}đ cho đơn ${orderCode}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Khớp tiền thành công!',
      orderCode,
      amount: targetOrder.totalAmount
    }));

  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = {
  handleBankWebhook
};
