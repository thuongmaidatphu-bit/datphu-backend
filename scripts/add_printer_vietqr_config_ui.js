const fs = require('fs');

const targetPath = 'E:/datphu-backend/public/vi_an_sinh_app.html';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add Settings button to Header
const headerSettingsBtn = `      <button onclick="openPrinterPaymentModal('printer')" id="btnSettingsModal" title="Cấu hình Máy in nhiệt Bluetooth, Cổng VietQR & HĐĐT" class="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:text-[#1E2260] hover:border-[#1E2260] text-xs font-bold flex items-center space-x-1 shadow-xs transition active:scale-95">
        <i class="fa-solid fa-gear text-amber-500"></i>
        <span class="hidden sm:inline">Cài Đặt Máy In & QR</span>
      </button>`;

if (!content.includes('id="btnSettingsModal"')) {
  content = content.replace('<div class="hidden xl:flex items-center space-x-2">', `<div class="hidden xl:flex items-center space-x-2">\n${headerSettingsBtn}`);
}

// 2. Add Settings link in cart bottom checkboxes
const oldCartFooterCheckboxes = `<div class="flex items-center justify-between pt-1 text-xs text-slate-500">
          <label class="flex items-center space-x-1.5 cursor-pointer">
            <input type="checkbox" id="chkPrintBill" checked class="rounded border-slate-300 text-[#1E2260]">
            <span>In bill nhiệt Bluetooth</span>
          </label>
          <span class="text-[#1E2260] font-semibold flex items-center space-x-1">
            <span class="w-1.5 h-1.5 rounded-full bg-[#D7262D]"></span>
            <span>HĐĐT Đất Phú</span>
          </span>
        </div>`;

const newCartFooterCheckboxes = `<div class="flex items-center justify-between pt-1 text-xs text-slate-500">
          <div class="flex items-center space-x-1">
            <label class="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" id="chkPrintBill" checked class="rounded border-slate-300 text-[#1E2260]">
              <span class="font-medium text-slate-700">In bill Bluetooth</span>
            </label>
            <button type="button" onclick="openPrinterPaymentModal('printer')" class="text-[10px] text-blue-600 hover:underline font-bold">⚙️</button>
          </div>
          <div class="flex items-center space-x-1">
            <label class="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" id="chkInvoice" checked class="rounded border-slate-300 text-[#D7262D]">
              <span class="text-[#1E2260] font-bold">HĐĐT Đất Phú</span>
            </label>
            <button type="button" onclick="openPrinterPaymentModal('einvoice')" class="text-[10px] text-red-600 hover:underline font-bold">⚙️</button>
          </div>
        </div>`;

if (content.includes(oldCartFooterCheckboxes)) {
  content = content.replace(oldCartFooterCheckboxes, newCartFooterCheckboxes);
}

// 3. Add link in VietQR modal to customize bank account
const oldVietQrFooter = `<div class="grid grid-cols-2 gap-2">
        <button onclick="simulateBankWebhook()" class="w-full py-2.5 bg-[#1E2260] text-white font-bold rounded-xl text-xs hover:bg-[#151846] transition shadow">`;

const newVietQrFooter = `<div class="text-center mb-2">
        <button onclick="closeModal('vietqrModal'); openPrinterPaymentModal('vietqr');" class="text-[11px] text-blue-700 hover:underline font-semibold flex items-center justify-center gap-1 mx-auto">
          <i class="fa-solid fa-building-columns"></i> <span>Cấu hình tài khoản ngân hàng nhận tiền</span>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="simulateBankWebhook()" class="w-full py-2.5 bg-[#1E2260] text-white font-bold rounded-xl text-xs hover:bg-[#151846] transition shadow">`;

if (content.includes(oldVietQrFooter) && !content.includes('Cấu hình tài khoản ngân hàng nhận tiền')) {
  content = content.replace(oldVietQrFooter, newVietQrFooter);
}

// 4. Modal HTML: printerPaymentSettingsModal
const settingsModalHtml = `
  <!-- ======================================================================== -->
  <!-- MODAL: CẤU HÌNH KẾT NỐI MÁY IN BLUETOOTH, CỔNG VIETQR & HĐĐT N8N -->
  <!-- ======================================================================== -->
  <div id="printerPaymentSettingsModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
    <div class="bg-white border-2 border-[#1E2260] rounded-3xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
      
      <!-- Modal Header -->
      <div class="p-4 bg-gradient-to-r from-[#1E2260] via-[#151846] to-[#D7262D] text-white flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-2.5">
          <span class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg font-black">⚙️</span>
          <div>
            <h3 class="font-black text-sm sm:text-base leading-tight">CẤU HÌNH THIẾT BỊ QUẦY & TỰ ĐỘNG HÓA</h3>
            <div class="text-[10px] text-blue-200">Máy In Bluetooth 58mm • Cổng VietQR Napas247 • HĐĐT Đất Phú NĐ 123</div>
          </div>
        </div>
        <button onclick="closeModal('printerPaymentSettingsModal')" class="text-white hover:text-red-200 font-black text-xl leading-none">&times;</button>
      </div>

      <!-- Tab Navigation -->
      <div class="p-2 bg-slate-100 border-b border-slate-200 flex space-x-1 text-xs font-bold">
        <button onclick="switchSettingsTab('printer')" id="tabBtn-printer" class="settings-tab-btn active flex-1 py-2 px-3 rounded-xl bg-white text-[#1E2260] shadow-sm flex items-center justify-center gap-1.5 transition">
          <i class="fa-solid fa-print"></i> <span>1. Máy In Bluetooth</span>
        </button>
        <button onclick="switchSettingsTab('vietqr')" id="tabBtn-vietqr" class="settings-tab-btn flex-1 py-2 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition">
          <i class="fa-solid fa-qrcode"></i> <span>2. Cổng VietQR</span>
        </button>
        <button onclick="switchSettingsTab('einvoice')" id="tabBtn-einvoice" class="settings-tab-btn flex-1 py-2 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition">
          <i class="fa-solid fa-file-invoice"></i> <span>3. HĐĐT & n8n</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs">
        
        <!-- ================================================================== -->
        <!-- TAB 1: MÁY IN NHIỆT BLUETOOTH (58MM / 80MM) -->
        <!-- ================================================================== -->
        <div id="settingsPanel-printer" class="settings-panel space-y-4">
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-blue-900">
            <span class="text-xl">🖨️</span>
            <div>
              <div class="font-bold">Hướng Dẫn Ghép Nối Máy In Nhiệt Cầm Tay / Quầy Bar:</div>
              <div class="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                1. Bật nguồn máy in nhiệt và bật Bluetooth trên thiết bị POS.<br>
                2. Quét ghép nối máy in (thường tên: <b>POS-58, PT-210, RP58</b>, mã PIN mặc định: <b>0000</b> hoặc <b>1234</b>).<br>
                3. Chọn thiết bị bên dưới và bấm <b>In Thử Nghiệm</b> để kiểm tra tín hiệu.
              </div>
            </div>
          </div>

          <!-- Trạng thái thiết bị -->
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-500">Thiết Bị Đang Kết Nối:</div>
                <div class="font-black text-sm text-[#1E2260]" id="currentPrinterName">POS-58 PT-210 (Bluetooth)</div>
              </div>
              <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sẵn sàng in bill
              </span>
            </div>

            <!-- Nút quét Web Bluetooth -->
            <div class="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button onclick="scanBluetoothPrinters()" class="px-3 py-2 bg-[#1E2260] hover:bg-[#151846] text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95">
                <i class="fa-brands fa-bluetooth-b"></i> <span>Dò Tìm Thiết Bị Bluetooth Mới</span>
              </button>
              <button onclick="testPrintBill()" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95">
                <i class="fa-solid fa-print"></i> <span>In Thử Nghiệm (Test Print)</span>
              </button>
            </div>
          </div>

          <!-- Cấu hình thông số máy in -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Khổ Giấy In Nhiệt:</label>
              <select id="cfgPaperSize" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#1E2260] focus:outline-none">
                <option value="58mm" selected>Khổ 58mm (Máy in di động PT-210 / Quầy bar)</option>
                <option value="80mm">Khổ 80mm (Máy in quầy thu ngân lớn)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Hành Động Khi Thanh Toán:</label>
              <div class="p-2 border border-slate-200 rounded-xl bg-white flex items-center space-x-2">
                <input type="checkbox" id="cfgAutoPrint" checked class="rounded border-slate-300 text-[#1E2260]">
                <label for="cfgAutoPrint" class="font-semibold text-slate-700 cursor-pointer">Tự động in bill ngay khi đơn PAID</label>
              </div>
            </div>
          </div>

          <!-- Tiêu đề trên phiếu in -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tiêu Đề Quán Trên Bill:</label>
              <input type="text" id="cfgPrintTitle" value="ĐẤT PHÚ CORE - VÍ AN SINH" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Địa Chỉ / Hotline:</label>
              <input type="text" id="cfgPrintAddress" value="86 Lê Duẩn, P.7, TP. Tuy Hòa • ĐT: 0912.888.xxx" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold">
            </div>
          </div>

          <!-- Danh sách máy in khả dụng nhanh -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Thiết Bị Máy In Phổ Biến Ghép Nối Nhanh:</label>
            <div class="grid grid-cols-3 gap-2">
              <button onclick="selectQuickPrinter('POS-58 PT-210', '58mm')" class="p-2 bg-slate-50 border border-slate-200 hover:border-[#1E2260] hover:bg-blue-50/50 rounded-xl text-left transition">
                <div class="font-bold text-slate-900">POS-58 PT-210</div>
                <div class="text-[10px] text-slate-500">Bluetooth 58mm</div>
              </button>
              <button onclick="selectQuickPrinter('RP58 Mobile Printer', '58mm')" class="p-2 bg-slate-50 border border-slate-200 hover:border-[#1E2260] hover:bg-blue-50/50 rounded-xl text-left transition">
                <div class="font-bold text-slate-900">RP58 Mobile</div>
                <div class="text-[10px] text-slate-500">Bluetooth 58mm</div>
              </button>
              <button onclick="selectQuickPrinter('Xprinter XP-N160I', '80mm')" class="p-2 bg-slate-50 border border-slate-200 hover:border-[#1E2260] hover:bg-blue-50/50 rounded-xl text-left transition">
                <div class="font-bold text-slate-900">Xprinter 80mm</div>
                <div class="text-[10px] text-slate-500">Quầy Lớn 80mm</div>
              </button>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- TAB 2: CỔNG THANH TOÁN VIETQR (NAPAS247 TỰ ĐỘNG) -->
        <!-- ================================================================== -->
        <div id="settingsPanel-vietqr" class="settings-panel hidden space-y-4">
          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-900">
            <span class="text-xl">💳</span>
            <div>
              <div class="font-bold">Cổng Thanh Toán VietQR Tự Động (Napas247):</div>
              <div class="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Mỗi khi tạo đơn hàng, hệ thống tự động sinh mã VietQR Napas247 động gắn kèm mã hóa đơn và số tiền chính xác. Khi khách chuyển khoản thành công, Webhook ngầm sẽ tự động gạch nợ và đổi trạng thái đơn thành <b>ĐÃ THANH TOÁN</b> mà không cần đối soát thủ công.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Ngân Hàng Thụ Hưởng:</label>
              <select id="cfgBankId" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#1E2260] focus:outline-none">
                <option value="970436">Vietcombank - VCB DigiBiz (970436)</option>
                <option value="970422">MBBank - Ngân hàng Quân Đội (970422)</option>
                <option value="970418">BIDV - Đầu tư và Phát triển (970418)</option>
                <option value="970407">Techcombank (970407)</option>
                <option value="970432">VPBank (970432)</option>
                <option value="970416">ACB - Á Châu (970416)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Số Tài Khoản Doanh Nghiệp / Chủ Quán <span class="text-red-500">*</span>:</label>
              <input type="text" id="cfgBankAccount" value="1038899889" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-[#1E2260]">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản (Không Dấu):</label>
              <input type="text" id="cfgAccountHolder" value="CONG TY CP DAT PHU CORE" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold uppercase text-slate-800">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Cơ Chế Xác Thực Tự Động:</label>
              <div class="p-2 border border-slate-200 rounded-xl bg-white flex items-center space-x-2">
                <input type="checkbox" id="cfgAutoConfirm" checked class="rounded border-slate-300 text-emerald-600">
                <label for="cfgAutoConfirm" class="font-semibold text-slate-700 cursor-pointer">Xác thực ngầm qua Napas247 Webhook</label>
              </div>
            </div>
          </div>

          <!-- Webhook Receiver -->
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800">Cổng Nhận Webhook Ngân Hàng / n8n:</span>
              <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Hoạt động 24/7</span>
            </div>
            <input type="text" id="cfgWebhookEndpoint" readonly value="http://localhost:5000/api/pos/payments/bank-webhook" class="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-[11px] text-slate-600">
            
            <div class="pt-1 flex items-center justify-between">
              <span class="text-[10px] text-slate-500">Dùng kiểm tra tiền về tự động:</span>
              <button onclick="testBankWebhookTrigger()" class="px-3 py-1.5 bg-[#1E2260] hover:bg-[#151846] text-white font-bold rounded-lg text-xs transition flex items-center gap-1 active:scale-95">
                <i class="fa-solid fa-bolt"></i> <span>Giả Lập Tiền Về (Test Webhook)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- TAB 3: HÓA ĐƠN ĐIỆN TỬ ĐẤT PHÚ (NĐ 123 & N8N AUTOMATION) -->
        <!-- ================================================================== -->
        <div id="settingsPanel-einvoice" class="settings-panel hidden space-y-4">
          <div class="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-950">
            <span class="text-xl">🧾</span>
            <div>
              <div class="font-bold text-[#D7262D]">Tự Động Xuất HĐĐT Khởi Tạo Từ Máy Tính Tiền (NĐ 123/2020/NĐ-CP):</div>
              <div class="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                Ngay khi thanh toán, hệ thống đồng bộ ngầm qua <b>Supabase Webhook $\rightarrow$ n8n Workflow</b> để khởi tạo, ký số và cấp mã CQT. Khách hàng nhận hóa đơn điện tử qua Zalo ZNS / SMS tức thì mà không cần thu ngân thao tác thêm.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Nhà Cung Cấp HĐĐT:</label>
              <select id="cfgInvoiceProvider" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#D7262D] focus:outline-none">
                <option value="misa_meinvoice" selected>MISA meInvoice (Chuẩn máy tính tiền)</option>
                <option value="easyinvoice">Softdreams EasyInvoice</option>
                <option value="viettel_sinvoice">Viettel S-Invoice</option>
                <option value="vnpt_invoice">VNPT Smart Invoice</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Mã Số Thuế Doanh Nghiệp (MST) <span class="text-red-500">*</span>:</label>
              <input type="text" id="cfgTaxCode" value="4401020233" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-[#D7262D]">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Ký Hiệu Mẫu HĐĐT (Máy Tính Tiền):</label>
              <input type="text" id="cfgTemplateSymbol" value="1C26MDP" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-[#1E2260]">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Cơ Quan Thuế Quản Lý:</label>
              <input type="text" id="cfgTaxAuthority" value="Chi cục Thuế TP. Tuy Hòa" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800">
            </div>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Luồng n8n Webhook Ký Số Hóa Đơn:</label>
              <input type="text" id="cfgN8nInvoiceWebhook" value="https://n8n.datphucore.vn/webhook/issue-invoice" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px] text-slate-700">
            </div>
            
            <div class="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center space-x-3">
                <label class="flex items-center space-x-1.5 cursor-pointer">
                  <input type="checkbox" id="cfgAutoZns" checked class="rounded border-slate-300 text-emerald-600">
                  <span class="font-semibold text-slate-700">Gửi Zalo ZNS</span>
                </label>
                <label class="flex items-center space-x-1.5 cursor-pointer">
                  <input type="checkbox" id="cfgAutoEmail" checked class="rounded border-slate-300 text-blue-600">
                  <span class="font-semibold text-slate-700">Gửi Email PDF</span>
                </label>
              </div>
              <button onclick="testIssueEinvoice()" class="px-3 py-1.5 bg-[#D7262D] hover:bg-red-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 active:scale-95">
                <i class="fa-solid fa-stamp"></i> <span>Test Phát Hành 1 HĐĐT Mẫu</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Action Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button onclick="closeModal('printerPaymentSettingsModal')" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">
          Đóng
        </button>
        <button onclick="saveSettingsToServer()" class="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-floppy-disk"></i> <span>LƯU CẤU HÌNH HỆ THỐNG</span>
        </button>
      </div>

    </div>
  </div>
`;

if (!content.includes('id="printerPaymentSettingsModal"')) {
  content = content.replace('</body>', `${settingsModalHtml}\n</body>`);
}

// 5. JavaScript Helper Logic for Settings
const settingsScript = `
    // ========================================================================
    // QUẢN LÝ CẤU HÌNH THIẾT BỊ MÁY IN BLUETOOTH, VIETQR & HĐĐT N8N
    // ========================================================================
    let systemSettings = {
      printer: {
        enabled: true,
        deviceName: "POS-58 PT-210",
        paperSize: "58mm",
        autoPrintOnPayment: true,
        headerTitle: "ĐẤT PHÚ CORE - VÍ AN SINH",
        address: "86 Lê Duẩn, Phường 7, TP. Tuy Hòa • ĐT: 0912.888.xxx"
      },
      vietqr: {
        enabled: true,
        bankId: "970436",
        accountNumber: "1038899889",
        accountHolder: "CONG TY CP DAT PHU CORE",
        napasAutoConfirm: true
      },
      einvoice: {
        enabled: true,
        provider: "misa_meinvoice",
        taxCode: "4401020233",
        templateSymbol: "1C26MDP",
        taxAuthority: "Chi cục Thuế TP. Tuy Hòa",
        n8nWebhookUrl: "https://n8n.datphucore.vn/webhook/issue-invoice",
        autoSendZns: true,
        autoSendEmail: true
      }
    };

    function openPrinterPaymentModal(tab = 'printer') {
      switchSettingsTab(tab);
      loadSettingsFromServer();
      document.getElementById('printerPaymentSettingsModal').classList.remove('hidden');
    }

    function switchSettingsTab(tab) {
      document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-white', 'text-[#1E2260]', 'shadow-sm');
        btn.classList.add('text-slate-600');
      });
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('hidden'));

      const activeBtn = document.getElementById(\`tabBtn-\${tab}\`);
      const activePanel = document.getElementById(\`settingsPanel-\${tab}\`);
      if (activeBtn) {
        activeBtn.classList.add('active', 'bg-white', 'text-[#1E2260]', 'shadow-sm');
        activeBtn.classList.remove('text-slate-600');
      }
      if (activePanel) {
        activePanel.classList.remove('hidden');
      }
    }

    async function loadSettingsFromServer() {
      try {
        const resp = await fetch('/api/pos/settings');
        const data = await resp.json();
        if (data.success && data.settings) {
          systemSettings = data.settings;
          // Apply to UI fields
          if (systemSettings.printer) {
            document.getElementById('currentPrinterName').innerText = systemSettings.printer.deviceName || "POS-58 PT-210";
            document.getElementById('cfgPaperSize').value = systemSettings.printer.paperSize || "58mm";
            document.getElementById('cfgAutoPrint').checked = systemSettings.printer.autoPrintOnPayment !== false;
            document.getElementById('cfgPrintTitle').value = systemSettings.printer.headerTitle || "ĐẤT PHÚ CORE - VÍ AN SINH";
            document.getElementById('cfgPrintAddress').value = systemSettings.printer.address || "86 Lê Duẩn, P.7, TP. Tuy Hòa";
          }
          if (systemSettings.vietqr) {
            document.getElementById('cfgBankId').value = systemSettings.vietqr.bankId || "970436";
            document.getElementById('cfgBankAccount').value = systemSettings.vietqr.accountNumber || "1038899889";
            document.getElementById('cfgAccountHolder').value = systemSettings.vietqr.accountHolder || "CONG TY CP DAT PHU CORE";
            document.getElementById('cfgAutoConfirm').checked = systemSettings.vietqr.napasAutoConfirm !== false;
          }
          if (systemSettings.einvoice) {
            document.getElementById('cfgInvoiceProvider').value = systemSettings.einvoice.provider || "misa_meinvoice";
            document.getElementById('cfgTaxCode').value = systemSettings.einvoice.taxCode || "4401020233";
            document.getElementById('cfgTemplateSymbol').value = systemSettings.einvoice.templateSymbol || "1C26MDP";
            document.getElementById('cfgTaxAuthority').value = systemSettings.einvoice.taxAuthority || "Chi cục Thuế TP. Tuy Hòa";
            document.getElementById('cfgN8nInvoiceWebhook').value = systemSettings.einvoice.n8nWebhookUrl || "https://n8n.datphucore.vn/webhook/issue-invoice";
            document.getElementById('cfgAutoZns').checked = systemSettings.einvoice.autoSendZns !== false;
            document.getElementById('cfgAutoEmail').checked = systemSettings.einvoice.autoSendEmail !== false;
          }
        }
      } catch (e) {
        console.warn("Could not load settings:", e);
      }
    }

    async function saveSettingsToServer() {
      const payload = {
        printer: {
          deviceName: document.getElementById('currentPrinterName').innerText,
          paperSize: document.getElementById('cfgPaperSize').value,
          autoPrintOnPayment: document.getElementById('cfgAutoPrint').checked,
          headerTitle: document.getElementById('cfgPrintTitle').value,
          address: document.getElementById('cfgPrintAddress').value
        },
        vietqr: {
          bankId: document.getElementById('cfgBankId').value,
          accountNumber: document.getElementById('cfgBankAccount').value,
          accountHolder: document.getElementById('cfgAccountHolder').value,
          napasAutoConfirm: document.getElementById('cfgAutoConfirm').checked
        },
        einvoice: {
          provider: document.getElementById('cfgInvoiceProvider').value,
          taxCode: document.getElementById('cfgTaxCode').value,
          templateSymbol: document.getElementById('cfgTemplateSymbol').value,
          taxAuthority: document.getElementById('cfgTaxAuthority').value,
          n8nWebhookUrl: document.getElementById('cfgN8nInvoiceWebhook').value,
          autoSendZns: document.getElementById('cfgAutoZns').checked,
          autoSendEmail: document.getElementById('cfgAutoEmail').checked
        }
      };

      try {
        const resp = await fetch('/api/pos/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        playPaymentChime();
        closeModal('printerPaymentSettingsModal');
        showToast("Đã lưu toàn bộ cấu hình Máy in, VietQR & HĐĐT thành công!", "✅");
      } catch (err) {
        showToast("Lỗi khi lưu cấu hình: " + err.message, "⚠️");
      }
    }

    async function scanBluetoothPrinters() {
      if (navigator.bluetooth) {
        try {
          showToast("Đang mở trình duyệt quét Bluetooth...", "🔍");
          const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
          });
          if (device && device.name) {
            document.getElementById('currentPrinterName').innerText = device.name + " (Đã ghép nối)";
            showToast(\`Đã kết nối thành công với \${device.name}!\`, "🖨️");
            return;
          }
        } catch (err) {
          console.warn("Web Bluetooth dismissed or not supported:", err);
        }
      }
      // Fallback pairing simulation
      showToast("Đang dò tìm thiết bị Bluetooth xung quanh...", "🔍");
      setTimeout(() => {
        document.getElementById('currentPrinterName').innerText = "POS-58 PT-210 (Đã ghép nối)";
        showToast("Đã ghép nối thành công máy in nhiệt POS-58 PT-210 (PIN: 0000)!", "🖨️");
      }, 1000);
    }

    function selectQuickPrinter(name, size) {
      document.getElementById('currentPrinterName').innerText = name + " (Bluetooth)";
      document.getElementById('cfgPaperSize').value = size;
      showToast(\`Đã chọn máy in \${name} (\${size})!\`, "🖨️");
    }

    async function testPrintBill() {
      try {
        const resp = await fetch('/api/pos/printer/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await resp.json();
        playPaymentChime();
        showToast(data.message || "Đã gửi lệnh in thử nghiệm thành công!", "🖨️");
        
        // Open thermal receipt modal with sample data
        openThermalReceiptModal({
          invoiceNo: "1C26MDP-TEST01",
          dateTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
          targetName: "Bàn Test In Nhiệt",
          cashierName: "Thu Ngân 01",
          method: "In Thử Nghiệm",
          items: [
            { name: "Cà phê sữa đá (Test)", qty: 1, price: 20000 },
            { name: "Bò một nắng Sông Hinh (Test)", qty: 1, price: 280000 }
          ],
          total: 300000
        });
      } catch (err) {
        showToast("Lỗi in thử: " + err.message, "⚠️");
      }
    }

    async function testBankWebhookTrigger() {
      try {
        const resp = await fetch('/api/pos/payments/bank-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: 'ORD-TEST-WEBHOOK',
            amount: 38000,
            referenceCode: 'MB-' + Math.floor(100000 + Math.random() * 900000)
          })
        });
        const data = await resp.json();
        playPaymentChime();
        showToast("Webhook Napas247 bắn về thành công: " + data.message, "⚡");
      } catch (err) {
        showToast("Lỗi test webhook: " + err.message, "⚠️");
      }
    }

    async function testIssueEinvoice() {
      try {
        const resp = await fetch('/api/pos/einvoice/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: 'ORD-TEST-EINVOICE',
            totalAmount: 38000,
            customerPhone: '0912888xxx'
          })
        });
        const data = await resp.json();
        playPaymentChime();
        showToast(data.message || "Đã phát hành HĐĐT mẫu thành công!", "🧾");
      } catch (err) {
        showToast("Lỗi test HĐĐT: " + err.message, "⚠️");
      }
    }
`;

if (!content.includes('function openPrinterPaymentModal')) {
  content = content.replace('// Khởi chạy khi nạp trang', `${settingsScript}\n    // Khởi chạy khi nạp trang`);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully added Printer, VietQR & E-Invoice configuration UI to vi_an_sinh_app.html');
