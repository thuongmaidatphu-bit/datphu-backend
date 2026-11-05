const fs = require('fs');

const targetPath = 'E:/datphu-backend/public/vi_an_sinh_app.html';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update cfgProdCat options
const oldCatSelect = `<select id="cfgProdCat" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none" onchange="onCategoryChange()">
                <option value="coffee">☕ Cà Phê & Đồ Uống (F&B)</option>
                <option value="food">🍜 Đồ Ăn Sáng & Khai Vị</option>
                <option value="souvenir">🎁 Đặc Sản OCOP & Quà Tặng</option>
                <option value="room">🏠 Tiền Buồng Phòng & Phụ Thu</option>
                <option value="rental">🛵 Thuê Xe & Tiện Ích Du Khách</option>
              </select>`;

const newCatSelect = `<select id="cfgProdCat" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none" onchange="onCategoryChange()">
                <option value="coffee">☕ Cà Phê & Đồ Uống (F&B)</option>
                <option value="food">🍜 Đồ Ăn Sáng & Khai Vị</option>
                <option value="souvenir" selected>🛍️ Sản Phẩm Khác (Gian Hàng Riêng Của Quán)</option>
                <option value="room">🏠 Tiền Buồng Phòng & Phụ Thu</option>
                <option value="rental">🛵 Thuê Xe & Tiện Ích Du Khách</option>
              </select>`;

content = content.replace(oldCatSelect, newCatSelect);

// Handle fallback pattern if emoji characters were encoded differently
content = content.replace(/<select id="cfgProdCat"[\s\S]*?<\/select>/, newCatSelect);

// 2. Add extra fields for Store subcat and origin if not present
const subcatAndOriginFields = `
          <!-- Phân Nhóm Chi Tiết & Nguồn Gốc Trong Gian Hàng -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="cfgStoreExtraFields">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nhóm Ngành Hàng Trong Gian Hàng:</label>
              <select id="cfgProdSubcat" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none">
                <option value="ocop">🌾 Đặc Sản OCOP Tuy Hòa</option>
                <option value="souvenir">👕 Quà Tặng & Lưu Niệm</option>
                <option value="convenience">🧴 Tiện Ích & Tạp Hóa Khách Ở</option>
                <option value="coffee_bean">☕ Cà Phê Đóng Gói (Hạt/Bột)</option>
                <option value="custom">🍘 Hàng Quán Tự Làm / Chế Biến</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nguồn Gốc / Đơn Vị Cung Cấp:</label>
              <input type="text" id="cfgProdOrigin" placeholder="VD: Bếp quán tự làm, HTX Sông Hinh..." value="Gian Hàng Thanh Giang" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none">
            </div>
          </div>`;

if (!content.includes('id="cfgStoreExtraFields"')) {
  content = content.replace('<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">', subcatAndOriginFields + '\n\n          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">');
}

// 3. Update submitNewProduct() to read subcat and origin
const oldSubmitProductSnippet = `      const payload = {
        name,
        category,
        price,
        wholesalePrice,
        wholesaleMinQty,
        seasonalPrice: seasonTag ? price : undefined,
        seasonTag,
        unit,
        stockQuantity: stock,
        minStockLevel: minStock,
        image: icon,
        icon,
        merchantId: 'M-01'
      };`;

const newSubmitProductSnippet = `      const subcat = document.getElementById('cfgProdSubcat') ? document.getElementById('cfgProdSubcat').value : (category === 'souvenir' ? 'custom' : category);
      const origin = document.getElementById('cfgProdOrigin') ? document.getElementById('cfgProdOrigin').value.trim() : 'Gian Hàng Riêng Của Quán';

      const payload = {
        name,
        category,
        subcat,
        origin,
        price,
        wholesalePrice,
        wholesaleMinQty,
        seasonalPrice: seasonTag ? price : undefined,
        seasonTag,
        unit,
        stockQuantity: stock,
        minStockLevel: minStock,
        image: icon,
        icon,
        merchantId: 'M-01'
      };`;

content = content.replace(oldSubmitProductSnippet, newSubmitProductSnippet);

// Update in-memory push inside submitNewProduct
const oldPushSnippet = `          PRODUCTS.push({
            id: result.product.id,
            name: result.product.name,
            price: result.product.price,
            wholesalePrice: result.product.wholesalePrice,
            wholesaleMinQty: result.product.wholesaleMinQty,
            seasonalPrice: result.product.seasonalPrice,
            seasonTag: result.product.seasonTag,
            cat: result.product.category,
            subcat: result.product.subcat,
            icon: result.product.image || icon,
            stock: result.product.stockQuantity,
            unit: result.product.unit
          });`;

const newPushSnippet = `          PRODUCTS.push({
            id: result.product.id,
            name: result.product.name,
            price: result.product.price,
            wholesalePrice: result.product.wholesalePrice,
            wholesaleMinQty: result.product.wholesaleMinQty,
            seasonalPrice: result.product.seasonalPrice,
            seasonTag: result.product.seasonTag,
            cat: result.product.category,
            subcat: result.product.subcat || subcat,
            origin: result.product.origin || origin,
            icon: result.product.image || icon,
            stock: result.product.stockQuantity,
            unit: result.product.unit
          });`;

content = content.replace(oldPushSnippet, newPushSnippet);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully enhanced product creation modal with subcat & origin fields!');
