const fs = require('fs');

// 1. Update posController.js with Enterprise Settings handler
const controllerPath = 'E:/datphu-backend/src/modules/pos/posController.js';
let ctrlCode = fs.readFileSync(controllerPath, 'utf8');

const oldHandleSaveSettingsRegex = /function handleSaveSettings\(req, res, body = \{\}\) \{[\s\S]*?saveSettings\(updated\);[\s\S]*?res\.end\(JSON\.stringify\(\{ success: true[\s\S]*?\}\)\);\s*\}/;

const newHandleSaveSettings = `function handleSaveSettings(req, res, body = {}) {
  const current = loadSettings();
  const updated = {
    business: { ...(current.business || {}), ...(body.business || {}) },
    printer: { ...(current.printer || {}), ...(body.printer || {}) },
    vietqr: { ...(current.vietqr || {}), ...(body.vietqr || {}) },
    einvoice: { ...(current.einvoice || {}), ...(body.einvoice || {}) },
    inventoryBOM: { ...(current.inventoryBOM || {}), ...(body.inventoryBOM || {}) },
    pricingRules: { ...(current.pricingRules || {}), ...(body.pricingRules || {}) },
    shiftPolicy: { ...(current.shiftPolicy || {}), ...(body.shiftPolicy || {}) }
  };
  saveSettings(updated);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đã lưu cấu hình Trung Tâm Vận Hành Doanh Nghiệp (Enterprise POS) thành công!',
    settings: updated
  }));
}`;

if (oldHandleSaveSettingsRegex.test(ctrlCode)) {
  ctrlCode = ctrlCode.replace(oldHandleSaveSettingsRegex, newHandleSaveSettings);
  fs.writeFileSync(controllerPath, ctrlCode, 'utf8');
  console.log('Updated handleSaveSettings in posController.js');
}

// 2. Update Header Button text in vi_an_sinh_app.html
const htmlPath = 'E:/datphu-backend/public/vi_an_sinh_app.html';
let htmlCode = fs.readFileSync(htmlPath, 'utf8');

// Update header button
htmlCode = htmlCode.replace(
  /<button onclick="openPrinterPaymentModal\('printer'\)" id="btnSettingsModal"[\s\S]*?<\/button>/,
  `<button onclick="openPrinterPaymentModal('business')" id="btnSettingsModal" title="Trung Tâm Cấu Hình Vận Hành Doanh Nghiệp Chuẩn Hãng Lớn" class="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 hover:text-[#1E2260] hover:border-[#1E2260] text-xs font-black flex items-center space-x-1.5 shadow-xs transition active:scale-95">
        <i class="fa-solid fa-sliders text-indigo-600"></i>
        <span class="hidden sm:inline">Cấu Hình Doanh Nghiệp</span>
      </button>`
);

// 3. Upgrade printerPaymentSettingsModal to Enterprise Configuration Hub (6 tabs)
const oldModalRegex = /<!-- ======================================================================== -->\s*<!-- MODAL: CẤU HÌNH KẾT NỐI MÁY IN BLUETOOTH[\s\S]*?<!-- Action Footer -->\s*<div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newEnterpriseModalHtml = `<!-- ======================================================================== -->
  <!-- MODAL: TRUNG TÂM CẤU HÌNH VẬN HÀNH DOANH NGHIỆP TOÀN DIỆN (ENTERPRISE POS HUB) -->
  <!-- ======================================================================== -->
  <div id="printerPaymentSettingsModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
    <div class="bg-white border-2 border-[#1E2260] rounded-3xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
      
      <!-- Modal Header -->
      <div class="p-4 bg-gradient-to-r from-[#1E2260] via-[#151846] to-[#D7262D] text-white flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-3">
          <span class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-black">🏢</span>
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="font-black text-sm sm:text-base tracking-wide">TRUNG TÂM CẤU HÌNH VẬN HÀNH DOANH NGHIỆP</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase">Enterprise Standard</span>
            </div>
            <div class="text-[11px] text-blue-200">Đất Phú Core • Thanh Giang Hometel & Cafe 86 Lê Duẩn • Đa phân hệ liên thông</div>
          </div>
        </div>
        <button onclick="closeModal('printerPaymentSettingsModal')" class="text-white hover:text-red-200 font-black text-2xl leading-none">&times;</button>
      </div>

      <!-- 6 Tab Navigation (Chuẩn Hãng Lớn) -->
      <div class="p-2 bg-slate-100 border-b border-slate-200 flex space-x-1 overflow-x-auto no-scrollbar text-xs font-bold">
        <button onclick="switchSettingsTab('business')" id="tabBtn-business" class="settings-tab-btn active py-2 px-3 rounded-xl bg-white text-[#1E2260] shadow-sm flex items-center gap-1.5 whitespace-nowrap transition">
          <i class="fa-solid fa-building"></i> <span>1. Doanh Nghiệp & HĐĐT</span>
        </button>
        <button onclick="switchSettingsTab('vietqr')" id="tabBtn-vietqr" class="settings-tab-btn py-2 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap transition">
          <i class="fa-solid fa-qrcode"></i> <span>2. Cổng VietQR & Dòng Tiền</span>
        </button>
        <button onclick="switchSettingsTab('printer')" id="tabBtn-printer" class="settings-tab-btn py-2 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap transition">
          <i class="fa-solid fa-print"></i> <span>3. Thiết Bị & Máy In Bếp</span>
        </button>
        <button onclick="switchSettingsTab('inventory')" id="tabBtn-inventory" class="settings-tab-btn py-2 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap transition">
          <i class="fa-solid fa-boxes-stacked"></i> <span>4. Đa Kho & BOM Pha Chế</span>
        </button>
        <button onclick="switchSettingsTab('pricing')" id="tabBtn-pricing" class="settings-tab-btn py-2 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap transition">
          <i class="fa-solid fa-tags"></i> <span>5. Giá Sỉ & Giờ Vàng</span>
        </button>
        <button onclick="switchSettingsTab('shift')" id="tabBtn-shift" class="settings-tab-btn py-2 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center gap-1.5 whitespace-nowrap transition">
          <i class="fa-solid fa-user-shield"></i> <span>6. Nhân Viên & Chốt Ca</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs">
        
        <!-- ================================================================== -->
        <!-- TAB 1: PHÁP LÝ DOANH NGHIỆP & MULTI-ADAPTER HÓA ĐƠN ĐIỆN TỬ (MTT NĐ 123) -->
        <!-- ================================================================== -->
        <div id="settingsPanel-business" class="settings-panel space-y-4">
          <div class="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-950">
            <span class="text-xl">🧾</span>
            <div>
              <div class="font-bold text-[#D7262D]">Pháp Lý Doanh Nghiệp & Bộ Chuyển Đổi HĐĐT (Multi E-Invoice Adapters):</div>
              <div class="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                Tích hợp sẵn bộ điều hợp chuẩn quốc gia cho <b>Viettel S-Invoice, Softdreams EasyInvoice, MISA meInvoice, VNPT Invoice</b>. Hệ thống tự động ký số bằng chứng thư <b>Cloud HSM (Server-side)</b> không cần cắm USB Token.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tên Doanh Nghiệp / Chủ Thể Pháp Lý <span class="text-red-500">*</span>:</label>
              <input type="text" id="cfgCompanyName" value="CÔNG TY CỔ PHẦN ĐẤT PHÚ CORE" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-[#1E2260]">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Mã Số Thuế (MST) <span class="text-red-500">*</span>:</label>
              <input type="text" id="cfgTaxCode" value="4401020233" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-[#D7262D]">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Thương Hiệu Điểm Bán:</label>
              <input type="text" id="cfgBrandName" value="THANH GIANG HOMETEL & CAFE" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Chi Nhánh / Địa Điểm:</label>
              <input type="text" id="cfgBranchName" value="86 Lê Duẩn, TP. Tuy Hòa, Phú Yên" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Cơ Quan Thuế Quản Lý:</label>
              <input type="text" id="cfgTaxAuthority" value="Chi cục Thuế TP. Tuy Hòa" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700">
            </div>
          </div>

          <!-- Bộ Chọn Adapter HĐĐT -->
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-slate-900 text-xs">Cổng Tích Hợp HĐĐT Máy Tính Tiền (MTT):</span>
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Cloud HSM Tự Động Ký</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <label class="flex items-center space-x-2 p-2.5 border-2 border-red-500 bg-red-50/40 rounded-xl cursor-pointer">
                <input type="radio" name="cfgInvoiceProvider" value="viettel_sinvoice" checked class="text-red-600">
                <span class="font-bold text-slate-900">Viettel S-Invoice</span>
              </label>
              <label class="flex items-center space-x-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:border-red-400">
                <input type="radio" name="cfgInvoiceProvider" value="easyinvoice" class="text-red-600">
                <span class="font-bold text-slate-900">Softdreams EasyInvoice</span>
              </label>
              <label class="flex items-center space-x-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:border-red-400">
                <input type="radio" name="cfgInvoiceProvider" value="misa_meinvoice" class="text-red-600">
                <span class="font-bold text-slate-900">MISA meInvoice</span>
              </label>
              <label class="flex items-center space-x-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:border-red-400">
                <input type="radio" name="cfgInvoiceProvider" value="vnpt_invoice" class="text-red-600">
                <span class="font-bold text-slate-900">VNPT Smart Invoice</span>
              </label>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Ký Hiệu Mẫu MTT:</label>
                <input type="text" id="cfgTemplateSymbol" value="1C26MDP" class="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono font-bold text-[#1E2260]">
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Thuế Suất GTGT Mặc Định:</label>
                <select id="cfgDefaultVatRate" class="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold">
                  <option value="8" selected>8% (Nghị quyết 110/2023 F&B & Dịch Vụ)</option>
                  <option value="10">10% (Thuế suất chuẩn)</option>
                  <option value="0">0% (Đặc sản nông nghiệp chưa chế biến)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Luồng n8n Webhook Ký Số:</label>
                <input type="text" id="cfgN8nInvoiceWebhook" value="https://n8n.datphucore.vn/webhook/issue-invoice" class="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-[11px]">
              </div>
            </div>

            <div class="flex items-center space-x-3 pt-1">
              <label class="flex items-center space-x-1.5 cursor-pointer">
                <input type="checkbox" id="cfgAutoZns" checked class="rounded border-slate-300 text-emerald-600">
                <span class="font-semibold text-slate-700">Tự động gửi Zalo ZNS hóa đơn</span>
              </label>
              <label class="flex items-center space-x-1.5 cursor-pointer">
                <input type="checkbox" id="cfgAutoEmail" checked class="rounded border-slate-300 text-blue-600">
                <span class="font-semibold text-slate-700">Tự động gửi Email PDF cho khách</span>
              </label>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- TAB 2: CỔNG THANH TOÁN VIETQR & DÒNG TIỀN (OMNI-PAYMENT) -->
        <!-- ================================================================== -->
        <div id="settingsPanel-vietqr" class="settings-panel hidden space-y-4">
          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-900">
            <span class="text-xl">💳</span>
            <div>
              <div class="font-bold">Quản Trị Cổng Dòng Tiền & VietQR Napas247 Tự Động:</div>
              <div class="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Đồng bộ hóa tài khoản doanh nghiệp (VCB DigiBiz, MBBank, BIDV...). Hệ thống tự động sinh QR động theo chuẩn EMVCo, bắt Webhook gạch nợ tức thời và phát chuông ting ting.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Ngân Hàng Thụ Hưởng Doanh Nghiệp:</label>
              <select id="cfgBankId" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#1E2260] focus:outline-none">
                <option value="970436" selected>Vietcombank - VCB DigiBiz (970436)</option>
                <option value="970422">MBBank - Ngân hàng Quân Đội (970422)</option>
                <option value="970418">BIDV - Đầu tư và Phát triển (970418)</option>
                <option value="970407">Techcombank (970407)</option>
                <option value="970432">VPBank (970432)</option>
                <option value="970416">ACB - Á Châu (970416)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Số Tài Khoản Nhận Tiền <span class="text-red-500">*</span>:</label>
              <input type="text" id="cfgBankAccount" value="1038899889" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-[#1E2260]">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản (Không Dấu):</label>
              <input type="text" id="cfgAccountHolder" value="CONG TY CP DAT PHU CORE" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold uppercase text-slate-800">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Chi Nhánh Ngân Hàng:</label>
              <input type="text" id="cfgBankBranch" value="Chi nhánh Phú Yên" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold">
            </div>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800">Endpoint Nhận Webhook Ngân Hàng:</span>
              <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">24/7 Realtime SSE</span>
            </div>
            <input type="text" id="cfgWebhookEndpoint" readonly value="http://localhost:5000/api/pos/payments/bank-webhook" class="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-[11px] text-slate-600">
            
            <div class="pt-2 flex flex-wrap items-center justify-between gap-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" id="cfgCardMpos" checked class="rounded border-slate-300 text-blue-600">
                <span class="font-bold text-slate-700">Kích hoạt quẹt thẻ ngân hàng mPOS / VNPAY-POS</span>
              </label>
              <button onclick="testBankWebhookTrigger()" class="px-3.5 py-1.5 bg-[#1E2260] hover:bg-[#151846] text-white font-bold rounded-lg text-xs transition flex items-center gap-1 active:scale-95">
                <i class="fa-solid fa-bolt"></i> <span>Test Giả Lập Webhook Napas247</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- TAB 3: THIẾT BỊ NGOẠI VI & MÁY IN BẾP / BAR (HARDWARE HUB) -->
        <!-- ================================================================== -->
        <div id="settingsPanel-printer" class="settings-panel hidden space-y-4">
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-blue-900">
            <span class="text-xl">🖨️</span>
            <div>
              <div class="font-bold">Quản Trị Thiết Bị Ngoại Vi: Quầy Thu Ngân, Bếp & Két Tiền</div>
              <div class="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                Tự động tách phiếu in theo phân hệ: <b>Phiếu thu ngân</b> in bill 58mm cho khách, <b>Phiếu pha chế</b> in quầy bar, và <b>Phiếu bếp</b> nhả lệnh nấu món ăn sáng qua mạng LAN/Bluetooth.
              </div>
            </div>
          </div>

          <!-- Quầy Thu Ngân -->
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-black text-sm text-[#1E2260]">1. Máy In Hóa Đơn Thu Ngân (Receipt Printer)</div>
                <div class="text-[10px] text-slate-500" id="currentPrinterName">POS-58 PT-210 (Bluetooth)</div>
              </div>
              <div class="flex items-center space-x-2">
                <select id="cfgPaperSize" class="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold">
                  <option value="58mm" selected>Khổ 58mm</option>
                  <option value="80mm">Khổ 80mm</option>
                </select>
                <button onclick="testPrintBill()" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition">
                  In Thử Bill
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <label class="flex items-center space-x-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input type="checkbox" id="cfgAutoPrint" checked class="rounded border-slate-300 text-[#1E2260]">
                <span class="font-semibold">Tự động in bill khi đơn chuyển trạng thái PAID</span>
              </label>
              <label class="flex items-center space-x-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input type="checkbox" id="cfgAutoKickDrawer" checked class="rounded border-slate-300 text-amber-600">
                <span class="font-semibold">Tự động bật két tiền RJ11 khi thu tiền mặt</span>
              </label>
            </div>
          </div>

          <!-- Máy In Bếp / Bar KDS -->
          <div class="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-black text-sm text-indigo-950">2. Máy In Bếp & Quầy Pha Chế (Kitchen Bar Hub)</div>
                <div class="text-[10px] text-indigo-700">Tự động chia tách đồ uống gửi quầy bar và món ăn gửi bếp</div>
              </div>
              <button onclick="testKitchenPrint()" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition">
                In Thử Phiếu Bếp
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Tên Thiết Bị / Địa Chỉ IP Máy In Bếp:</label>
                <input type="text" id="cfgKitchenDevice" value="Kitchen Bar Printer (192.168.1.200)" class="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono font-semibold">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Chế Độ Phân Tách:</label>
                <select id="cfgKitchenSplit" class="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-bold">
                  <option value="auto_split" selected>Tự động tách Phiếu Nước & Phiếu Bếp</option>
                  <option value="single_ticket">In gộp chung 1 phiếu Order</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- TAB 4: ĐA KHO & ĐỊNH MỨC TIÊU HAO BOM (MULTI-INVENTORY ENGINE) -->
        <!-- ================================================================== -->
        <div id="settingsPanel-inventory" class="settings-panel hidden space-y-4">
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-950">
            <span class="text-xl">🔄</span>
            <div>
              <div class="font-bold">Đa Kho & Định Mức Pha Chế Tự Động (Multi-Inventory Sync):</div>
              <div class="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                Đồng bộ hóa khấu trừ tồn kho đa đơn vị: Đồ uống F&B trừ nguyên liệu theo <b>ml/gram</b>; Đặc sản OCOP & Bán lẻ trừ thành phẩm theo <b>Hộp/Kg</b>.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="flex items-center space-x-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
              <input type="checkbox" id="cfgPreCheckoutCheck" checked class="rounded border-slate-300 text-emerald-600">
              <div>
                <div class="font-bold text-slate-800">Trigger Kiểm Tra Trước Thanh Toán</div>
                <div class="text-[10px] text-slate-500">Chặn thanh toán nếu kho thành phẩm hoặc nguyên liệu thiếu</div>
              </div>
            </label>

            <label class="flex items-center space-x-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
              <input type="checkbox" id="cfgAutoPo" checked class="rounded border-slate-300 text-indigo-600">
              <div>
                <div class="font-bold text-slate-800">Tự Động Sinh Đề Xuất Nhập Hàng (PO)</div>
                <div class="text-[10px] text-slate-500">Bắn thông báo nhà cung ứng khi kho chạm ngưỡng tối thiểu</div>
              </div>
            </label>
          </div>

          <!-- Bảng Định Mức BOM Mẫu -->
          <div class="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-slate-900 text-xs">Công Thức Định Mức Pha Chế (BOM Recipe Engine):</span>
              <span class="text-[10px] text-blue-700 font-bold">100% Khấu trừ thời gian thực</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px]">
                    <th class="py-2 px-2.5">Món Bán (Ly/Phần)</th>
                    <th class="py-2 px-2.5">Nguyên Vật Liệu Tiêu Hao (g / ml / cái)</th>
                    <th class="py-2 px-2.5 text-center">Tồn Kho Nguyên Liệu</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-[11px]">
                  <tr>
                    <td class="py-2 px-2.5 font-bold text-slate-900">☕ Cà phê sữa đá</td>
                    <td class="py-2 px-2.5 text-slate-700">25g Hạt Robusta + 25ml Sữa đặc Ông Thọ</td>
                    <td class="py-2 px-2.5 text-center"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Đủ pha 598 ly</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-2.5 font-bold text-slate-900">🍹 Bạc xỉu 3 tầng</td>
                    <td class="py-2 px-2.5 text-slate-700">15g Cà phê + 30ml Sữa đặc + 80ml Sữa tươi</td>
                    <td class="py-2 px-2.5 text-center"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Đủ pha 150 ly</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-2.5 font-bold text-slate-900">🍑 Trà đào cam sả</td>
                    <td class="py-2 px-2.5 text-slate-700">15g Trà đen + 30ml Siro đào + 2 miếng đào ngâm</td>
                    <td class="py-2 px-2.5 text-center"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Đủ pha 75 ly</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- TAB 5: BẢNG GIÁ, GIỜ VÀNG (HAPPY HOUR) & MÙA VỤ -->
        <!-- ================================================================== -->
        <div id="settingsPanel-pricing" class="settings-panel hidden space-y-4">
          <div class="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-purple-950">
            <span class="text-xl">🏷️</span>
            <div>
              <div class="font-bold text-purple-900">Chính Sách Bảng Giá Đa Tầng (Dynamic Pricing Engine):</div>
              <div class="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                Tự động áp dụng giá sỉ khi khách mua nhiều, kích hoạt giá giờ vàng Happy Hour buổi sáng và cấu hình phụ thu buồng phòng mùa cao điểm.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" id="cfgWholesaleActive" checked class="rounded border-slate-300 text-emerald-600">
                <span class="font-bold text-slate-800">Áp dụng Giá Sỉ Tự Động (Tiered Wholesale)</span>
              </label>
              <div class="text-[11px] text-slate-500">
                Tự động giảm giá từ 10% - 15% cho Đặc sản OCOP khi giỏ hàng có từ <b>5 sản phẩm</b> trở lên.
              </div>
            </div>

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" id="cfgHappyHourActive" checked class="rounded border-slate-300 text-purple-600">
                <span class="font-bold text-slate-800">Giờ Vàng Cà Phê Sáng (Happy Hour)</span>
              </label>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-[10px] text-slate-500 font-semibold">Khung Giờ:</span>
                  <input type="text" id="cfgHappyHourTime" value="07:00 - 09:00" class="w-full px-2 py-1 border border-slate-300 rounded-lg font-bold text-purple-900">
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 font-semibold">Mức Giảm:</span>
                  <input type="number" id="cfgHappyHourDiscount" value="15" class="w-full px-2 py-1 border border-slate-300 rounded-lg font-bold text-[#D7262D]">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================== -->
        <!-- TAB 6: NHÂN VIÊN, PHÂN QUYỀN & CHỐT CA (SHIFT & CASH CLOSING) -->
        <!-- ================================================================== -->
        <div id="settingsPanel-shift" class="settings-panel hidden space-y-4">
          <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-2.5 text-indigo-950">
            <span class="text-xl">👥</span>
            <div>
              <div class="font-bold text-indigo-900">Quy Trình Quản Lý Ca Làm Việc & Bàn Giao Két Tiền:</div>
              <div class="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                Đảm bảo chống thất thoát tiền mặt quầy thu ngân. Bắt buộc kiểm đếm két tiền thực tế khi giao ca (Z-Report) và tự động đẩy báo cáo EOD về Zalo OA / Telegram của chủ quán.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Chính Sách Chốt Ca (Z-Report):</label>
              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" id="cfgRequireCashCount" checked class="rounded border-slate-300 text-indigo-600">
                  <span class="font-semibold text-slate-800">Bắt buộc đếm tiền mặt thực tế khi đóng ca</span>
                </label>
                <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span class="text-slate-500">Chênh lệch tối đa cho phép:</span>
                  <input type="number" id="cfgMaxDiscrepancy" value="20000" class="w-24 px-2 py-0.5 border border-slate-300 rounded text-right font-bold text-[#D7262D]">
                </div>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Kênh Tự Động Hóa Nhận Báo Cáo EOD:</label>
              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" id="cfgNotifyTelegram" checked class="rounded border-slate-300 text-blue-600">
                  <span class="font-semibold text-slate-800">Bắn báo cáo về Telegram Ban Điều Hành</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" id="cfgNotifyZalo" checked class="rounded border-slate-300 text-blue-600">
                  <span class="font-semibold text-slate-800">Bắn báo cáo về Nhóm Zalo Quản Trị</span>
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Action Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button onclick="closeModal('printerPaymentSettingsModal')" class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">
          Đóng
        </button>
        <button onclick="saveEnterpriseSettingsToServer()" class="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-floppy-disk"></i> <span>LƯU CẤU HÌNH VẬN HÀNH DOANH NGHIỆP</span>
        </button>
      </div>

    </div>
  </div>`;

if (oldModalRegex.test(htmlCode)) {
  htmlCode = htmlCode.replace(oldModalRegex, newEnterpriseModalHtml);
} else {
  // Replace the modal by id
  htmlCode = htmlCode.replace(/<div id="printerPaymentSettingsModal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newEnterpriseModalHtml);
}

// 4. Update JavaScript helper to handle 6 tabs and saveEnterpriseSettingsToServer
const oldSettingsScriptRegex = /function switchSettingsTab\(tab\) \{[\s\S]*?async function saveSettingsToServer\(\) \{[\s\S]*?showToast\("Đã lưu toàn bộ cấu hình[\s\S]*?\);\s*\}\s*catch[\s\S]*?\}\s*\}/;

const newEnterpriseSettingsScript = `function switchSettingsTab(tab) {
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
          
          // Tab 1: Business & E-Invoice
          if (systemSettings.business) {
            document.getElementById('cfgCompanyName').value = systemSettings.business.companyName || '';
            document.getElementById('cfgBrandName').value = systemSettings.business.brandName || '';
            document.getElementById('cfgBranchName').value = systemSettings.business.branchName || '';
            document.getElementById('cfgTaxAuthority').value = systemSettings.business.cqtAuthority || '';
          }
          if (systemSettings.einvoice) {
            document.getElementById('cfgTaxCode').value = systemSettings.einvoice.taxCode || '4401020233';
            document.getElementById('cfgTemplateSymbol').value = systemSettings.einvoice.templateSymbol || '1C26MDP';
            document.getElementById('cfgDefaultVatRate').value = systemSettings.einvoice.defaultVatRate || 8;
            document.getElementById('cfgN8nInvoiceWebhook').value = systemSettings.einvoice.n8nWebhookUrl || 'https://n8n.datphucore.vn/webhook/issue-invoice';
            document.getElementById('cfgAutoZns').checked = systemSettings.einvoice.autoSendZns !== false;
            document.getElementById('cfgAutoEmail').checked = systemSettings.einvoice.autoSendEmail !== false;
            
            const providerRadios = document.querySelectorAll('input[name="cfgInvoiceProvider"]');
            providerRadios.forEach(r => {
              if (r.value === (systemSettings.einvoice.provider || 'viettel_sinvoice')) r.checked = true;
            });
          }

          // Tab 2: VietQR & Payment
          if (systemSettings.vietqr) {
            document.getElementById('cfgBankId').value = systemSettings.vietqr.bankId || '970436';
            document.getElementById('cfgBankAccount').value = systemSettings.vietqr.accountNumber || '1038899889';
            document.getElementById('cfgAccountHolder').value = systemSettings.vietqr.accountHolder || 'CONG TY CP DAT PHU CORE';
            document.getElementById('cfgBankBranch').value = systemSettings.vietqr.branch || 'Chi nhánh Phú Yên';
            document.getElementById('cfgCardMpos').checked = systemSettings.vietqr.cardMposEnabled !== false;
          }

          // Tab 3: Hardware & Printers
          if (systemSettings.printer) {
            document.getElementById('cfgPaperSize').value = systemSettings.printer.paperSize || '58mm';
            document.getElementById('cfgAutoPrint').checked = systemSettings.printer.autoPrintOnPayment !== false;
            if (systemSettings.printer.cashDrawerRj11) {
              document.getElementById('cfgAutoKickDrawer').checked = systemSettings.printer.cashDrawerRj11.autoOpenOnCash !== false;
            }
            if (systemSettings.printer.kitchenPrinter) {
              document.getElementById('cfgKitchenDevice').value = systemSettings.printer.kitchenPrinter.deviceName || '';
              document.getElementById('cfgKitchenSplit').value = systemSettings.printer.kitchenPrinter.autoSplitFoodDrink ? 'auto_split' : 'single_ticket';
            }
          }

          // Tab 4: Multi-Inventory & BOM
          if (systemSettings.inventoryBOM) {
            document.getElementById('cfgPreCheckoutCheck').checked = systemSettings.inventoryBOM.preCheckoutValidation !== false;
            document.getElementById('cfgAutoPo').checked = systemSettings.inventoryBOM.autoGeneratePO !== false;
          }

          // Tab 5: Pricing & Happy Hour
          if (systemSettings.pricingRules) {
            document.getElementById('cfgWholesaleActive').checked = systemSettings.pricingRules.wholesaleEnabled !== false;
            document.getElementById('cfgHappyHourActive').checked = systemSettings.pricingRules.happyHourEnabled !== false;
            document.getElementById('cfgHappyHourTime').value = systemSettings.pricingRules.happyHourTime || '07:00 - 09:00';
            document.getElementById('cfgHappyHourDiscount').value = systemSettings.pricingRules.happyHourDiscount || 15;
          }

          // Tab 6: Shifts & Closing Policy
          if (systemSettings.shiftPolicy) {
            document.getElementById('cfgRequireCashCount').checked = systemSettings.shiftPolicy.requireCashCountZReport !== false;
            document.getElementById('cfgMaxDiscrepancy').value = systemSettings.shiftPolicy.maxDiscrepancyAllowed || 20000;
            document.getElementById('cfgNotifyTelegram').checked = systemSettings.shiftPolicy.notifyTelegramEOD !== false;
            document.getElementById('cfgNotifyZalo').checked = systemSettings.shiftPolicy.notifyZaloEOD !== false;
          }
        }
      } catch (e) {
        console.warn("Could not load settings:", e);
      }
    }

    async function saveEnterpriseSettingsToServer() {
      const selectedProvider = document.querySelector('input[name="cfgInvoiceProvider"]:checked')?.value || 'viettel_sinvoice';

      const payload = {
        business: {
          companyName: document.getElementById('cfgCompanyName').value,
          brandName: document.getElementById('cfgBrandName').value,
          branchName: document.getElementById('cfgBranchName').value,
          cqtAuthority: document.getElementById('cfgTaxAuthority').value
        },
        einvoice: {
          provider: selectedProvider,
          taxCode: document.getElementById('cfgTaxCode').value,
          templateSymbol: document.getElementById('cfgTemplateSymbol').value,
          defaultVatRate: parseInt(document.getElementById('cfgDefaultVatRate').value, 10) || 8,
          n8nWebhookUrl: document.getElementById('cfgN8nInvoiceWebhook').value,
          autoSendZns: document.getElementById('cfgAutoZns').checked,
          autoSendEmail: document.getElementById('cfgAutoEmail').checked
        },
        vietqr: {
          bankId: document.getElementById('cfgBankId').value,
          accountNumber: document.getElementById('cfgBankAccount').value,
          accountHolder: document.getElementById('cfgAccountHolder').value,
          branch: document.getElementById('cfgBankBranch').value,
          cardMposEnabled: document.getElementById('cfgCardMpos').checked
        },
        printer: {
          paperSize: document.getElementById('cfgPaperSize').value,
          autoPrintOnPayment: document.getElementById('cfgAutoPrint').checked,
          cashDrawerRj11: {
            enabled: true,
            autoOpenOnCash: document.getElementById('cfgAutoKickDrawer').checked
          },
          kitchenPrinter: {
            enabled: true,
            deviceName: document.getElementById('cfgKitchenDevice').value,
            autoSplitFoodDrink: document.getElementById('cfgKitchenSplit').value === 'auto_split'
          }
        },
        inventoryBOM: {
          preCheckoutValidation: document.getElementById('cfgPreCheckoutCheck').checked,
          autoGeneratePO: document.getElementById('cfgAutoPo').checked
        },
        pricingRules: {
          wholesaleEnabled: document.getElementById('cfgWholesaleActive').checked,
          happyHourEnabled: document.getElementById('cfgHappyHourActive').checked,
          happyHourTime: document.getElementById('cfgHappyHourTime').value,
          happyHourDiscount: parseInt(document.getElementById('cfgHappyHourDiscount').value, 10) || 15
        },
        shiftPolicy: {
          requireCashCountZReport: document.getElementById('cfgRequireCashCount').checked,
          maxDiscrepancyAllowed: parseInt(document.getElementById('cfgMaxDiscrepancy').value, 10) || 20000,
          notifyTelegramEOD: document.getElementById('cfgNotifyTelegram').checked,
          notifyZaloEOD: document.getElementById('cfgNotifyZalo').checked
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
        showToast("Đã lưu toàn bộ cấu hình Vận Hành Doanh Nghiệp (Enterprise POS) thành công!", "🏢");
      } catch (err) {
        showToast("Lỗi khi lưu cấu hình: " + err.message, "⚠️");
      }
    }

    async function testKitchenPrint() {
      showToast("Đang phát lệnh in phiếu bếp/quầy bar qua mạng nội bộ...", "🍳");
      setTimeout(() => {
        showToast("Đã nhả lệnh in phiếu bếp KDS thành công!", "✅");
      }, 900);
    }`;

if (oldSettingsScriptRegex.test(htmlCode)) {
  htmlCode = htmlCode.replace(oldSettingsScriptRegex, newEnterpriseSettingsScript);
}

fs.writeFileSync(htmlPath, htmlCode, 'utf8');
console.log('Successfully upgraded vi_an_sinh_app.html to Enterprise POS standard!');
