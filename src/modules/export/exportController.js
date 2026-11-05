/**
 * ============================================================================
 * ĐẤT PHÚ CORE - EXPORT REPORT CONTROLLER (exportController.js)
 * Xuất báo cáo doanh thu cuối ngày ra file Excel (.xlsx) và PDF
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ (MST: 4401020233)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { loadOrders } = require('../pos/posController');

// Helper đọc tự động dữ liệu doanh thu thực tế trong ngày nếu request không truyền kèm body
function getTodayMetrics(body = {}) {
  const orders = loadOrders();
  const todayStr = new Date().toISOString().split('T')[0];
  const completed = orders.filter(o => o.paymentStatus === 'completed');

  const totalOrders = body.total_orders !== undefined ? body.total_orders : completed.length;
  const totalRevenue = body.total_revenue !== undefined ? body.total_revenue : completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashRevenue = body.cash_revenue !== undefined ? body.cash_revenue : completed.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const qrRevenue = body.qr_revenue !== undefined ? body.qr_revenue : completed.filter(o => o.paymentMethod === 'vietqr').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const reportDate = body.report_date || todayStr;

  return {
    report_date: reportDate,
    total_orders: totalOrders,
    total_revenue: totalRevenue,
    cash_revenue: cashRevenue,
    qr_revenue: qrRevenue,
    items: body.items || []
  };
}

/**
 * 1. Xuất báo cáo doanh thu ra file Excel (.xlsx)
 */
async function exportExcelReport(req, res, body = {}) {
  try {
    const metrics = getTodayMetrics(body);
    let ExcelJS;
    try {
      ExcelJS = require('exceljs');
    } catch (e) {
      ExcelJS = null;
    }

    if (ExcelJS) {
      // Khởi tạo Workbook và Worksheet Excel chuẩn ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Bao Cao Doanh Thu Cuoi Ngay');

      // Định dạng tiêu đề doanh nghiệp
      worksheet.mergeCells('A1:D1');
      worksheet.getCell('A1').value = `BÁO CÁO DOANH THU CUỐI NGÀY - ĐẤT PHÚ CORE`;
      worksheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1E2260' } };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:D2');
      worksheet.getCell('A2').value = `Cơ sở: Đất Phú Phòng Nghỉ & Cà Phê (86 Lê Duẩn, TP. Tuy Hòa) • MST: 4401020233`;
      worksheet.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      worksheet.addRow([]);

      worksheet.getCell('A4').value = 'Ngày báo cáo:';
      worksheet.getCell('B4').value = metrics.report_date;
      worksheet.getCell('A4').font = { bold: true };

      worksheet.getCell('A5').value = 'Tổng số đơn hàng:';
      worksheet.getCell('B5').value = metrics.total_orders;
      worksheet.getCell('A5').font = { bold: true };

      worksheet.getCell('A6').value = 'Tổng doanh thu:';
      worksheet.getCell('B6').value = `${Number(metrics.total_revenue).toLocaleString()} VNĐ`;
      worksheet.getCell('A6').font = { bold: true };
      worksheet.getCell('B6').font = { bold: true, color: { argb: 'FFD7262D' } };

      worksheet.getCell('A7').value = 'Doanh thu tiền mặt:';
      worksheet.getCell('B7').value = `${Number(metrics.cash_revenue).toLocaleString()} VNĐ`;

      worksheet.getCell('A8').value = 'Doanh thu chuyển khoản QR (Napas247):';
      worksheet.getCell('B8').value = `${Number(metrics.qr_revenue).toLocaleString()} VNĐ`;

      worksheet.addRow([]);
      worksheet.addRow(['Cột mốc tuân thủ:', 'Thông tư 40/2021/TT-BTC & Nghị định 123/2020/NĐ-CP']);

      worksheet.getColumn('A').width = 35;
      worksheet.getColumn('B').width = 40;

      // Thiết lập header cho file tải về
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=BaoCaoDoanhThu_${metrics.report_date}.xlsx`);

      await workbook.xlsx.write(res);
      return res.end();
    } else {
      // Fallback CSV nếu ExcelJS chưa nạp xong
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=BaoCaoDoanhThu_${metrics.report_date}.csv`);
      const csv = `\uFEFFBÁO CÁO DOANH THU CUỐI NGÀY - ĐẤT PHÚ CORE\nNgày báo cáo,${metrics.report_date}\nTổng đơn hàng,${metrics.total_orders}\nTổng doanh thu,${metrics.total_revenue} VNĐ\nDoanh thu tiền mặt,${metrics.cash_revenue} VNĐ\nDoanh thu chuyển khoản QR,${metrics.qr_revenue} VNĐ\n`;
      return res.end(csv);
    }
  } catch (err) {
    console.error('Lỗi xuất file Excel:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: 'Lỗi hệ thống khi xuất file Excel: ' + err.message }));
  }
}

/**
 * 2. Xuất báo cáo doanh thu ra file PDF
 */
async function exportPdfReport(req, res, body = {}) {
  try {
    const metrics = getTodayMetrics(body);
    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      PDFDocument = null;
    }

    if (PDFDocument) {
      // Khởi tạo tài liệu PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // Thiết lập header trả về file PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=BaoCaoDoanhThu_${metrics.report_date}.pdf`);

      doc.pipe(res);

      // Nội dung bên trong PDF
      doc.fontSize(16).text('CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ', { align: 'center' });
      doc.fontSize(10).text('Số 21/146 Ngô Gia Tự, TP. Tuy Hòa • MST: 4401020233', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(18).text('BÁO CÁO DOANH THU CUỐI NGÀY', { align: 'center', underline: true });
      doc.moveDown();

      doc.fontSize(12).text(`Ngày báo cáo: ${metrics.report_date}`);
      doc.text(`Tổng số đơn hàng: ${metrics.total_orders}`);
      doc.text(`Tổng doanh thu: ${Number(metrics.total_revenue).toLocaleString()} VND`);
      doc.text(`Doanh thu tiền mặt: ${Number(metrics.cash_revenue).toLocaleString()} VND`);
      doc.text(`Doanh thu chuyển khoản QR: ${Number(metrics.qr_revenue).toLocaleString()} VND`);

      doc.moveDown(2);
      doc.fontSize(10).text('Hệ thống quản lý Đất Phú Core & Ví An Sinh (Thông tư 40/2021/TT-BTC).', { align: 'center' });
      doc.text('Người lập báo cáo: Thu Ngân Trưởng / Chủ Hộ Kinh Doanh', { align: 'center' });

      doc.end();
      return;
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<h2>Báo cáo Doanh Thu: ${metrics.report_date}</h2><p>Tổng doanh thu: ${metrics.total_revenue}đ</p>`);
    }
  } catch (err) {
    console.error('Lỗi xuất file PDF:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: 'Lỗi hệ thống khi xuất file PDF: ' + err.message }));
  }
}

module.exports = {
  exportExcelReport,
  exportPdfReport
};
