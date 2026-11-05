const fs = require('fs');
const path = require('path');

const targetPath = 'E:/datphu-backend/public/vi_an_sinh_app.html';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add EOD button to Header
const headerToolsTarget = `<div class="hidden xl:flex items-center space-x-2">`;
const headerToolsReplacement = `<div class="hidden xl:flex items-center space-x-2">
      <button onclick="openEodModal()" id="btEodBtn" title="Chốt Ca Doanh Thu Cuối Ngày & Báo Cáo" class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition active:scale-95">
        <i class="fa-solid fa-moon"></i>
        <span>Chốt Ca & Báo Cáo</span>
      </button>`;

if (content.includes(headerToolsTarget) && !content.includes('openEodModal()')) {
  content = content.replace(headerToolsTarget, headerToolsReplacement);
}

// 2. Add quickCheckInModal call on button
content = content.replace(`onclick="quickCheckInModal()"`, `onclick="openHometelCheckIn()"`);

// 3. Update TABLES data to include timeMinutes and realistic values
const oldTablesSnippet = `    let TABLES = [
      { 
        id: "T-01", name: "Bàn 01", area: "garden", areaName: "Khu Sân Vườn", 
        status: "empty", guests: 0, items: [], total: 0, time: "" 
      },
      { 
        id: "T-02", name: "Bàn 02", area: "garden", areaName: "Khu Sân Vườn", 
        status: "occupied", guests: 2, 
        items: [{ id: 'P-01', name: "Cà phê sữa (Đá / Nóng)", qty: 2, price: 20000 }, { id: 'P-03', name: "Bạc xỉu ba tầng", qty: 1, price: 25000 }, { id: 'P-09', name: "Bánh mì chả cá Tuy Hòa", qty: 1, price: 22000 }], 
        total: 87000, time: "25 phút" 
      },
      { 
        id: "T-03", name: "Bàn 03", area: "garden", areaName: "Khu Sân Vườn", 
        status: "occupied", guests: 4, 
        items: [{ id: 'P-04', name: "Trà đào cam sả", qty: 3, price: 28000 }, { id: 'P-10', name: "Bánh canh hẹ Sông Cầu", qty: 2, price: 35000 }], 
        total: 154000, time: "40 phút" 
      },
      { 
        id: "T-04", name: "Bàn 04", area: "garden", areaName: "Khu Sân Vườn", 
        status: "reserved", guests: 0, items: [], total: 0, time: "Hẹn 18:30" 
      },
      { 
        id: "T-05", name: "Bàn 05 (Tầng 1)", area: "indoor", areaName: "Máy Lạnh Tầng 1", 
        status: "empty", guests: 0, items: [], total: 0, time: "" 
      },
      { 
        id: "T-06", name: "Bàn 06 (Tầng 1)", area: "indoor", areaName: "Máy Lạnh Tầng 1", 
        status: "occupied", guests: 3, 
        items: [{ id: 'P-02', name: "Cà phê đen (Đá / Nóng)", qty: 2, price: 18000 }, { id: 'P-01', name: "Cà phê sữa (Đá / Nóng)", qty: 1, price: 20000 }], 
        total: 56000, time: "15 phút" 
      },
      { 
        id: "T-07", name: "Bàn VIP 01", area: "indoor", areaName: "Máy Lạnh Tầng 1", 
        status: "occupied", guests: 6, 
        items: [{ id: 'P-03', name: "Bạc xỉu ba tầng", qty: 4, price: 25000 }, { id: 'P-04', name: "Trà đào cam sả", qty: 2, price: 28000 }, { id: 'O-01', name: "Bò một nắng hai sương kèm muối kiến vàng", qty: 1, price: 280000 }], 
        total: 436000, time: "1 giờ" 
      },
      { 
        id: "T-08", name: "Bàn ST-01", area: "rooftop", areaName: "Sân Thượng View Biển", 
        status: "empty", guests: 0, items: [], total: 0, time: "" 
      },
      { 
        id: "T-09", name: "Bàn ST-02", area: "rooftop", areaName: "Sân Thượng View Biển", 
        status: "reserved", guests: 0, items: [], total: 0, time: "Hẹn 19:00" 
      },
      { 
        id: "T-10", name: "Bàn Mang Về (Takeaway)", area: "takeaway", areaName: "Quầy Mang Đi", 
        status: "empty", guests: 0, items: [], total: 0, time: "" 
      }
    ];`;

const newTablesSnippet = `    let TABLES = [
      { 
        id: "T-01", name: "Bàn 01", area: "garden", areaName: "Khu Sân Vườn", 
        status: "empty", guests: 0, items: [], total: 0, time: "", timeMinutes: 0 
      },
      { 
        id: "T-02", name: "Bàn 02", area: "garden", areaName: "Khu Sân Vườn", 
        status: "occupied", guests: 2, 
        items: [{ id: 'P-01', name: "Cà phê sữa (Đá / Nóng)", qty: 2, price: 20000 }, { id: 'P-03', name: "Bạc xỉu ba tầng", qty: 1, price: 25000 }, { id: 'P-09', name: "Bánh mì chả cá Tuy Hòa", qty: 1, price: 22000 }], 
        total: 87000, time: "25 phút", timeMinutes: 25 
      },
      { 
        id: "T-03", name: "Bàn 03", area: "garden", areaName: "Khu Sân Vườn", 
        status: "occupied", guests: 4, 
        items: [{ id: 'P-04', name: "Trà đào cam sả", qty: 3, price: 28000 }, { id: 'P-10', name: "Bánh canh hẹ Sông Cầu", qty: 2, price: 35000 }], 
        total: 154000, time: "45 phút", timeMinutes: 45 
      },
      { 
        id: "T-04", name: "Bàn 04", area: "garden", areaName: "Khu Sân Vườn", 
        status: "reserved", guests: 0, items: [], total: 0, time: "Hẹn 18:30", timeMinutes: 0 
      },
      { 
        id: "T-05", name: "Bàn 05 (Tầng 1)", area: "indoor", areaName: "Máy Lạnh Tầng 1", 
        status: "empty", guests: 0, items: [], total: 0, time: "", timeMinutes: 0 
      },
      { 
        id: "T-06", name: "Bàn 06 (Tầng 1)", area: "indoor", areaName: "Máy Lạnh Tầng 1", 
        status: "occupied", guests: 3, 
        items: [{ id: 'P-02', name: "Cà phê đen (Đá / Nóng)", qty: 2, price: 18000 }, { id: 'P-01', name: "Cà phê sữa (Đá / Nóng)", qty: 1, price: 20000 }], 
        total: 56000, time: "15 phút", timeMinutes: 15 
      },
      { 
        id: "T-07", name: "Bàn VIP 01", area: "indoor", areaName: "Máy Lạnh Tầng 1", 
        status: "occupied", guests: 6, 
        items: [{ id: 'P-03', name: "Bạc xỉu ba tầng", qty: 4, price: 25000 }, { id: 'P-04', name: "Trà đào cam sả", qty: 2, price: 28000 }, { id: 'O-01', name: "Bò một nắng hai sương kèm muối kiến vàng", qty: 1, price: 280000 }], 
        total: 436000, time: "75 phút", timeMinutes: 75 
      },
      { 
        id: "T-08", name: "Bàn ST-01", area: "rooftop", areaName: "Sân Thượng View Biển", 
        status: "empty", guests: 0, items: [], total: 0, time: "", timeMinutes: 0 
      },
      { 
        id: "T-09", name: "Bàn ST-02", area: "rooftop", areaName: "Sân Thượng View Biển", 
        status: "reserved", guests: 0, items: [], total: 0, time: "Hẹn 19:00", timeMinutes: 0 
      },
      { 
        id: "T-10", name: "Bàn Mang Về (Takeaway)", area: "takeaway", areaName: "Quầy Mang Đi", 
        status: "empty", guests: 0, items: [], total: 0, time: "", timeMinutes: 0 
      }
    ];`;

if (content.includes(oldTablesSnippet)) {
  content = content.replace(oldTablesSnippet, newTablesSnippet);
}

// 4. Update OCOP PRODUCTS stock & origin to show low stock alerts
const oldOcopProductsSnippet = `      // III. ĐẶC SẢN OCOP & BÁN LẺ (KÈM BẢNG GIÁ SỈ & MÙA VỤ)
      { 
        id: 'O-01', name: "Bò một nắng hai sương kèm muối kiến vàng", 
        price: 280000, wholesalePrice: 250000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "beef", icon: "🥩", stock: 35, unit: "Hộp 500g",
        seasonTag: "Mùa Lễ Hội / Tết 2026"
      },
      { 
        id: 'O-02', name: "Thịt heo gác bếp Đắk Lắk", 
        price: 220000, wholesalePrice: 195000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "beef", icon: "🥓", stock: 20, unit: "Gói 500g"
      },
      { 
        id: 'O-03', name: "Cà phê nguyên chất đóng gói (Hạt/Bột)", 
        price: 130000, wholesalePrice: 110000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "coffee_bean", icon: "☕", stock: 50, unit: "Gói 500g"
      },
      { 
        id: 'O-04', name: "Mật ong rừng nguyên chất", 
        price: 180000, wholesalePrice: 150000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "salt", icon: "🍯", stock: 30, unit: "Chai 500ml"
      },
      { 
        id: 'O-05', name: "Hạt đác tươi / rim sẵn theo mùa vụ", 
        price: 75000, wholesalePrice: 60000, wholesaleMinQty: 5, 
        seasonalPrice: 65000, seasonTag: "Mùa Thu Hoạch Đác 2026", 
        cat: "souvenir", subcat: "salt", icon: "🥥", stock: 40, unit: "Hũ 500g"
      },
      { 
        id: 'O-06', name: "Nước mắm Gành Đỏ thượng hạng", 
        price: 120000, wholesalePrice: 100000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "sauce", icon: "🍶", stock: 35, unit: "Chai 500ml"
      }`;

const newOcopProductsSnippet = `      // III. ĐẶC SẢN OCOP & BÁN LẺ (KÈM BẢNG GIÁ SỈ & MÙA VỤ)
      { 
        id: 'O-01', name: "Bò một nắng hai sương kèm muối kiến vàng", 
        price: 280000, wholesalePrice: 250000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "beef", icon: "🥩", stock: 6, minStock: 10, unit: "Hộp 500g",
        origin: "HTX Sông Hinh (Phú Yên)",
        seasonTag: "Mùa Lễ Hội / Tết 2026"
      },
      { 
        id: 'O-02', name: "Thịt heo gác bếp Đắk Lắk", 
        price: 220000, wholesalePrice: 195000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "beef", icon: "🥓", stock: 8, minStock: 10, unit: "Gói 500g",
        origin: "HTX Krông Pa (Tây Nguyên)"
      },
      { 
        id: 'O-03', name: "Cà phê nguyên chất đóng gói (Hạt/Bột)", 
        price: 130000, wholesalePrice: 110000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "coffee_bean", icon: "☕", stock: 32, minStock: 10, unit: "Gói 500g",
        origin: "Nông trường Cà phê Đất Phú"
      },
      { 
        id: 'O-04', name: "Mật ong rừng nguyên chất", 
        price: 180000, wholesalePrice: 150000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "salt", icon: "🍯", stock: 5, minStock: 10, unit: "Chai 500ml",
        origin: "HTX Rừng Đồng Xuân"
      },
      { 
        id: 'O-05', name: "Hạt đác tươi / rim sẵn theo mùa vụ", 
        price: 75000, wholesalePrice: 60000, wholesaleMinQty: 5, 
        seasonalPrice: 65000, seasonTag: "Mùa Thu Hoạch Đác 2026", 
        cat: "souvenir", subcat: "salt", icon: "🥥", stock: 25, minStock: 10, unit: "Hũ 500g",
        origin: "Đặc sản Vực Phun (Tây Hòa)"
      },
      { 
        id: 'O-06', name: "Nước mắm Gành Đỏ thượng hạng", 
        price: 120000, wholesalePrice: 100000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "sauce", icon: "🍶", stock: 7, minStock: 10, unit: "Chai 500ml",
        origin: "Làng nghề Gành Đỏ Tuy An"
      }`;

if (content.includes(oldOcopProductsSnippet)) {
  content = content.replace(oldOcopProductsSnippet, newOcopProductsSnippet);
}

// 5. Update renderTables implementation
const oldRenderTablesRegex = /function renderTables\(\) \{[\s\S]*?container\.innerHTML = filtered\.map\(t => \{[\s\S]*?if \(t\.status === 'occupied'\) \{[\s\S]*?\} else if \(t\.status === 'reserved'\) \{[\s\S]*?\} else \{[\s\S]*?actionButtons = `[\s\S]*?`;\s*\}\s*return `[\s\S]*?`;\s*\}\)\.join\(''\);\s*\}/;

const newRenderTablesCode = `function renderTables() {
      const container = document.getElementById('tablesContainer');
      if (!container) return;

      const filtered = currentTableArea === 'all' ? TABLES : TABLES.filter(t => t.area === currentTableArea);

      container.innerHTML = filtered.map(t => {
        let badgeHtml = '';
        let borderStyle = 'border-slate-200';
        let bgStyle = 'bg-white';
        let itemsHtml = '';
        let actionButtons = '';

        if (t.status === 'occupied') {
          const mins = t.timeMinutes || 25;
          let timeBadge = '';

          if (mins < 30) {
            borderStyle = 'border-sky-400 bg-sky-50/50 hover:border-sky-500 shadow-sm';
            timeBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 🟢 Mới vào (' + (t.time || (mins + ' phút')) + ')</span>';
          } else if (mins <= 60) {
            borderStyle = 'border-amber-400 bg-amber-50/60 hover:border-amber-500 shadow-sm';
            timeBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> 🟡 Phục vụ ' + (t.time || (mins + ' phút')) + '</span>';
          } else {
            borderStyle = 'border-red-500 bg-red-50/70 ring-2 ring-red-400 hover:border-red-600 shadow-md';
            timeBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 flex items-center gap-1 ring-1 ring-red-400 animate-pulse"><span class="w-2 h-2 rounded-full bg-red-600"></span> 🔴 Quá 60p (' + (t.time || (mins + ' phút')) + ') • Chú ý dọn / bill</span>';
          }
          badgeHtml = timeBadge;
          
          itemsHtml = \`
            <div class="my-2 p-2 bg-white/95 rounded-xl border border-red-100 text-xs space-y-1">
              <div class="text-[11px] font-bold text-slate-500 uppercase">Món đang dùng (\${t.items.length}):</div>
              \${t.items.map(it => \`
                <div class="flex justify-between text-slate-700 text-[11px]">
                  <span>\${it.qty}x \${it.name}</span>
                  <span class="font-semibold text-slate-900">\${formatVND(it.price * it.qty)}</span>
                </div>
              \`).join('')}
              <div class="pt-1 border-t border-slate-100 flex justify-between font-black text-xs text-[#D7262D]">
                <span>Tạm tính:</span>
                <span>\${formatVND(t.total)}</span>
              </div>
            </div>
          \`;

          actionButtons = \`
            <div class="grid grid-cols-2 gap-1.5 mt-2">
              <button onclick="loadTableToCart('\${t.id}')" class="py-1.5 px-2 bg-[#1E2260] hover:bg-[#151846] text-white text-[11px] font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1">
                <i class="fa-solid fa-plus text-[10px]"></i> <span>Thêm Món</span>
              </button>
              <button onclick="quickPayTable('\${t.id}')" class="py-1.5 px-2 bg-[#D7262D] hover:bg-red-700 text-white text-[11px] font-black rounded-lg shadow-sm transition flex items-center justify-center gap-1">
                <i class="fa-solid fa-bolt text-[10px]"></i> <span>Thanh Toán</span>
              </button>
            </div>
            <div class="grid grid-cols-2 gap-1.5 mt-1.5">
              <button onclick="openTableActionModalDirect('move', '\${t.id}')" class="py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1">
                <i class="fa-solid fa-arrows-split-up-and-left text-[9px]"></i> <span>Đổi Bàn</span>
              </button>
              <button onclick="openTableActionModalDirect('merge', '\${t.id}')" class="py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1">
                <i class="fa-solid fa-code-merge text-[9px]"></i> <span>Gộp Bàn</span>
              </button>
            </div>
          \`;
        } else if (t.status === 'reserved') {
          borderStyle = 'border-amber-400 bg-amber-50/50';
          badgeHtml = \`<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">📅 Đặt trước (\${t.time})</span>\`;
          itemsHtml = \`<div class="my-3 py-4 text-center text-xs text-amber-800 font-semibold bg-white/60 rounded-xl">Khách đã đặt trước chỗ ngồi lúc \${t.time}</div>\`;
          actionButtons = \`
            <button onclick="seatReservedTable('\${t.id}')" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1">
              <i class="fa-solid fa-user-check"></i> <span>Khách Đã Đến / Nhận Bàn</span>
            </button>
          \`;
        } else {
          borderStyle = 'border-emerald-300 bg-emerald-50/30';
          badgeHtml = \`<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">🟢 Bàn Trống</span>\`;
          itemsHtml = \`<div class="my-3 py-5 text-center text-xs text-slate-400 font-medium">Bàn đang trống, sẵn sàng đón khách mới</div>\`;
          actionButtons = \`
            <button onclick="seatEmptyTable('\${t.id}')" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-chair"></i> <span>Mở Bàn Mới / Nhận Khách</span>
            </button>
          \`;
        }

        return \`
          <div class="p-3.5 rounded-2xl border \${borderStyle} \${bgStyle} transition shadow-sm hover:shadow-md flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="text-xl">🪑</span>
                  <div>
                    <h3 class="font-black text-sm text-slate-900">\${t.name}</h3>
                    <div class="text-[10px] font-semibold text-slate-400">\${t.areaName}</div>
                  </div>
                </div>
                \${badgeHtml}
              </div>
              \${itemsHtml}
            </div>
            \${actionButtons}
          </div>
        \`;
      }).join('');
    }`;

if (oldRenderTablesRegex.test(content)) {
  content = content.replace(oldRenderTablesRegex, newRenderTablesCode);
}

// 6. Update renderRooms to support Check-in modal & Finish cleaning button
const oldRenderRoomsFinishCleaning = `finishCleaning('\${r.id}')`;
content = content.replaceAll(oldRenderRoomsFinishCleaning, `finishRoomCleaning('\${r.id}')`);

// 7. Update renderOcop to show HTX origin and low-stock badge
const oldRenderOcopRegex = /function renderOcop\(\) \{[\s\S]*?let ocopItems = PRODUCTS\.filter[\s\S]*?container\.innerHTML = ocopItems\.map\(p => \{[\s\S]*?return `[\s\S]*?`;\s*\}\)\.join\(''\);\s*\}/;

const newRenderOcopCode = `function renderOcop() {
      const container = document.getElementById('ocopContainer');
      if (!container) return;

      let ocopItems = PRODUCTS.filter(p => p.cat === 'souvenir');
      if (currentOcopFilter !== 'all') {
        ocopItems = ocopItems.filter(p => p.subcat === currentOcopFilter);
      }

      container.innerHTML = ocopItems.map(p => {
        const isLow = (p.stock || 0) <= 10;
        const hasWholesale = !!p.wholesalePrice;
        const hasSeason = !!p.seasonalPrice || !!p.seasonTag;

        return \`
          <div class="p-4 bg-white rounded-2xl border \${isLow ? 'border-amber-300 ring-1 ring-amber-300' : 'border-slate-200'} shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden group">
            \${hasSeason ? \`
              <div class="absolute top-2 right-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs flex items-center gap-1">
                  🌟 \${p.seasonTag || 'Mùa Vụ 2026'}
                </span>
              </div>
            \` : ''}
            <div>
              <div class="flex items-start justify-between">
                <span class="text-3xl p-2 bg-emerald-50 text-emerald-800 rounded-xl">\${p.icon}</span>
                <div class="text-right flex flex-col items-end gap-1">
                  \${isLow ? \`
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
                      <i class="fa-solid fa-triangle-exclamation"></i> Sắp hết (\${p.stock} \${p.unit || 'gói'})
                    </span>
                  \` : \`
                    <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      Kho: \${p.stock}
                    </span>
                  \`}
                </div>
              </div>
              <div class="mt-3">
                <h3 class="font-black text-sm text-slate-900 leading-snug">\${p.name}</h3>
                <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <span>Quy cách: \${p.unit || '500g'}</span>
                  <span>•</span>
                  <span class="text-emerald-700 font-bold">\${p.origin || 'HTX Sông Hinh (Phú Yên)'}</span>
                </div>
                
                <div class="mt-2 space-y-1">
                  <div class="flex items-baseline justify-between">
                    <span class="text-xs text-slate-500 font-semibold">Giá lẻ:</span>
                    <span class="text-base font-black text-[#D7262D]">\${formatVND(p.price)}</span>
                  </div>
                  \${hasWholesale ? \`
                    <div class="flex items-center justify-between text-xs bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      <span class="text-emerald-800 font-bold flex items-center gap-1">
                        <i class="fa-solid fa-tags"></i> Giá sỉ (&ge; \${p.wholesaleMinQty || 5}):
                      </span>
                      <span class="font-black text-emerald-900">\${formatVND(p.wholesalePrice)}</span>
                    </div>
                  \` : ''}
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center space-x-2 mt-3">
              <button onclick="addToCartDirect('\${p.id}')" class="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-cart-plus"></i> <span>Bán Lẻ 1 Đơn</span>
              </button>
              <button onclick="addWholesaleDirect('\${p.id}')" title="Thêm nhanh 5 gói giá sỉ" class="px-2.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs shadow-sm transition active:scale-95">
                Sỉ &times;5
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }`;

if (oldRenderOcopRegex.test(content)) {
  content = content.replace(oldRenderOcopRegex, newRenderOcopCode);
}

// 8. Add Web Audio chime function, Hometel check-in functions, table quick actions, and receipt modal logic
const newHelperFunctions = `
    // ========================================================================
    // TỰ ĐỘNG HÓA DÒNG TIỀN: WEB AUDIO CHIME & HÓA ĐƠN ĐIỆN TỬ 1C26MDP
    // ========================================================================
    let invoiceSequence = 54;

    function playPaymentChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        // Chime 1: A5 (880Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.35);

        // Chime 2: E6 (1320Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
        gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.12);
        osc2.stop(ctx.currentTime + 0.7);
      } catch (err) {
        console.warn("Web Audio chime not supported or autoplay blocked:", err);
      }
    }

    function openTableActionModalDirect(type, tableId) {
      const table = TABLES.find(t => t.id === tableId);
      if (table) {
        currentTarget = { type: 'table', id: table.id, name: table.name, icon: '🪑' };
        updateTargetBadge();
      }
      openTableActionModal(type);
    }

    function seatEmptyTable(tableId) {
      const table = TABLES.find(t => t.id === tableId);
      if (!table) return;
      table.status = 'occupied';
      table.time = '1 phút';
      table.timeMinutes = 1;
      table.guests = 2;
      table.items = [];
      table.total = 0;
      currentTarget = { type: 'table', id: table.id, name: table.name, icon: '🪑' };
      updateTargetBadge();
      renderTables();
      switchView('pos');
      showToast(\`Đã mở \${table.name}! Vui lòng chọn đồ uống/món ăn.\`, "🪑");
    }

    // ========================================================================
    // HOMETEL CHECK-IN FLOW (THEO GIỜ & THEO ĐÊM)
    // ========================================================================
    let selectedCheckInRoomId = null;

    function openHometelCheckIn(roomId) {
      selectedCheckInRoomId = roomId || null;
      const select = document.getElementById('chkInRoomSelect');
      if (select) {
        const availableRooms = ROOMS.filter(r => r.status === 'empty');
        select.innerHTML = ROOMS.map(r => \`
          <option value="\${r.id}" \${(r.id === roomId || (!roomId && r.status === 'empty')) ? 'selected' : ''} \${r.status !== 'empty' ? 'disabled' : ''}>
            \${r.name} (\${r.tierName}) \${r.status === 'empty' ? ' - Sẵn sàng' : ' - ' + (r.status === 'occupied' ? 'Đang có khách' : 'Chờ dọn')}
          </option>
        \`).join('');
      }
      document.getElementById('hometelCheckInModal').classList.remove('hidden');
    }

    function quickCheckInModal() {
      openHometelCheckIn();
    }

    function submitHometelCheckIn() {
      const roomId = document.getElementById('chkInRoomSelect').value;
      const guestName = document.getElementById('chkInGuestName').value.trim() || 'Khách Vãng Lai';
      const guestPhone = document.getElementById('chkInGuestPhone').value.trim() || '0905.xxx.xxx';
      const stayType = document.querySelector('input[name="chkInStayType"]:checked').value;
      
      const room = ROOMS.find(r => r.id === roomId);
      if (!room) return;

      room.status = 'occupied';
      room.guestName = guestName;
      room.phone = guestPhone;
      room.checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hôm nay';

      if (stayType === 'hour') {
        room.type = 'Theo Giờ (2h)';
        room.roomPrice = 120000;
      } else {
        room.type = 'Qua Đêm';
        room.roomPrice = room.tier === 'suite' ? 750000 : (room.tier === 'deluxe' ? 500000 : 350000);
      }
      room.services = [];
      room.total = room.roomPrice;

      closeModal('hometelCheckInModal');
      renderRooms();
      showToast(\`Đã nhận phòng \${room.name} cho \${guestName} (\${room.type})!\`, "🔑");
    }

    function finishRoomCleaning(roomId) {
      const room = ROOMS.find(r => r.id === roomId);
      if (!room) return;
      room.status = 'empty';
      room.guestName = '';
      room.phone = '';
      room.type = 'Sẵn sàng đón khách';
      room.checkIn = 'Sẵn sàng đón khách';
      room.services = [];
      room.total = 0;
      renderRooms();
      showToast(\`Đã hoàn tất dọn buồng \${room.name}! Phòng sẵn sàng đón khách.\`, "🧹");
    }

    // ========================================================================
    // MODAL IN BILL NHIỆT 58MM BLUETOOTH & HĐĐT 1C26MDP
    // ========================================================================
    let lastCompletedReceipt = null;

    function openThermalReceiptModal(receipt) {
      lastCompletedReceipt = receipt;
      document.getElementById('receiptInvoiceNo').innerText = receipt.invoiceNo;
      document.getElementById('receiptDateTime').innerText = receipt.dateTime;
      document.getElementById('receiptTarget').innerText = receipt.targetName;
      document.getElementById('receiptCashier').innerText = receipt.cashierName || 'Thu Ngân 01';
      document.getElementById('receiptMethod').innerText = receipt.method;
      document.getElementById('receiptTotal').innerText = formatVND(receipt.total);
      
      const itemsContainer = document.getElementById('receiptItemList');
      itemsContainer.innerHTML = receipt.items.map(it => \`
        <div class="flex justify-between py-1 text-xs border-b border-dashed border-slate-200">
          <div>
            <div class="font-bold text-slate-800">\${it.name}</div>
            <div class="text-[10px] text-slate-500">\${it.qty} &times; \${formatVND(it.price)}</div>
          </div>
          <div class="font-black text-slate-900">\${formatVND(it.price * it.qty)}</div>
        </div>
      \`).join('');

      document.getElementById('thermalReceiptModal').classList.remove('hidden');
    }

    function printThermalBillNow() {
      showToast("Đang phát lệnh in Bluetooth 58mm đến máy in PT-210...", "🖨️");
      setTimeout(() => {
        showToast("Đã in bill nhiệt thành công!", "✅");
      }, 1000);
    }

    // ========================================================================
    // CHỐT CA CUỐI NGÀY & GỬI BÁO CÁO N8N / ZALO / TELEGRAM
    // ========================================================================
    function openEodModal() {
      // Calculate daily stats from orders and tables
      const modal = document.getElementById('eodReportModal');
      document.getElementById('eodModalDate').innerText = new Date().toLocaleDateString('vi-VN');
      modal.classList.remove('hidden');
    }

    async function triggerEodPush() {
      const btn = document.getElementById('btnSubmitEod');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang bắn Webhook...';

      try {
        const resp = await fetch('/api/pos/reports/eod-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            cashierName: 'Thu Ngân 01',
            shift: 'Ca Tối'
          })
        });
        const resData = await resp.json();
        playPaymentChime();
        closeModal('eodReportModal');
        showToast("Đã chốt ca & bắn báo cáo tức thì về n8n / Zalo chủ quán!", "🚀");
      } catch (err) {
        showToast("Lỗi đẩy webhook n8n: " + err.message, "⚠️");
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-1"></i> Bắn Báo Cáo Tức Thì Qua n8n Webhook / Zalo';
      }
    }
`;

// Insert new helper functions before closing script tag
if (!content.includes('function playPaymentChime')) {
  content = content.replace('// Khởi chạy khi nạp trang', newHelperFunctions + '\n    // Khởi chạy khi nạp trang');
}

// 9. Update finishCheckout to deduct stock, call backend API, trigger chime, and pop thermal receipt modal
const oldFinishCheckoutRegex = /function finishCheckout\(method\) \{[\s\S]*?showToast\(`Đã thu[\s\S]*?\);\s*\}/;

const newFinishCheckoutCode = `function finishCheckout(method) {
      const total = getCartTotal();
      const printBill = document.getElementById('chkPrintBill').checked;
      const paidName = currentTarget.name;
      const cartSnapshot = JSON.parse(JSON.stringify(cart));

      // Tạo mã số Hóa đơn điện tử máy tính tiền MTT theo NĐ 123
      invoiceSequence++;
      const invoiceNo = '1C26MDP-' + String(invoiceSequence).padStart(5, '0');
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');

      // Tự động trừ tồn kho thời gian thực
      cartSnapshot.forEach(item => {
        const prod = PRODUCTS.find(p => p.id === item.id);
        if (prod && typeof prod.stock === 'number') {
          prod.stock = Math.max(0, prod.stock - item.qty);
        }
      });

      // Phát âm thanh Ting Ting thông báo qua Web Audio
      playPaymentChime();

      // Đồng bộ đơn hàng lên Backend
      fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: paidName,
          paymentMethod: method === 'Tiền mặt' ? 'cash' : 'napas247_vietqr',
          items: cartSnapshot.map(i => ({ id: i.id, name: i.name, quantity: i.qty, unit_price: i.price, subtotal: i.price * i.qty })),
          totalAmount: total,
          invoiceCode: invoiceNo
        })
      }).catch(err => console.warn('Order sync failed:', err));

      // Xóa trạng thái bàn nếu đang thanh toán bàn
      if (currentTarget.type === 'table') {
        const table = TABLES.find(t => t.id === currentTarget.id);
        if (table) {
          table.status = 'empty';
          table.items = [];
          table.total = 0;
          table.time = '';
          table.timeMinutes = 0;
        }
      }
      // Chuyển sang chờ dọn buồng nếu đang thanh toán phòng
      else if (currentTarget.type === 'room') {
        const room = ROOMS.find(r => r.id === currentTarget.id);
        if (room) {
          room.status = 'cleaning';
          room.guestName = 'Chờ dọn buồng';
          room.services = [];
          room.total = 0;
        }
      }

      clearCart();
      renderTables();
      renderRooms();
      renderOcop();
      renderFastPos();

      showToast(\`Đã thu \${formatVND(total)} (\${method}) [\${paidName}]! HĐĐT: \${invoiceNo}\`, "✅");

      // Bật cửa sổ xem trước hóa đơn nhiệt 58mm nếu được chọn
      if (printBill) {
        setTimeout(() => {
          openThermalReceiptModal({
            invoiceNo: invoiceNo,
            dateTime: nowStr,
            targetName: paidName,
            cashierName: 'Thu Ngân 01',
            method: method,
            items: cartSnapshot,
            total: total
          });
        }, 300);
      }
    }`;

if (oldFinishCheckoutRegex.test(content)) {
  content = content.replace(oldFinishCheckoutRegex, newFinishCheckoutCode);
}

// 10. Update simulateBankWebhook to call backend webhook before confirming
const oldSimulateBankWebhookSnippet = `    function simulateBankWebhook() {
      document.getElementById('qrSuccessOverlay').classList.remove('hidden');
      setTimeout(() => {
        closeModal('vietqrModal');
        finishCheckout("VietQR Napas247");
      }, 1200);
    }`;

const newSimulateBankWebhookSnippet = `    async function simulateBankWebhook() {
      const total = getCartTotal();
      document.getElementById('qrSuccessOverlay').classList.remove('hidden');
      
      try {
        await fetch('/api/pos/payments/bank-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: 'ORD-' + Date.now(),
            amount: total,
            referenceCode: 'MB-' + Math.floor(100000 + Math.random() * 900000)
          })
        });
      } catch (err) {}

      setTimeout(() => {
        closeModal('vietqrModal');
        finishCheckout("VietQR Napas247");
      }, 1000);
    }`;

if (content.includes(oldSimulateBankWebhookSnippet)) {
  content = content.replace(oldSimulateBankWebhookSnippet, newSimulateBankWebhookSnippet);
}

// 11. Append the 3 modals (Thermal Receipt, Hometel Check-in, EOD Report) before </body>
const modalsHtml = `
  <!-- ======================================================================== -->
  <!-- MODAL: XEM TRƯỚC HÓA ĐƠN NHIỆT BLUETOOTH 58MM & HĐĐT 1C26MDP (NĐ 123) -->
  <!-- ======================================================================== -->
  <div id="thermalReceiptModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
    <div class="bg-white rounded-3xl w-full max-w-sm max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-2 border-slate-300 animate-in fade-in duration-150">
      <div class="p-3.5 bg-gradient-to-r from-slate-900 to-[#1E2260] text-white flex items-center justify-between shadow-sm">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-receipt text-amber-400"></i>
          <span class="font-extrabold text-sm">HÓA ĐƠN ĐIỆN TỬ MÁY TÍNH TIỀN (58MM)</span>
        </div>
        <button onclick="closeModal('thermalReceiptModal')" class="text-slate-300 hover:text-white font-black text-lg">&times;</button>
      </div>

      <!-- Khổ giấy in nhiệt 58mm mô phỏng -->
      <div class="flex-1 p-4 overflow-y-auto bg-slate-50 flex justify-center">
        <div class="w-full bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-xs font-mono text-slate-800 space-y-2.5">
          <!-- Receipt Header -->
          <div class="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
            <div class="font-black text-sm text-[#1E2260]">ĐẤT PHÚ CORE - VÍ AN SINH</div>
            <div class="font-bold text-[11px] text-slate-700">THANH GIANG HOMETEL & CAFE</div>
            <div class="text-[10px] text-slate-500">86 Lê Duẩn, P.7, TP. Tuy Hòa, Phú Yên</div>
            <div class="text-[10px] text-slate-500">MST: <b class="text-slate-700">4401020233</b> • ĐT: 0912.888.xxx</div>
            <div class="mt-1 pt-1 border-t border-slate-200 text-[10px] font-bold text-blue-700">
              HÓA ĐƠN MTT KHỞI TẠO TỪ MÁY TÍNH TIỀN
            </div>
            <div class="text-[10px] text-slate-600">
              Ký hiệu: <b class="text-slate-900">1C26MDP</b> | Số: <b id="receiptInvoiceNo" class="text-[#D7262D]">1C26MDP-00055</b>
            </div>
          </div>

          <!-- Metadata -->
          <div class="text-[10px] space-y-0.5 text-slate-600 border-b border-dashed border-slate-300 pb-2">
            <div class="flex justify-between"><span>Thời gian:</span> <b id="receiptDateTime">--</b></div>
            <div class="flex justify-between"><span>Khu vực / Bàn:</span> <b id="receiptTarget" class="text-slate-900">--</b></div>
            <div class="flex justify-between"><span>Thu ngân:</span> <b id="receiptCashier">Thu Ngân 01</b></div>
            <div class="flex justify-between"><span>Thanh toán:</span> <b id="receiptMethod" class="text-emerald-700">VietQR Napas247</b></div>
          </div>

          <!-- Items list -->
          <div id="receiptItemList" class="space-y-1">
            <!-- Render items -->
          </div>

          <!-- Summary -->
          <div class="pt-2 border-t-2 border-dashed border-slate-400 space-y-1 text-xs">
            <div class="flex justify-between font-black text-sm text-slate-900">
              <span>TỔNG CỘNG:</span>
              <span id="receiptTotal" class="text-[#D7262D] text-base">0 đ</span>
            </div>
            <div class="text-[10px] text-emerald-700 font-bold text-center">
              (Đã bao gồm thuế GTGT & truyền dữ liệu CQT)
            </div>
          </div>

          <!-- QR CQT lookup info -->
          <div class="pt-2 border-t border-dashed border-slate-300 text-center space-y-1">
            <div class="inline-block p-1.5 border border-slate-300 rounded bg-white">
              <i class="fa-solid fa-qrcode text-3xl text-slate-800"></i>
            </div>
            <div class="text-[9px] text-slate-500">Tra cứu HĐĐT tại: <b>hoadondientu.gdt.gov.vn</b></div>
            <div class="font-bold text-[10px] text-slate-700">CẢM ƠN QUÝ KHÁCH - HẸN GẶP LẠI!</div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-3 bg-white border-t border-slate-200 grid grid-cols-2 gap-2">
        <button onclick="printThermalBillNow()" class="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition">
          <i class="fa-solid fa-print"></i> <span>In Ngay (PT-210)</span>
        </button>
        <button onclick="closeModal('thermalReceiptModal')" class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition">
          Đóng
        </button>
      </div>
    </div>
  </div>

  <!-- ======================================================================== -->
  <!-- MODAL: CHECK-IN NHANH BUỒNG PHÒNG HOMETEL (THEO GIỜ / THEO ĐÊM) -->
  <!-- ======================================================================== -->
  <div id="hometelCheckInModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
    <div class="bg-white border-2 border-[#D7262D] rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
      <div class="p-4 bg-gradient-to-r from-[#D7262D] to-[#1E2260] text-white flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-hotel text-lg"></i>
          <div>
            <h3 class="font-black text-sm">NHẬN PHÒNG HOMETEL (CHECK-IN)</h3>
            <div class="text-[10px] text-red-100">86 Lê Duẩn, TP. Tuy Hòa - Quản lý buồng phòng</div>
          </div>
        </div>
        <button onclick="closeModal('hometelCheckInModal')" class="text-white hover:text-red-200 font-black text-lg">&times;</button>
      </div>

      <div class="p-4 space-y-3.5 overflow-y-auto">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Chọn Buồng Phòng Trống:</label>
          <select id="chkInRoomSelect" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#D7262D] focus:outline-none">
            <!-- options render dynamically -->
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Hình Thức Lưu Trú:</label>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center space-x-2 p-2.5 border border-slate-300 rounded-xl cursor-pointer hover:border-[#D7262D]">
              <input type="radio" name="chkInStayType" value="night" checked class="text-[#D7262D]">
              <div>
                <div class="font-bold text-xs text-slate-800">🌙 Theo Đêm</div>
                <div class="text-[10px] text-slate-500">Từ 350.000 đ/đêm</div>
              </div>
            </label>
            <label class="flex items-center space-x-2 p-2.5 border border-slate-300 rounded-xl cursor-pointer hover:border-[#D7262D]">
              <input type="radio" name="chkInStayType" value="hour" class="text-[#D7262D]">
              <div>
                <div class="font-bold text-xs text-slate-800">⏱️ Theo Giờ</div>
                <div class="text-[10px] text-slate-500">120.000 đ (2h đầu)</div>
              </div>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tên Khách Hàng <span class="text-red-500">*</span></label>
            <input type="text" id="chkInGuestName" placeholder="VD: Anh Minh (Hà Nội)" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#D7262D] focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
            <input type="text" id="chkInGuestPhone" placeholder="VD: 0912.888.xxx" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#D7262D] focus:outline-none">
          </div>
        </div>

        <div class="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
          <div class="font-bold flex items-center gap-1">
            <i class="fa-solid fa-circle-info text-blue-600"></i> Lưu ý nhận phòng:
          </div>
          <div class="text-[11px] text-blue-800">
            Hệ thống tự động kích hoạt phòng sang trạng thái <b>Đang ở</b> và cấp thẻ dịch vụ F&B / Minibar gắn liền với mã phòng.
          </div>
        </div>
      </div>

      <div class="p-3.5 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
        <button onclick="submitHometelCheckIn()" class="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1">
          <i class="fa-solid fa-key"></i> <span>Xác Nhận Check-in</span>
        </button>
        <button onclick="closeModal('hometelCheckInModal')" class="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">
          Hủy
        </button>
      </div>
    </div>
  </div>

  <!-- ======================================================================== -->
  <!-- MODAL: CHỐT CA CUỐI NGÀY & GỬI BÁO CÁO QUA N8N WEBHOOK (ZALO/TELEGRAM) -->
  <!-- ======================================================================== -->
  <div id="eodReportModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
    <div class="bg-white border-2 border-indigo-600 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
      <div class="p-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-[#1E2260] text-white flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-2.5">
          <span class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🌙</span>
          <div>
            <h3 class="font-black text-sm">CHỐT CA VẬN HÀNH & TỰ ĐỘNG BÁO CÁO EOD</h3>
            <div class="text-[10px] text-indigo-200">Đất Phú Core • Thanh Giang Hometel & Cafe 86 Lê Duẩn</div>
          </div>
        </div>
        <button onclick="closeModal('eodReportModal')" class="text-white hover:text-indigo-200 font-black text-lg">&times;</button>
      </div>

      <div class="p-4 space-y-3.5 overflow-y-auto text-xs">
        <!-- Ngày & Ca -->
        <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
          <div>
            <div class="text-[10px] font-bold text-indigo-600 uppercase">Ngày Báo Cáo:</div>
            <div class="font-black text-sm text-indigo-950" id="eodModalDate">03/11/2026</div>
          </div>
          <div class="text-right">
            <span class="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
              Ca Chiều / Tối (Thu Ngân 01)
            </span>
          </div>
        </div>

        <!-- Chỉ số tài chính -->
        <div class="grid grid-cols-2 gap-2.5">
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div class="text-[10px] text-slate-500 font-semibold">TỔNG DOANH THU CA:</div>
            <div class="text-lg font-black text-[#D7262D] mt-0.5">8.940.000 đ</div>
            <div class="text-[10px] text-slate-400 mt-1">Đã chốt & đối soát 100%</div>
          </div>
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div class="text-[10px] text-slate-500 font-semibold">HÓA ĐƠN MTT (1C26MDP):</div>
            <div class="text-lg font-black text-indigo-900 mt-0.5">54 HĐ</div>
            <div class="text-[10px] text-emerald-600 font-bold mt-1">Đồng bộ CQT Tuy Hòa</div>
          </div>
        </div>

        <!-- Phân bổ doanh thu -->
        <div class="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
          <div class="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
            <span>Cơ Cấu Dòng Tiền & Dịch Vụ:</span>
            <span class="text-indigo-600 font-semibold text-[10px]">Thời gian thực</span>
          </div>
          <div class="space-y-1.5 text-xs text-slate-700">
            <div class="flex justify-between">
              <span>☕ Cà phê & Đồ uống F&B (48 món):</span>
              <b class="text-slate-900">2.140.000 đ</b>
            </div>
            <div class="flex justify-between">
              <span>🏠 Doanh thu Hometel Lưu trú (4 phòng):</span>
              <b class="text-slate-900">3.800.000 đ</b>
            </div>
            <div class="flex justify-between">
              <span>🎁 Đặc sản OCOP Bán lẻ/Sỉ (Bò 1 nắng, nước mắm):</span>
              <b class="text-slate-900">3.000.000 đ</b>
            </div>
            <div class="pt-2 border-t border-slate-100 flex justify-between font-bold text-indigo-900">
              <span>📲 Chuyển khoản VietQR Napas247 (Tự động):</span>
              <span>6.450.000 đ (72%)</span>
            </div>
            <div class="flex justify-between font-bold text-amber-800">
              <span>💵 Tiền mặt thu tại quầy:</span>
              <span>2.490.000 đ (28%)</span>
            </div>
          </div>
        </div>

        <!-- Kênh gửi n8n Webhook -->
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
          <div class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <i class="fa-solid fa-satellite-dish text-indigo-600"></i> Kênh Tự Động Hóa n8n Webhook:
          </div>
          <div class="text-[11px] text-slate-600">
            Hệ thống sẽ nén báo cáo thành Markdown và bắn trực tiếp về <b>Nhóm Zalo Quản Trị & Telegram Ban Điều Hành</b>.
          </div>
        </div>
      </div>

      <div class="p-3.5 bg-white border-t border-slate-200 grid grid-cols-2 gap-2">
        <button id="btnSubmitEod" onclick="triggerEodPush()" class="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-paper-plane"></i> <span>Bắn Báo Cáo Qua n8n</span>
        </button>
        <button onclick="closeModal('eodReportModal')" class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition">
          Đóng
        </button>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="thermalReceiptModal"')) {
  content = content.replace('</body>', modalsHtml + '\n</body>');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated E:/datphu-backend/public/vi_an_sinh_app.html');
