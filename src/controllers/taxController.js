// Trợ lý Thuế & Hóa đơn điện tử máy tính tiền Đất Phú Core
function handleCalculateTax(req, res, body) {
  const { revenue = 0, businessType = 'fnb' } = body;
  
  // Tỷ lệ thuế theo Thông tư 40/2021/TT-BTC
  let vatRate = 0.03; // 3% GTGT cho ăn uống/cafe
  let pitRate = 0.015; // 1.5% TNCN cho ăn uống
  
  if (businessType === 'retail') {
    vatRate = 0.01;
    pitRate = 0.005;
  } else if (businessType === 'accommodation') {
    vatRate = 0.05;
    pitRate = 0.02;
  }

  const vatAmount = Math.round(revenue * vatRate);
  const pitAmount = Math.round(revenue * pitRate);
  const totalTax = vatAmount + pitAmount;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    revenue,
    businessType,
    taxFormula: `GTGT (${(vatRate * 100)}%) + TNCN (${(pitRate * 100)}%) = ${(vatRate + pitRate) * 100}%`,
    vatAmount,
    pitAmount,
    totalTax,
    thresholdExceeded: revenue * 12 > 100000000,
    recommendation: "Ví An Sinh tự động phân tách doanh thu thanh toán không dùng tiền mặt, khớp chuẩn Thông tư 40."
  }));
}

function handleIssueEInvoice(req, res, body) {
  const { orderCode, totalAmount, merchantTaxCode = "8401234567", storeName = "Cà phê Tuy Hòa" } = body;
  const invoiceNo = `HD-${Date.now().toString().slice(-6)}`;
  const lookupCode = `DP78-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    invoiceNo,
    templateSeries: "1C26MDP",
    issueDate: new Date().toISOString(),
    sellerTaxCode: merchantTaxCode,
    sellerName: storeName,
    totalAmount,
    lookupCode,
    lookupUrl: `https://tracuu.datphu.vn/einvoice?code=${lookupCode}`,
    taxAuthorityStatus: "ACCEPTED_BY_TAX_AUTHORITY_PHUYEN"
  }));
}

module.exports = {
  handleCalculateTax,
  handleIssueEInvoice
};
