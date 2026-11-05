const fs = require('fs');

const targetPath = 'E:/datphu-backend/public/vi_an_sinh_app.html';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Rename Top Navigation Tab: "ĐẶC SẢN OCOP" -> "SẢN PHẨM KHÁC"
const oldTopNavOcop = `<button onclick="switchView('ocop')" id="topNav-ocop" class="top-nav-btn px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center space-x-1 whitespace-nowrap">
        <span>🎁</span>
        <span class="hidden md:inline">ĐẶC SẢN OCOP</span>
        <span class="inline md:hidden">OCOP</span>
      </button>`;

const newTopNavOcop = `<button onclick="switchView('ocop')" id="topNav-ocop" class="top-nav-btn px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center space-x-1 whitespace-nowrap">
        <span>🛍️</span>
        <span class="hidden md:inline">SẢN PHẨM KHÁC</span>
        <span class="inline md:hidden">SP KHÁC</span>
      </button>`;

content = content.replace(oldTopNavOcop, newTopNavOcop);

// Also handle if emoji was corrupted in regex
content = content.replace(/id="topNav-ocop"[\s\S]*?<span class="hidden md:inline">.*?OCOP<\/span>[\s\S]*?<\/button>/, `id="topNav-ocop" class="top-nav-btn px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center space-x-1 whitespace-nowrap">
        <span>🛍️</span>
        <span class="hidden md:inline">SẢN PHẨM KHÁC</span>
        <span class="inline md:hidden">SP KHÁC</span>
      </button>`);

// 2. Rename Fast POS category rail icon from "Đặc Sản" to "SP Khác"
content = content.replace(/id="catRail-souvenir"[\s\S]*?<span class="text-\[10px\] sm:text-\[11px\] font-bold leading-tight">.*?<\/span>/, `id="catRail-souvenir" class="cat-rail-btn w-full py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center text-center transition active:scale-95 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200">
            <span class="text-xl sm:text-2xl mb-0.5">🛍️</span>
            <span class="text-[10px] sm:text-[11px] font-bold leading-tight">SP Khác</span>`);

// 3. Update View 3 Header & Sub-bar with Store Configuration and Category Filters
const oldView3SectionStartRegex = /<section id="view-ocop"[\s\S]*?<!-- Lưới Sản Phẩm OCOP/;

const newView3SectionStart = `<section id="view-ocop" class="view-panel hidden flex-1 flex flex-col h-full overflow-hidden">
        <!-- Banner Gian Hàng Riêng Của Quán -->
        <div class="px-4 py-2.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-[#1E2260] text-white flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div class="flex items-center space-x-2.5">
            <span class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🏪</span>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="font-black text-sm uppercase tracking-wide" id="storeDisplayName">GIAN HÀNG RIÊNG: THANH GIANG KIOT & TIỆN ÍCH</h3>
                <span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">Chủ Quán Tự Quản Lý</span>
              </div>
              <div class="text-[11px] text-emerald-200" id="storeDisplaySlogan">Đặc sản OCOP Tuy Hòa, quà lưu niệm & đồ dùng tiện ích cho khách Hometel 86 Lê Duẩn</div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="openStoreConfigModal()" class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95">
              <i class="fa-solid fa-pen-to-square"></i> <span>Cấu Hình Gian Hàng</span>
            </button>
            <button onclick="openConfigModal('product', 'souvenir')" class="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95">
              <i class="fa-solid fa-plus"></i> <span>+ Thêm Sản Phẩm Mới</span>
            </button>
          </div>
        </div>

        <!-- Sub Bar: Bộ Lọc Danh Mục Sản Phẩm Khác -->
        <div class="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div class="flex items-center space-x-1.5 overflow-x-auto no-scrollbar" id="storeFilterBar">
            <span class="text-xs font-extrabold text-emerald-800 mr-1 flex items-center gap-1">
              <i class="fa-solid fa-tags"></i> DANH MỤC:
            </span>
            <button onclick="filterOcop('all')" class="ocop-pill active px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white shadow-sm transition">Tất Cả SP (<span id="countOcopAll">9</span>)</button>
            <button onclick="filterOcop('ocop')" class="ocop-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:border-emerald-700 transition">🌾 Đặc Sản OCOP</button>
            <button onclick="filterOcop('souvenir')" class="ocop-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:border-emerald-700 transition">👕 Quà Lưu Niệm</button>
            <button onclick="filterOcop('convenience')" class="ocop-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:border-emerald-700 transition">🧴 Tiện Ích & Tạp Hóa</button>
            <button onclick="filterOcop('coffee_bean')" class="ocop-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:border-emerald-700 transition">☕ Cà Phê Gói</button>
            <button onclick="filterOcop('custom')" class="ocop-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:border-emerald-700 transition">🍘 Hàng Quán Tự Làm</button>
          </div>

          <div class="flex items-center space-x-2 text-xs">
            <span class="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold hidden sm:inline-flex items-center">
              <i class="fa-solid fa-box-open mr-1"></i> Tự Động Trừ Kho Khi Bán
            </span>
          </div>
        </div>

        <!-- Lưới Sản Phẩm OCOP`;

content = content.replace(oldView3SectionStartRegex, newView3SectionStart);

// 4. Update PRODUCTS with diverse store items
const oldProductsBlockRegex = /\/\/ III\. ĐẶC SẢN OCOP & BÁN LẺ[\s\S]*?cat: "souvenir", subcat: "sauce", icon: "🍶", stock: 7, minStock: 10, unit: "Chai 500ml",\s*origin: "Làng nghề Gành Đỏ Tuy An"\s*\}/;

const newProductsBlock = `// III. SẢN PHẨM KHÁC & GIAN HÀNG RIÊNG CỦA QUÁN (BÁN LẺ, OCOP & TIỆN ÍCH)
      { 
        id: 'O-01', name: "Bò một nắng hai sương kèm muối kiến vàng", 
        price: 280000, wholesalePrice: 250000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "ocop", icon: "🥩", stock: 6, minStock: 10, unit: "Hộp 500g",
        origin: "HTX Sông Hinh (Phú Yên)",
        seasonTag: "Mùa Lễ Hội / Tết 2026"
      },
      { 
        id: 'O-02', name: "Thịt heo gác bếp Đắk Lắk", 
        price: 220000, wholesalePrice: 195000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "ocop", icon: "🥓", stock: 8, minStock: 10, unit: "Gói 500g",
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
        cat: "souvenir", subcat: "ocop", icon: "🍯", stock: 5, minStock: 10, unit: "Chai 500ml",
        origin: "HTX Rừng Đồng Xuân"
      },
      { 
        id: 'O-05', name: "Hạt đác tươi / rim sẵn theo mùa vụ", 
        price: 75000, wholesalePrice: 60000, wholesaleMinQty: 5, 
        seasonalPrice: 65000, seasonTag: "Mùa Thu Hoạch Đác 2026", 
        cat: "souvenir", subcat: "ocop", icon: "🥥", stock: 25, minStock: 10, unit: "Hũ 500g",
        origin: "Đặc sản Vực Phun (Tây Hòa)"
      },
      { 
        id: 'O-06', name: "Nước mắm Gành Đỏ thượng hạng", 
        price: 120000, wholesalePrice: 100000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "ocop", icon: "🍶", stock: 7, minStock: 10, unit: "Chai 500ml",
        origin: "Làng nghề Gành Đỏ Tuy An"
      },
      { 
        id: 'O-07', name: "Áo thun lưu niệm Du Lịch Phú Yên (Size M/L/XL)", 
        price: 95000, wholesalePrice: 80000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "souvenir", icon: "👕", stock: 20, minStock: 5, unit: "Cái",
        origin: "Thanh Giang Boutique (Độc Quyền)"
      },
      { 
        id: 'O-08', name: "Bộ đồ dùng tiện ích cá nhân du lịch 6 món", 
        price: 45000, wholesalePrice: 38000, wholesaleMinQty: 5, 
        cat: "souvenir", subcat: "convenience", icon: "🧴", stock: 35, minStock: 10, unit: "Bộ",
        origin: "Kiot Tiện Ích 86 Lê Duẩn"
      },
      { 
        id: 'O-09', name: "Bánh tráng dừa nướng giòn rụm", 
        price: 35000, wholesalePrice: 28000, wholesaleMinQty: 10, 
        cat: "souvenir", subcat: "custom", icon: "🍘", stock: 40, minStock: 10, unit: "Bịch 5 cái",
        origin: "Bếp Thanh Giang Tự Làm"
      }`;

if (oldProductsBlockRegex.test(content)) {
  content = content.replace(oldProductsBlockRegex, newProductsBlock);
}

// 5. Update renderOcop to include Delete / Edit quick actions and category badge
const newRenderOcopCode = `function renderOcop() {
      const container = document.getElementById('ocopContainer');
      if (!container) return;

      let ocopItems = PRODUCTS.filter(p => p.cat === 'souvenir');
      const countEl = document.getElementById('countOcopAll');
      if (countEl) countEl.innerText = ocopItems.length;

      if (currentOcopFilter !== 'all') {
        ocopItems = ocopItems.filter(p => p.subcat === currentOcopFilter);
      }

      if (ocopItems.length === 0) {
        container.innerHTML = \`
          <div class="col-span-full py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <span class="text-4xl mb-2">🛍️</span>
            <div class="font-bold text-slate-700 text-sm">Chưa có sản phẩm nào trong danh mục này</div>
            <p class="text-xs text-slate-400 mt-1">Chủ quán có thể bấm nút <b>"+ Thêm Sản Phẩm Mới"</b> để tạo hàng hóa cho gian hàng riêng.</p>
            <button onclick="openConfigModal('product', 'souvenir')" class="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition">
              + Thêm Sản Phẩm Ngay
            </button>
          </div>
        \`;
        return;
      }

      container.innerHTML = ocopItems.map(p => {
        const isLow = (p.stock || 0) <= (p.minStock || 10);
        const hasWholesale = !!p.wholesalePrice;
        const hasSeason = !!p.seasonalPrice || !!p.seasonTag;

        let subcatLabel = 'Sản phẩm khác';
        if (p.subcat === 'ocop') subcatLabel = '🌾 Đặc Sản OCOP';
        else if (p.subcat === 'souvenir') subcatLabel = '👕 Quà Lưu Niệm';
        else if (p.subcat === 'convenience') subcatLabel = '🧴 Tiện Ích';
        else if (p.subcat === 'coffee_bean') subcatLabel = '☕ Cà Phê Gói';
        else if (p.subcat === 'custom') subcatLabel = '🍘 Quán Tự Làm';

        return \`
          <div class="p-4 bg-white rounded-2xl border \${isLow ? 'border-amber-300 ring-1 ring-amber-300' : 'border-slate-200'} shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden group">
            
            <!-- Badge Mùa Vụ / Quản lý -->
            <div class="absolute top-2 right-2 flex items-center space-x-1">
              \${hasSeason ? \`
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs flex items-center gap-1">
                  🌟 \${p.seasonTag || 'Mùa Vụ 2026'}
                </span>
              \` : ''}
              <button onclick="deleteStoreProduct('\${p.id}')" title="Xóa sản phẩm này khỏi gian hàng" class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-400 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>

            <div>
              <div class="flex items-start justify-between">
                <span class="text-3xl p-2 bg-emerald-50 text-emerald-800 rounded-xl">\${p.icon || '🛍️'}</span>
                <div class="text-right flex flex-col items-end gap-1">
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                    \${subcatLabel}
                  </span>
                  \${isLow ? \`
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
                      <i class="fa-solid fa-triangle-exclamation"></i> Sắp hết (\${p.stock} \${p.unit || 'món'})
                    </span>
                  \` : \`
                    <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      Kho: \${p.stock} \${p.unit || 'món'}
                    </span>
                  \`}
                </div>
              </div>

              <div class="mt-3">
                <h3 class="font-black text-sm text-slate-900 leading-snug">\${p.name}</h3>
                <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <span>Quy cách: \${p.unit || 'Món'}</span>
                  <span>•</span>
                  <span class="text-emerald-700 font-bold">\${p.origin || 'Thanh Giang Kiot'}</span>
                </div>
                
                <div class="mt-2 space-y-1">
                  <div class="flex items-baseline justify-between">
                    <span class="text-xs text-slate-500 font-semibold">Giá bán lẻ:</span>
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

content = content.replace(/function renderOcop\(\) \{[\s\S]*?container\.innerHTML = ocopItems\.map[\s\S]*?\}\)\.join\(''\);\s*\}/, newRenderOcopCode);

// 6. Add Modal: Cấu Hình Gian Hàng Riêng Của Quán (storeConfigModal)
const storeConfigModalHtml = `
  <!-- ======================================================================== -->
  <!-- MODAL: CẤU HÌNH GIAN HÀNG RIÊNG CỦA QUÁN (STORE CONFIGURATION) -->
  <!-- ======================================================================== -->
  <div id="storeConfigModal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
    <div class="bg-white border-2 border-emerald-700 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
      <div class="p-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-[#1E2260] text-white flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-2.5">
          <span class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🏪</span>
          <div>
            <h3 class="font-black text-sm">CẤU HÌNH GIAN HÀNG RIÊNG CỦA QUÁN</h3>
            <div class="text-[10px] text-emerald-200">Linh hoạt đặt tên gian hàng, danh mục bán lẻ & chính sách bán hàng</div>
          </div>
        </div>
        <button onclick="closeModal('storeConfigModal')" class="text-white hover:text-emerald-200 font-black text-lg">&times;</button>
      </div>

      <div class="p-4 space-y-3.5 overflow-y-auto text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Tên Gian Hàng / Kiot Của Quán <span class="text-red-500">*</span></label>
          <input type="text" id="cfgStoreNameInput" value="GIAN HÀNG RIÊNG: THANH GIANG KIOT & TIỆN ÍCH" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-[#1E2260] focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          <div class="text-[10px] text-slate-400 mt-0.5">Tên hiển thị trên thanh tiêu đề gian hàng và hóa đơn bán hàng.</div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Khẩu Hiệu / Giới Thiệu Ngắn Về Gian Hàng</label>
          <input type="text" id="cfgStoreSloganInput" value="Đặc sản OCOP Tuy Hòa, quà lưu niệm & đồ dùng tiện ích cho khách Hometel 86 Lê Duẩn" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
        </div>

        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <div class="font-bold text-emerald-950 flex items-center gap-1.5">
            <i class="fa-solid fa-shapes text-emerald-700"></i> Các Nhóm Ngành Hàng Đang Kinh Doanh:
          </div>
          <div class="grid grid-cols-2 gap-2 text-slate-700">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked class="rounded border-slate-300 text-emerald-700">
              <span class="font-semibold">🌾 Đặc sản vùng miền / OCOP</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked class="rounded border-slate-300 text-emerald-700">
              <span class="font-semibold">👕 Quà tặng & Thời trang lưu niệm</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked class="rounded border-slate-300 text-emerald-700">
              <span class="font-semibold">🧴 Tiện ích cá nhân & Tạp hóa</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked class="rounded border-slate-300 text-emerald-700">
              <span class="font-semibold">☕ Cà phê nguyên chất đóng gói</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked class="rounded border-slate-300 text-emerald-700">
              <span class="font-semibold">🍘 Bánh mứt quán tự sản xuất</span>
            </label>
          </div>
        </div>

        <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600">
          💡 <b>Mẹo quản trị:</b> Chủ quán có thể tự do nhập hàng mới bất kỳ lúc nào bằng nút <b>"+ Thêm Sản Phẩm Mới"</b> mà không bị giới hạn chỉ ở đặc sản OCOP.
        </div>
      </div>

      <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between">
        <button onclick="closeModal('storeConfigModal')" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">
          Đóng
        </button>
        <button onclick="saveStoreConfig()" class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow transition active:scale-95 flex items-center gap-1.5">
          <i class="fa-solid fa-floppy-disk"></i> <span>Lưu Thay Đổi</span>
        </button>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="storeConfigModal"')) {
  content = content.replace('</body>', `${storeConfigModalHtml}\n</body>`);
}

// 7. Add JavaScript functions for store configuration and deletion
const storeScript = `
    // ========================================================================
    // QUẢN LÝ GIAN HÀNG RIÊNG & SẢN PHẨM KHÁC CỦA CHỦ QUÁN
    // ========================================================================
    function openStoreConfigModal() {
      const curName = document.getElementById('storeDisplayName').innerText;
      const curSlogan = document.getElementById('storeDisplaySlogan').innerText;
      document.getElementById('cfgStoreNameInput').value = curName;
      document.getElementById('cfgStoreSloganInput').value = curSlogan;
      document.getElementById('storeConfigModal').classList.remove('hidden');
    }

    function saveStoreConfig() {
      const newName = document.getElementById('cfgStoreNameInput').value.trim() || 'GIAN HÀNG RIÊNG: THANH GIANG KIOT';
      const newSlogan = document.getElementById('cfgStoreSloganInput').value.trim() || 'Đặc sản & tiện ích phục vụ khách hàng';
      
      document.getElementById('storeDisplayName').innerText = newName;
      document.getElementById('storeDisplaySlogan').innerText = newSlogan;
      localStorage.setItem('datphu_custom_store_name', newName);
      localStorage.setItem('datphu_custom_store_slogan', newSlogan);

      closeModal('storeConfigModal');
      showToast("Đã lưu thông tin gian hàng riêng thành công!", "🏪");
    }

    function deleteStoreProduct(prodId) {
      const prod = PRODUCTS.find(p => p.id === prodId);
      if (!prod) return;
      if (!confirm(\`Bạn có chắc muốn xóa sản phẩm "\${prod.name}" khỏi gian hàng không?\`)) return;

      const idx = PRODUCTS.findIndex(p => p.id === prodId);
      if (idx !== -1) {
        PRODUCTS.splice(idx, 1);
        renderOcop();
        renderFastPos();
        renderAdminPricingTable();
        showToast(\`Đã xóa "\${prod.name}" khỏi gian hàng!\`, "🗑️");
      }
    }

    // Nạp tên gian hàng đã lưu
    window.addEventListener('DOMContentLoaded', () => {
      const savedName = localStorage.getItem('datphu_custom_store_name');
      const savedSlogan = localStorage.getItem('datphu_custom_store_slogan');
      if (savedName && document.getElementById('storeDisplayName')) {
        document.getElementById('storeDisplayName').innerText = savedName;
      }
      if (savedSlogan && document.getElementById('storeDisplaySlogan')) {
        document.getElementById('storeDisplaySlogan').innerText = savedSlogan;
      }
    });
`;

if (!content.includes('function openStoreConfigModal')) {
  content = content.replace('// Khởi chạy khi nạp trang', `${storeScript}\n    // Khởi chạy khi nạp trang`);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated "Đặc Sản OCOP" to "Sản Phẩm Khác" with custom store management!');
