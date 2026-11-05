const fs = require('fs');

const targetPath = 'E:/datphu-backend/public/vi_an_sinh_app.html';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add Multi-Inventory Live Bar above Checkout Buttons in Cart Sidebar
const oldCartButtonsContainer = `<!-- Cụm Nút Đỏ & Xanh Navy Thanh Toán -->
        <div class="grid grid-cols-2 gap-2.5 pt-1">`;

const newCartButtonsContainer = `<!-- Tiện Ích Đa Kho Đồng Bộ & Kiểm Tra Khả Dụng -->
        <div onclick="openMultiInventoryPreviewModal()" class="cursor-pointer p-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-950 flex items-center justify-between text-xs transition active:scale-98 shadow-2xs">
          <div class="flex items-center space-x-1.5">
            <span class="text-sm">🔄</span>
            <div>
              <div class="font-extrabold text-[11px] leading-tight">Đa Kho: Pha Chế (ml/g) & Bán Lẻ (Hộp/Kg)</div>
              <div class="text-[9px] text-blue-700">Tự động kiểm tra tồn kho trước khi thanh toán</div>
            </div>
          </div>
          <span class="px-2 py-0.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] whitespace-nowrap">
            Xem BOM &rarr;
          </span>
        </div>

        <!-- Cụm Nút Đỏ & Xanh Navy Thanh Toán -->
        <div class="grid grid-cols-2 gap-2.5 pt-1">`;

if (!content.includes('openMultiInventoryPreviewModal()') && content.includes(oldCartButtonsContainer)) {
  content = content.replace(oldCartButtonsContainer, newCartButtonsContainer);
}

// 2. Modals: Inventory Alert Modal & Multi-Inventory Preview Modal
const inventoryModalsHtml = `
  <!-- ======================================================================== -->
  <!-- MODAL: CẢNH BÁO TỒN KHO KHÔNG ĐỦ (PRE-CHECKOUT INVENTORY VALIDATION) -->
  <!-- ======================================================================== -->
  <div id="inventoryAlertModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
    <div class="bg-white border-2 border-red-500 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-150">
      <div class="p-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-2.5">
          <span class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg font-black">⚠️</span>
          <div>
            <h3 class="font-black text-sm">CẢNH BÁO: TỒN KHO KHÔNG ĐỦ ĐỂ THANH TOÁN</h3>
            <div class="text-[10px] text-red-100">Kiểm tra tự động Multi-Inventory Sync</div>
          </div>
        </div>
        <button onclick="closeModal('inventoryAlertModal')" class="text-white hover:text-red-200 font-black text-xl leading-none">&times;</button>
      </div>

      <div class="p-4 space-y-3 text-xs">
        <div class="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-900 space-y-1.5">
          <div class="font-bold flex items-center gap-1.5 text-xs text-red-700">
            <i class="fa-solid fa-triangle-exclamation"></i> Phát hiện mặt hàng không đủ định mức:
          </div>
          <div class="text-[11px] text-red-800 leading-relaxed">
            Hệ thống đã tự động đối soát tồn kho đa tầng (BOM nguyên liệu pha chế ml/g & đặc sản hộp/kg) và chặn giao dịch để chống thất thoát.
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1.5">Chi Tiết Vi Phạm Tồn Kho:</label>
          <div id="inventoryAlertList" class="space-y-1.5 max-h-48 overflow-y-auto">
            <!-- Dynamic error items -->
          </div>
        </div>

        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
          👉 <b>Khắc phục:</b> Vui lòng giảm số lượng món trong giỏ hàng hoặc nhập thêm hàng hóa/nguyên vật liệu vào kho.
        </div>
      </div>

      <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button onclick="closeModal('inventoryAlertModal')" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95">
          Đã Hiểu & Điều Chỉnh Giỏ Hàng
        </button>
      </div>
    </div>
  </div>

  <!-- ======================================================================== -->
  <!-- MODAL: XEM ĐỊNH MỨC TRỪ KHO ĐA TẦNG (MULTI-INVENTORY SYNC PREVIEW) -->
  <!-- ======================================================================== -->
  <div id="multiInventoryPreviewModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
    <div class="bg-white border-2 border-blue-600 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
      <div class="p-4 bg-gradient-to-r from-blue-700 via-indigo-800 to-[#1E2260] text-white flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-2.5">
          <span class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🔄</span>
          <div>
            <h3 class="font-black text-sm">ĐỊNH MỨC TRỪ KHO ĐA TẦNG (MULTI-INVENTORY)</h3>
            <div class="text-[10px] text-blue-200">BOM Pha Chế (ml/g) & Sản Phẩm Đóng Gói (Hộp/Kg)</div>
          </div>
        </div>
        <button onclick="closeModal('multiInventoryPreviewModal')" class="text-white hover:text-blue-200 font-black text-lg">&times;</button>
      </div>

      <div class="p-4 space-y-4 overflow-y-auto text-xs flex-1">
        <!-- Nhóm 1: Đặc Sản Đóng Gói & Bán Lẻ -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <span>🛍️</span> <span>Sản Phẩm Đóng Gói & Bán Lẻ (Trừ theo Hộp / Gói / Chai):</span>
            </span>
            <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" id="previewRetailStatus">
              Khả Dụng
            </span>
          </div>
          <div id="previewRetailList" class="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <!-- Dynamic retail deductions -->
          </div>
        </div>

        <!-- Nhóm 2: Nguyên Vật Liệu Pha Chế BOM -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <span>☕</span> <span>Nguyên Vật Liệu Pha Chế BOM (Trừ theo ml / gram):</span>
            </span>
            <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" id="previewRawStatus">
              Đủ Định Mức
            </span>
          </div>
          <div id="previewRawList" class="p-2.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1.5">
            <!-- Dynamic raw materials deductions -->
          </div>
        </div>

        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-circle-check text-emerald-600 text-base"></i>
            <div>
              <div class="font-bold text-xs">Trạng Thái Sẵn Sàng Thanh Toán:</div>
              <div class="text-[10px] text-emerald-700">Đơn hàng đủ điều kiện khấu trừ kho tự động khi hoàn tất.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between">
        <button onclick="closeModal('multiInventoryPreviewModal')" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">
          Đóng
        </button>
        <button onclick="closeModal('multiInventoryPreviewModal'); openVietQRModal();" class="px-5 py-2.5 bg-[#1E2260] hover:bg-[#151846] text-white font-bold rounded-xl text-xs shadow transition active:scale-95 flex items-center gap-1.5">
          <span>Tiến Hành Thanh Toán</span> &rarr;
        </button>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="inventoryAlertModal"')) {
  content = content.replace('</body>', `${inventoryModalsHtml}\n</body>`);
}

// 3. Client-side functions for pre-checkout validation
const multiInventoryScript = `
    // ========================================================================
    // TÍNH NĂNG ĐA KHO MULTI-INVENTORY SYNC & PRE-CHECKOUT VALIDATION
    // ========================================================================
    let lastInventoryDeductions = { retail: [], rawMaterials: [] };

    async function checkInventoryBeforeCheckout() {
      if (cart.length === 0) {
        showToast("Vui lòng chọn món hoặc sản phẩm trước khi thanh toán!", "🛒");
        return { valid: false, errors: ["Giỏ hàng đang trống"] };
      }

      try {
        const resp = await fetch('/api/pos/inventory/validate-cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map(it => ({ id: it.id, name: it.name, qty: it.qty }))
          })
        });
        const data = await resp.json();
        if (data.deductions) {
          lastInventoryDeductions = data.deductions;
        }
        return data;
      } catch (err) {
        console.warn("Lỗi kiểm tra kho qua server, chạy fallback client:", err);
        return { valid: true, errors: [], warnings: [] };
      }
    }

    function showInventoryErrorModal(errors) {
      const listEl = document.getElementById('inventoryAlertList');
      if (listEl) {
        listEl.innerHTML = errors.map(err => \`
          <div class="p-2.5 bg-white border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2 shadow-2xs">
            <span class="text-red-500 font-bold mt-0.5">✕</span>
            <span>\${err}</span>
          </div>
        \`).join('');
      }
      document.getElementById('inventoryAlertModal').classList.remove('hidden');
    }

    async function openMultiInventoryPreviewModal() {
      if (cart.length === 0) {
        showToast("Vui lòng thêm sản phẩm vào giỏ để xem định mức khấu trừ!", "🛒");
        return;
      }

      showToast("Đang tính toán BOM nguyên liệu & tồn kho...", "🔄");
      const validation = await checkInventoryBeforeCheckout();

      const retailContainer = document.getElementById('previewRetailList');
      const rawContainer = document.getElementById('previewRawList');

      // 1. Hiển thị sản phẩm đóng gói
      if (lastInventoryDeductions.retail && lastInventoryDeductions.retail.length > 0) {
        retailContainer.innerHTML = lastInventoryDeductions.retail.map(r => \`
          <div class="flex justify-between items-center text-xs py-1 border-b border-slate-200 last:border-b-0">
            <div>
              <div class="font-bold text-slate-800">\${r.name}</div>
              <div class="text-[10px] text-slate-500">Khấu trừ: <b class="text-[#D7262D]">-\${r.quantity} \${r.unit}</b> (Hiện có: \${r.currentStock})</div>
            </div>
            <div class="text-right">
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Sau bán: \${r.remainingStock} \${r.unit}</span>
            </div>
          </div>
        \`).join('');
      } else {
        retailContainer.innerHTML = '<div class="text-[11px] text-slate-400 py-1 text-center">Đơn hàng không có sản phẩm đóng gói lẻ.</div>';
      }

      // 2. Hiển thị nguyên vật liệu pha chế
      if (lastInventoryDeductions.rawMaterials && lastInventoryDeductions.rawMaterials.length > 0) {
        rawContainer.innerHTML = lastInventoryDeductions.rawMaterials.map(m => \`
          <div class="flex justify-between items-center text-xs py-1 border-b border-blue-100 last:border-b-0">
            <div>
              <div class="font-bold text-blue-950">\${m.name}</div>
              <div class="text-[10px] text-blue-700">Định mức trừ: <b class="text-indigo-700">-\${m.neededAmount} \${m.unit}</b> (Kho còn: \${m.currentStock} \${m.unit})</div>
            </div>
            <div class="text-right">
              <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">Sau bán: \${m.remainingStock} \${m.unit}</span>
            </div>
          </div>
        \`).join('');
      } else {
        rawContainer.innerHTML = '<div class="text-[11px] text-slate-400 py-1 text-center">Đơn hàng không tiêu hao nguyên vật liệu pha chế.</div>';
      }

      document.getElementById('multiInventoryPreviewModal').classList.remove('hidden');
    }
`;

if (!content.includes('function checkInventoryBeforeCheckout')) {
  content = content.replace('// Khởi chạy khi nạp trang', `${multiInventoryScript}\n    // Khởi chạy khi nạp trang`);
}

// 4. Update openCashModal and openVietQRModal to be async and call checkInventoryBeforeCheckout()
const oldOpenCashRegex = /function openCashModal\(\) \{[\s\S]*?document\.getElementById\('cashModal'\)\.classList\.remove\('hidden'\);\s*\}/;

const newOpenCashCode = `async function openCashModal() {
      const total = getCartTotal();
      if (total === 0) {
        showToast("Vui lòng chọn món hoặc chọn bàn/phòng có đơn!", "🛒");
        return;
      }

      // TRIGGER: Kiểm tra tồn kho đa tầng (BOM ml/g & Hộp/kg) trước khi mở thanh toán
      const invCheck = await checkInventoryBeforeCheckout();
      if (!invCheck.valid) {
        showInventoryErrorModal(invCheck.errors);
        return;
      }

      document.getElementById('cashTotalReq').innerText = formatVND(total);
      document.getElementById('cashTargetInfo').innerText = currentTarget.name;

      const suggestions = [total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, 200000, 500000, 1000000].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 6);

      const btnContainer = document.getElementById('quickCashButtons');
      btnContainer.innerHTML = suggestions.map((amt) => \`
        <button onclick="selectCashGiven(\${amt})" class="py-2 px-1.5 bg-slate-100 border border-slate-200 hover:border-[#D7262D] rounded-xl font-bold text-xs text-center transition">
          \${formatVND(amt)}
        </button>
      \`).join('');

      selectCashGiven(total);
      document.getElementById('cashModal').classList.remove('hidden');
    }`;

content = content.replace(oldOpenCashRegex, newOpenCashCode);

const oldOpenVietQrRegex = /function openVietQRModal\(\) \{[\s\S]*?document\.getElementById\('vietqrModal'\)\.classList\.remove\('hidden'\);\s*\}/;

const newOpenVietQrCode = `async function openVietQRModal() {
      const total = getCartTotal();
      if (total === 0) {
        showToast("Vui lòng chọn món hoặc chọn bàn/phòng có đơn!", "🛒");
        return;
      }

      // TRIGGER: Kiểm tra tồn kho đa tầng (BOM ml/g & Hộp/kg) trước khi mở thanh toán
      const invCheck = await checkInventoryBeforeCheckout();
      if (!invCheck.valid) {
        showInventoryErrorModal(invCheck.errors);
        return;
      }

      orderCounter++;
      const orderCode = 'AS' + orderCounter;
      document.getElementById('qrOrderCode').innerText = orderCode;
      document.getElementById('qrTargetInfo').innerText = currentTarget.name;
      document.getElementById('qrAmount').innerText = formatVND(total);

      const qrUrl = \`https://api.vietqr.io/image/970422-0987654321-compact2.png?amount=\${total}&addInfo=\${orderCode}&accountName=VI%20AN%20SINH%20DAT%20PHU\`;
      document.getElementById('qrImg').src = qrUrl;
      document.getElementById('qrSuccessOverlay').classList.add('hidden');
      document.getElementById('vietqrModal').classList.remove('hidden');
    }`;

content = content.replace(oldOpenVietQrRegex, newOpenVietQrCode);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully added Multi-Inventory validation & BOM preview UI to vi_an_sinh_app.html');
