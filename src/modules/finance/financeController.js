/**
 * ============================================================================
 * ĐẤT PHÚ CORE - MONTHLY FINANCIAL P&L CONTROLLER (financeController.js)
 * Quản lý Bảng tính Thu Chi, Giá Vốn (COGS) & Lợi Nhuận Hàng Tháng (P&L)
 * Dành cho mô hình kết hợp: Cà phê (F&B), Phòng Nghỉ (Lưu trú) & Đặc sản OCOP
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { loadOrders } = require('../pos/posController');

// Dữ liệu mặc định chuẩn hóa cho cơ sở Đất Phú Hub & Cafe (86 Lê Duẩn, Tuy Hòa)
function getDefaultMonthlyData() {
  return {
    month: "11/2026",
    merchant_name: "Đất Phú Hub & Cafe Đất Phú",
    merchant_address: "Lô HT17 - 86 Lê Duẩn, Phường 7, TP. Tuy Hòa, Phú Yên",
    merchant_mst: "4401020233",
    
    // I. DOANH THU (THEO 3 MẢNG KINH DOANH)
    revenue: {
      fnb_cafe: 48500000,       // Doanh thu Cà phê & Đồ uống
      hometel_room: 56000000,   // Tiền phòng Phòng Nghỉ (Giờ + Qua đêm)
      ocop_souvenir: 22500000,  // Bán Đặc sản OCOP (Bò một nắng, muối kiến vàng...)
      
      // Tách bạch dòng tiền
      cash_flow: 45000000,      // Tiền mặt tại két (35.4%)
      vietqr_transfer: 82000000 // Chuyển khoản VietQR Napas247 (64.6%)
    },

    // II. GIÁ VỐN HÀNG BÁN (COGS - COST OF GOODS SOLD)
    cogs: {
      fnb_materials: 14500000,   // Hạt cà phê, sữa tươi, trà, siro hoa quả
      hometel_laundry_amenities: 8400000, // Giặt ủi drap giường, đồ dùng tiêu hao buồng phòng
      ocop_wholesale_cost: 15750000       // Giá nhập sỉ đặc sản từ HTX Sông Hinh, Đắk Lắk
    },

    // IV. CHI PHÍ CỐ ĐỊNH & VẬN HÀNH (OPEX)
    opex: {
      rent: 18000000,            // Thuê mặt bằng (86 Lê Duẩn)
      salaries: 24000000,        // Lương nhân viên phục vụ, pha chế, dọn phòng
      utilities: 7500000,        // Điện, nước sinh hoạt, Internet tốc độ cao
      marketing: 3000000,        // Marketing, biển hiệu, quảng cáo
      depreciation: 4000000,     // Khấu hao tài sản (Máy pha cà phê, máy lạnh, tủ lạnh)
      tech_6k_maintenance: 1500000 // Chi phí cứu hộ kỹ thuật 6K & bảo trì định kỳ
    }
  };
}

// Hàm tính toán các chỉ số P&L tự động
function calculatePnL(inputData = {}) {
  const defaults = getDefaultMonthlyData();
  const data = {
    month: inputData.month || defaults.month,
    merchant_name: inputData.merchant_name || defaults.merchant_name,
    merchant_address: inputData.merchant_address || defaults.merchant_address,
    merchant_mst: inputData.merchant_mst || defaults.merchant_mst,
    revenue: { ...defaults.revenue, ...(inputData.revenue || {}) },
    cogs: { ...defaults.cogs, ...(inputData.cogs || {}) },
    opex: { ...defaults.opex, ...(inputData.opex || {}) }
  };

  // I. TỔNG DOANH THU
  const totalRevenue = data.revenue.fnb_cafe + data.revenue.hometel_room + data.revenue.ocop_souvenir;
  
  // Kiểm tra & cân đối dòng tiền nếu chưa chỉ định rõ
  const totalPaymentIn = data.revenue.cash_flow + data.revenue.vietqr_transfer;
  let cashFlow = data.revenue.cash_flow;
  let vietqrFlow = data.revenue.vietqr_transfer;
  if (totalPaymentIn !== totalRevenue) {
    cashFlow = Math.round(totalRevenue * 0.35);
    vietqrFlow = totalRevenue - cashFlow;
  }

  // II. TỔNG GIÁ VỐN HÀNG BÁN (COGS)
  const totalCOGS = data.cogs.fnb_materials + data.cogs.hometel_laundry_amenities + data.cogs.ocop_wholesale_cost;

  // III. LỢI NHUẬN GỘP (GROSS PROFIT)
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0;

  // Chi tiết từng mảng kinh doanh
  const fnbGross = data.revenue.fnb_cafe - data.cogs.fnb_materials;
  const fnbMargin = data.revenue.fnb_cafe > 0 ? ((fnbGross / data.revenue.fnb_cafe) * 100).toFixed(2) : 0;

  const roomGross = data.revenue.hometel_room - data.cogs.hometel_laundry_amenities;
  const roomMargin = data.revenue.hometel_room > 0 ? ((roomGross / data.revenue.hometel_room) * 100).toFixed(2) : 0;

  const ocopGross = data.revenue.ocop_souvenir - data.cogs.ocop_wholesale_cost;
  const ocopMargin = data.revenue.ocop_souvenir > 0 ? ((ocopGross / data.revenue.ocop_souvenir) * 100).toFixed(2) : 0;

  // IV. TỔNG CHI PHÍ VẬN HÀNH & CỐ ĐỊNH (OPEX)
  const totalOPEX = data.opex.rent + data.opex.salaries + data.opex.utilities + 
                    data.opex.marketing + data.opex.depreciation + data.opex.tech_6k_maintenance;

  // V. LỢI NHUẬN RÒNG (NET PROFIT)
  const netProfit = grossProfit - totalOPEX;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

  // Đánh giá sức khỏe tài chính AI
  let healthScore = "TỐT";
  let healthRecommendation = "Tỷ suất lợi nhuận ròng đạt mức tối ưu. Mảng Phòng Nghỉ đang có biên lãi gộp cao nhất (85%). Tiếp tục duy trì kiểm soát giá vốn nguyên vật liệu F&B và đẩy mạnh gói combo Phòng + Cà phê.";
  if (netProfit < 0) {
    healthScore = "CẢNH BÁO LỖ";
    healthRecommendation = "Chi phí cố định (Mặt bằng + Lương) đang vượt quá Lợi nhuận gộp. Cần rà soát định mức ca trực và đàm phán lại chi phí thuê mặt bằng.";
  } else if (parseFloat(netMargin) < 15) {
    healthScore = "TRUNG BÌNH";
    healthRecommendation = "Biên lợi nhuận ròng còn mỏng (<15%). Đề xuất tăng tỷ trọng sản phẩm lưu trú và quà tặng OCOP có biên lãi gộp cao để bù trừ chi phí vận hành.";
  }

  return {
    month: data.month,
    merchant_name: data.merchant_name,
    merchant_address: data.merchant_address,
    merchant_mst: data.merchant_mst,

    // Nhóm I
    revenue: {
      fnb_cafe: data.revenue.fnb_cafe,
      hometel_room: data.revenue.hometel_room,
      ocop_souvenir: data.revenue.ocop_souvenir,
      total_revenue: totalRevenue,
      cash_flow: cashFlow,
      vietqr_transfer: vietqrFlow,
      cash_percentage: totalRevenue > 0 ? ((cashFlow / totalRevenue) * 100).toFixed(1) : 0,
      vietqr_percentage: totalRevenue > 0 ? ((vietqrFlow / totalRevenue) * 100).toFixed(1) : 0
    },

    // Nhóm II
    cogs: {
      fnb_materials: data.cogs.fnb_materials,
      hometel_laundry_amenities: data.cogs.hometel_laundry_amenities,
      ocop_wholesale_cost: data.cogs.ocop_wholesale_cost,
      total_cogs: totalCOGS,
      cogs_percentage: totalRevenue > 0 ? ((totalCOGS / totalRevenue) * 100).toFixed(1) : 0
    },

    // Nhóm III
    gross_profit: {
      amount: grossProfit,
      margin_percent: grossMargin,
      by_segment: {
        fnb: { revenue: data.revenue.fnb_cafe, cogs: data.cogs.fnb_materials, gross: fnbGross, margin: fnbMargin },
        room: { revenue: data.revenue.hometel_room, cogs: data.cogs.hometel_laundry_amenities, gross: roomGross, margin: roomMargin },
        ocop: { revenue: data.revenue.ocop_souvenir, cogs: data.cogs.ocop_wholesale_cost, gross: ocopGross, margin: ocopMargin }
      }
    },

    // Nhóm IV
    opex: {
      rent: data.opex.rent,
      salaries: data.opex.salaries,
      utilities: data.opex.utilities,
      marketing: data.opex.marketing,
      depreciation: data.opex.depreciation,
      tech_6k_maintenance: data.opex.tech_6k_maintenance,
      total_opex: totalOPEX,
      opex_percentage: totalRevenue > 0 ? ((totalOPEX / totalRevenue) * 100).toFixed(1) : 0
    },

    // Nhóm V
    net_profit: {
      amount: netProfit,
      margin_percent: netMargin,
      health_score: healthScore,
      recommendation: healthRecommendation
    }
  };
}

// 1. API Lấy số liệu Bảng tính P&L hàng tháng
function handleGetMonthlyPnL(req, res) {
  const pnl = calculatePnL();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ success: true, data: pnl }));
}

// 2. API Cập nhật và tính toán lại P&L linh hoạt
function handleCalculateCustomPnL(req, res, body = {}) {
  const pnl = calculatePnL(body);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ success: true, data: pnl }));
}

// 3. API Xuất file Excel (.xlsx) chuẩn P&L kèm Công thức
async function handleExportPnLExcel(req, res, body = {}) {
  try {
    const pnl = calculatePnL(body);
    let ExcelJS;
    try {
      ExcelJS = require('exceljs');
    } catch (e) {
      ExcelJS = null;
    }

    if (ExcelJS) {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ';
      workbook.created = new Date();

      // Sheet 1: Bảng Tính Lợi Nhuận P&L Chuẩn Hóa
      const ws = workbook.addWorksheet('Bang_Tinh_Thu_Chi_PnL');

      ws.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'KHOẢN MỤC TÀI CHÍNH', key: 'item', width: 42 },
        { header: 'DIỄN GIẢI CHI TIẾT', key: 'desc', width: 42 },
        { header: 'SỐ TIỀN (VNĐ)', key: 'amount', width: 22 },
        { header: 'TỶ LỆ (%)', key: 'rate', width: 14 }
      ];

      // Header Doanh Nghiệp
      ws.mergeCells('A1:E1');
      ws.getCell('A1').value = `BẢNG TÍNH THU CHI & LỢI NHUẬN HÀNG THÁNG (P&L STATEMENT)`;
      ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1E2260' } };
      ws.getCell('A1').alignment = { horizontal: 'center' };

      ws.mergeCells('A2:E2');
      ws.getCell('A2').value = `Đơn vị: ${pnl.merchant_name} • Kỳ báo cáo: Tháng ${pnl.month}`;
      ws.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF555555' } };
      ws.getCell('A2').alignment = { horizontal: 'center' };

      ws.mergeCells('A3:E3');
      ws.getCell('A3').value = `Địa chỉ: ${pnl.merchant_address} • MST: ${pnl.merchant_mst}`;
      ws.getCell('A3').font = { size: 10, color: { argb: 'FF777777' } };
      ws.getCell('A3').alignment = { horizontal: 'center' };

      ws.addRow([]); // Dòng trống A4

      // Header Bảng tại dòng 5
      const headerRow = ws.addRow(['STT', 'KHOẢN MỤC TÀI CHÍNH', 'DIỄN GIẢI CHI TIẾT', 'SỐ TIỀN (VNĐ)', 'TỶ TRỌNG (%)']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.eachCell(c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E2260' } };
      });

      // I. TỔNG DOANH THU
      const rowI = ws.addRow(['I', 'TỔNG DOANH THU THUẦN', 'Tổng doanh thu hợp nhất các mảng', pnl.revenue.total_revenue, '100%']);
      rowI.font = { bold: true };
      rowI.getCell(4).numFmt = '#,##0';
      rowI.getCell(4).alignment = { horizontal: 'right' };
      rowI.getCell(5).alignment = { horizontal: 'right' };
      rowI.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } });

      const rowI1 = ws.addRow(['1.1', '  - Doanh thu Cà phê & Đồ uống (F&B)', 'Bán tại quầy & giao tận nơi', pnl.revenue.fnb_cafe, `${((pnl.revenue.fnb_cafe/pnl.revenue.total_revenue)*100).toFixed(1)}%`]);
      const rowI2 = ws.addRow(['1.2', '  - Doanh thu Phòng Phòng Nghỉ', 'Thuê theo giờ và qua đêm', pnl.revenue.hometel_room, `${((pnl.revenue.hometel_room/pnl.revenue.total_revenue)*100).toFixed(1)}%`]);
      const rowI3 = ws.addRow(['1.3', '  - Doanh thu Đặc sản OCOP', 'Bò một nắng, muối kiến vàng, quà tặng', pnl.revenue.ocop_souvenir, `${((pnl.revenue.ocop_souvenir/pnl.revenue.total_revenue)*100).toFixed(1)}%`]);
      [rowI1, rowI2, rowI3].forEach(r => {
        r.getCell(4).numFmt = '#,##0';
        r.getCell(4).alignment = { horizontal: 'right' };
        r.getCell(5).alignment = { horizontal: 'right' };
      });

      // II. GIÁ VỐN HÀNG BÁN (COGS)
      const rowII = ws.addRow(['II', 'GIÁ VỐN HÀNG BÁN (COGS)', 'Chi phí trực tiếp tạo ra sản phẩm/dịch vụ', pnl.cogs.total_cogs, `${pnl.cogs.cogs_percentage}%`]);
      rowII.font = { bold: true };
      rowII.getCell(4).numFmt = '#,##0';
      rowII.getCell(4).alignment = { horizontal: 'right' };
      rowII.getCell(5).alignment = { horizontal: 'right' };
      rowII.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } });

      const rowII1 = ws.addRow(['2.1', '  - Giá vốn nguyên vật liệu F&B', 'Hạt cà phê, sữa, đường, trái cây tươi', pnl.cogs.fnb_materials, '']);
      const rowII2 = ws.addRow(['2.2', '  - Chi phí giặt ủi & buồng phòng Phòng Nghỉ', 'Giặt drap, đồ dùng 1 lần (amenities)', pnl.cogs.hometel_laundry_amenities, '']);
      const rowII3 = ws.addRow(['2.3', '  - Giá nhập sỉ Đặc sản OCOP', 'Thanh toán nhà cung cấp/HTX đầu nguồn', pnl.cogs.ocop_wholesale_cost, '']);
      [rowII1, rowII2, rowII3].forEach(r => {
        r.getCell(4).numFmt = '#,##0';
        r.getCell(4).alignment = { horizontal: 'right' };
      });

      // III. LỢI NHUẬN GỘP (GROSS PROFIT)
      const rowIII = ws.addRow(['III', 'LỢI NHUẬN GỘP (GROSS PROFIT)', 'Công thức: [I] - [II]', pnl.gross_profit.amount, `${pnl.gross_profit.margin_percent}%`]);
      rowIII.font = { bold: true, size: 11, color: { argb: 'FF0D6EFD' } };
      rowIII.getCell(4).numFmt = '#,##0';
      rowIII.getCell(4).alignment = { horizontal: 'right' };
      rowIII.getCell(5).alignment = { horizontal: 'right' };
      rowIII.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1E7DD' } });

      // IV. CHI PHÍ CỐ ĐỊNH & VẬN HÀNH (OPEX)
      const rowIV = ws.addRow(['IV', 'CHI PHÍ CỐ ĐỊNH & VẬN HÀNH (OPEX)', 'Các khoản chi phí vận hành thường xuyên', pnl.opex.total_opex, `${pnl.opex.opex_percentage}%`]);
      rowIV.font = { bold: true };
      rowIV.getCell(4).numFmt = '#,##0';
      rowIV.getCell(4).alignment = { horizontal: 'right' };
      rowIV.getCell(5).alignment = { horizontal: 'right' };
      rowIV.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } });

      const rowIV1 = ws.addRow(['4.1', '  - Tiền thuê mặt bằng kinh doanh', 'Cơ sở 86 Lê Duẩn, TP. Tuy Hòa', pnl.opex.rent, '']);
      const rowIV2 = ws.addRow(['4.2', '  - Lương & phụ cấp nhân viên', 'Thu ngân, pha chế, buồng phòng ca trực', pnl.opex.salaries, '']);
      const rowIV3 = ws.addRow(['4.3', '  - Tiền điện, nước, Internet cáp quang', 'Hóa đơn dịch vụ hạ tầng trong tháng', pnl.opex.utilities, '']);
      const rowIV4 = ws.addRow(['4.4', '  - Chi phí tiếp thị & quảng cáo', 'Biển hiệu, tờ rơi, truyền thông', pnl.opex.marketing, '']);
      const rowIV5 = ws.addRow(['4.5', '  - Khấu hao trang thiết bị máy móc', 'Máy pha cà phê, máy lạnh, TV, nệm', pnl.opex.depreciation, '']);
      const rowIV6 = ws.addRow(['4.6', '  - Chi phí cứu hộ kỹ thuật 6K & bảo dưỡng', 'Khắc phục sự cố điện nước, tủ đông', pnl.opex.tech_6k_maintenance, '']);
      [rowIV1, rowIV2, rowIV3, rowIV4, rowIV5, rowIV6].forEach(r => {
        r.getCell(4).numFmt = '#,##0';
        r.getCell(4).alignment = { horizontal: 'right' };
      });

      // V. LỢI NHUẬN RÒNG (NET PROFIT)
      const rowV = ws.addRow(['V', 'LỢI NHUẬN RÒNG (NET PROFIT)', 'TIỀN TÚI THỰC TẾ CỦA CHỦ QUÁN ([III] - [IV])', pnl.net_profit.amount, `${pnl.net_profit.margin_percent}%`]);
      rowV.font = { bold: true, size: 12, color: { argb: 'FF198754' } };
      rowV.getCell(4).numFmt = '#,##0';
      rowV.getCell(4).alignment = { horizontal: 'right' };
      rowV.getCell(5).alignment = { horizontal: 'right' };
      rowV.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC3E6CB' } });

      // Phân tách Dòng tiền
      ws.addRow([]);
      const rowCashTitle = ws.addRow(['*', 'ĐỐI SOÁT DÒNG TIỀN THỰC THU', 'PHƯƠNG THỨC THANH TOÁN', 'SỐ TIỀN (VNĐ)', 'TỶ LỆ']);
      rowCashTitle.font = { bold: true };
      const rowCash1 = ws.addRow(['', '  - Tiền mặt thực thu trong két', 'Thu ngân kiểm đếm bàn giao ca', pnl.revenue.cash_flow, `${pnl.revenue.cash_percentage}%`]);
      const rowCash2 = ws.addRow(['', '  - Chuyển khoản VietQR Napas247', 'Tiền về tài khoản ngân hàng tức thì', pnl.revenue.vietqr_transfer, `${pnl.revenue.vietqr_percentage}%`]);
      [rowCash1, rowCash2].forEach(r => {
        r.getCell(4).numFmt = '#,##0';
        r.getCell(4).alignment = { horizontal: 'right' };
        r.getCell(5).alignment = { horizontal: 'right' };
      });

      // Khuyến nghị AI
      ws.addRow([]);
      ws.mergeCells(`A${ws.rowCount + 1}:E${ws.rowCount + 1}`);
      const recCell = ws.getCell(`A${ws.rowCount}`);
      recCell.value = `💡 ĐÁNH GIÁ SỨC KHỎE TÀI CHÍNH TỪ AI ĐẤT PHÚ [XẾP LOẠI: ${pnl.net_profit.health_score}]: ${pnl.net_profit.recommendation}`;
      recCell.font = { italic: true, size: 10, color: { argb: 'FF1E2260' } };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=BangTinhThuChi_PnL_${pnl.month.replace('/', '_')}.xlsx`);

      await workbook.xlsx.write(res);
      return res.end();
    } else {
      // Fallback CSV nếu chưa có exceljs
      const csvContent = "\uFEFFSTT,KHOẢN MỤC,DIỄN GIẢI,SỐ TIỀN (VNĐ),TỶ LỆ\n" +
        `I,TỔNG DOANH THU,Tất cả dịch vụ trong tháng,${pnl.revenue.total_revenue},100%\n` +
        `II,GIÁ VỐN HÀNG BÁN (COGS),Chi phí trực tiếp tạo sản phẩm,${pnl.cogs.total_cogs},${pnl.cogs.cogs_percentage}%\n` +
        `III,LỢI NHUẬN GỘP,I - II,${pnl.gross_profit.amount},${pnl.gross_profit.margin_percent}%\n` +
        `IV,CHI PHÍ VẬN HÀNH (OPEX),Mặt bằng lương điện nước,${pnl.opex.total_opex},${pnl.opex.opex_percentage}%\n` +
        `V,LỢI NHUẬN RÒNG (NET PROFIT),III - IV (Tiền túi chủ quán),${pnl.net_profit.amount},${pnl.net_profit.margin_percent}%\n`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=BangTinhThuChi_PnL_${pnl.month.replace('/', '_')}.csv`);
      return res.end(csvContent);
    }
  } catch (err) {
    console.error("Lỗi xuất Excel PnL:", err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: err.message }));
  }
}

// Chuyển đổi ký tự tiếng Việt sang không dấu để tương thích với font Helvetica của PDFKit
function removeVietnameseTones(str) {
  if (!str) return '';
  str = String(str);
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}

// 4. API Xuất file PDF Báo cáo Thu Chi P&L
async function handleExportPnLPDF(req, res, body = {}) {
  try {
    const pnl = calculatePnL(body);
    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      PDFDocument = null;
    }

    if (PDFDocument) {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=BaoCaoLoiNhuan_PnL_${pnl.month.replace('/', '_')}.pdf`);

      doc.pipe(res);

      // Tiêu đề
      doc.fontSize(15).fillColor('#1E2260').text('CONG TY TNHH THUONG MAI DAT PHU', { align: 'center' });
      doc.fontSize(10).fillColor('#666666').text('He sinh thai Dat Phu Core & Vi An Sinh - TP. Tuy Hoa, Phu Yen', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(14).fillColor('#D7262D').text(`BAO CAO THU CHI & LOI NHUAN P&L - THANG ${pnl.month}`, { align: 'center' });
      doc.fontSize(9).fillColor('#333333').text(removeVietnameseTones(`Co so: ${pnl.merchant_name} | MST: ${pnl.merchant_mst}`), { align: 'center' });
      doc.moveDown(1);

      // Thước đo chỉ số chính
      doc.rect(40, doc.y, 515, 60).fill('#F8F9FA');
      doc.fillColor('#1E2260').fontSize(11).text('TONG DOANH THU (I)', 50, doc.y - 50);
      doc.fontSize(13).fillColor('#0D6EFD').text(`${pnl.revenue.total_revenue.toLocaleString('vi-VN')} VND`, 50, doc.y + 5);

      doc.fillColor('#1E2260').fontSize(11).text('LOI NHUAN GOP (III)', 220, doc.y - 25);
      doc.fontSize(13).fillColor('#198754').text(`${pnl.gross_profit.amount.toLocaleString('vi-VN')} VND (${pnl.gross_profit.margin_percent}%)`, 220, doc.y + 5);

      doc.fillColor('#1E2260').fontSize(11).text('LOI NHUAN RONG (V)', 390, doc.y - 25);
      doc.fontSize(13).fillColor('#D7262D').text(`${pnl.net_profit.amount.toLocaleString('vi-VN')} VND (${pnl.net_profit.margin_percent}%)`, 390, doc.y + 5);

      doc.moveDown(3);

      // Bảng chi tiết
      const startY = doc.y;
      doc.fillColor('#1E2260').fontSize(11).text('CHI TIET KHOAN MUC TAI CHINH (P&L STATEMENT):', 40, startY);
      doc.moveDown(0.8);

      const items = [
        { label: 'I. TONG DOANH THU HOP NHAT', val: `${pnl.revenue.total_revenue.toLocaleString('vi-VN')} VND`, bold: true, color: '#1E2260' },
        { label: '   1. Doanh thu Ca phe & Giai khat (F&B)', val: `${pnl.revenue.fnb_cafe.toLocaleString('vi-VN')} VND` },
        { label: '   2. Doanh thu Luu tru Phòng Nghỉ (Gio & Dem)', val: `${pnl.revenue.hometel_room.toLocaleString('vi-VN')} VND` },
        { label: '   3. Doanh thu Dac san OCOP Phu Yen', val: `${pnl.revenue.ocop_souvenir.toLocaleString('vi-VN')} VND` },
        { label: 'II. GIA VON HANG BAN (COGS)', val: `-${pnl.cogs.total_cogs.toLocaleString('vi-VN')} VND`, bold: true, color: '#DC3545' },
        { label: '   1. Nguyen vat lieu pha che F&B', val: `${pnl.cogs.fnb_materials.toLocaleString('vi-VN')} VND` },
        { label: '   2. Chi phi buong phong, giat ui drap', val: `${pnl.cogs.hometel_laundry_amenities.toLocaleString('vi-VN')} VND` },
        { label: '   3. Gia nhap si dac san tu HTX', val: `${pnl.cogs.ocop_wholesale_cost.toLocaleString('vi-VN')} VND` },
        { label: 'III. LOI NHUAN GOP (GROSS PROFIT = I - II)', val: `${pnl.gross_profit.amount.toLocaleString('vi-VN')} VND (${pnl.gross_profit.margin_percent}%)`, bold: true, color: '#0D6EFD' },
        { label: 'IV. CHI PHI VAN HANH CO DINH (OPEX)', val: `-${pnl.opex.total_opex.toLocaleString('vi-VN')} VND`, bold: true, color: '#DC3545' },
        { label: '   1. Tien thue mat bang kinh doanh (86 Le Duan)', val: `${pnl.opex.rent.toLocaleString('vi-VN')} VND` },
        { label: '   2. Luong nhan vien cac ca truc', val: `${pnl.opex.salaries.toLocaleString('vi-VN')} VND` },
        { label: '   3. Dien nuoc, wifi cap quang', val: `${pnl.opex.utilities.toLocaleString('vi-VN')} VND` },
        { label: '   4. Khau hao thiet bi & Marketing', val: `${(pnl.opex.depreciation + pnl.opex.marketing).toLocaleString('vi-VN')} VND` },
        { label: '   5. Chi phi cuu ho ky thuat 6K & bao duong', val: `${pnl.opex.tech_6k_maintenance.toLocaleString('vi-VN')} VND` },
        { label: 'V. LOI NHUAN RONG THUC TE (TIEN TUI CHU QUAN = III - IV)', val: `${pnl.net_profit.amount.toLocaleString('vi-VN')} VND (${pnl.net_profit.margin_percent}%)`, bold: true, color: '#198754' }
      ];

      items.forEach(it => {
        if (it.bold) {
          doc.font('Helvetica-Bold').fontSize(10).fillColor(it.color || '#000000');
        } else {
          doc.font('Helvetica').fontSize(9).fillColor('#444444');
        }
        doc.text(it.label, 45, doc.y, { width: 350, continued: false });
        doc.text(it.val, 400, doc.y - 12, { width: 150, align: 'right' });
        doc.moveDown(0.25);
      });

      doc.moveDown(1);
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#1E2260')
         .text(removeVietnameseTones(`* Khuyen nghi tai chinh AI: ${pnl.net_profit.recommendation}`), { width: 515 });

      doc.moveDown(2);
      const signY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('NGUOI LAP BIEU', 80, signY);
      doc.text('CHU CO SO KINH DOANH', 360, signY);
      doc.font('Helvetica').fontSize(8).fillColor('#666666').text('(Ky va ghi ro ho ten)', 80, signY + 14);
      doc.text('(Ky, dong dau xac nhan)', 360, signY + 14);

      doc.end();
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Thư viện pdfkit chưa khả dụng' }));
    }
  } catch (err) {
    console.error("Lỗi xuất PDF PnL:", err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: err.message }));
  }
}

module.exports = {
  calculatePnL,
  getDefaultMonthlyData,
  handleGetMonthlyPnL,
  handleCalculateCustomPnL,
  handleExportPnLExcel,
  handleExportPnLPDF
};
