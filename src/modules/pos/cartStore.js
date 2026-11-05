/**
 * ============================================================================
 * ĐẤT PHÚ CORE - MULTI-INVENTORY SYNC & CART STORE (cartStore.js)
 * Quản lý đa kho & đồng bộ tồn kho tự động đa đơn vị tính:
 * - Đồ uống pha chế (F&B): Trừ nguyên vật liệu theo ml / gram (BOM)
 * - Sản phẩm khác & Đặc sản OCOP (Retail): Trừ thành phẩm theo Hộp / Gói / Chai / Kg
 * - Kiểm tra tính khả dụng của tồn kho trước khi thanh toán (Pre-checkout Validation)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Công thức định lượng nguyên vật liệu pha chế (BOM - Bill of Materials)
const RECIPES = {
  // Cà phê sữa: 25g cà phê hạt + 25ml sữa đặc
  'P-01': [
    { materialId: 'RM-01', materialName: 'Hạt Cà Phê Mộc Robusta', amount: 25, unit: 'g' },
    { materialId: 'RM-02', materialName: 'Sữa Đặc Có Đường Ông Thọ', amount: 25, unit: 'ml' }
  ],
  // Cà phê đen: 25g cà phê hạt
  'P-02': [
    { materialId: 'RM-01', materialName: 'Hạt Cà Phê Mộc Robusta', amount: 25, unit: 'g' }
  ],
  // Bạc xỉu ba tầng: 15g cà phê + 30ml sữa đặc + 80ml sữa tươi
  'P-03': [
    { materialId: 'RM-01', materialName: 'Hạt Cà Phê Mộc Robusta', amount: 15, unit: 'g' },
    { materialId: 'RM-02', materialName: 'Sữa Đặc Có Đường Ông Thọ', amount: 30, unit: 'ml' },
    { materialId: 'RM-03', materialName: 'Sữa Tươi Thanh Trùng', amount: 80, unit: 'ml' }
  ],
  // Trà đào cam sả: 15g trà đen + 30ml siro đào + 2 miếng đào ngâm
  'P-04': [
    { materialId: 'RM-04', materialName: 'Trà Đen Ủ Lạnh', amount: 15, unit: 'g' },
    { materialId: 'RM-05', materialName: 'Siro Đào Cao Cấp', amount: 30, unit: 'ml' },
    { materialId: 'RM-06', materialName: 'Đào Miếng Ngâm', amount: 2, unit: 'miếng' }
  ],
  // Trà tắc mật ong: 15g trà đen + 20ml mật ong
  'P-05': [
    { materialId: 'RM-04', materialName: 'Trà Đen Ủ Lạnh', amount: 15, unit: 'g' }
  ],
  // Bánh mì chả cá Tuy Hòa: 1 ổ bánh mì + 80g chả cá chiên
  'P-09': [
    { materialId: 'RM-07', materialName: 'Bánh Mì Nóng Giòn', amount: 1, unit: 'ổ' },
    { materialId: 'RM-08', materialName: 'Chả Cá Thu Chiên', amount: 80, unit: 'g' }
  ]
};

function getFilePaths(filename) {
  return [
    path.join(__dirname, '../../data', filename),
    path.join(__dirname, '../../../data', filename)
  ];
}

function loadRawMaterials() {
  const [srcPath, rootPath] = getFilePaths('raw_materials.json');
  try {
    if (fs.existsSync(srcPath)) {
      return JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
    } else if (fs.existsSync(rootPath)) {
      return JSON.parse(fs.readFileSync(rootPath, 'utf-8'));
    }
  } catch (e) {
    console.error("Lỗi đọc raw_materials.json:", e);
  }
  return [];
}

function saveRawMaterials(materials) {
  const [srcPath, rootPath] = getFilePaths('raw_materials.json');
  try {
    if (fs.existsSync(path.dirname(srcPath))) {
      fs.writeFileSync(srcPath, JSON.stringify(materials, null, 2), 'utf-8');
    }
    if (fs.existsSync(path.dirname(rootPath))) {
      fs.writeFileSync(rootPath, JSON.stringify(materials, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("Lỗi ghi raw_materials.json:", e);
  }
}

function loadProducts() {
  const [srcPath, rootPath] = getFilePaths('pos_products.json');
  try {
    if (fs.existsSync(srcPath)) {
      return JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
    } else if (fs.existsSync(rootPath)) {
      return JSON.parse(fs.readFileSync(rootPath, 'utf-8'));
    }
  } catch (e) {
    console.error("Lỗi đọc pos_products.json:", e);
  }
  return [];
}

function saveProducts(products) {
  const [srcPath, rootPath] = getFilePaths('pos_products.json');
  try {
    if (fs.existsSync(path.dirname(srcPath))) {
      fs.writeFileSync(srcPath, JSON.stringify(products, null, 2), 'utf-8');
    }
    if (fs.existsSync(path.dirname(rootPath))) {
      fs.writeFileSync(rootPath, JSON.stringify(products, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error("Lỗi ghi pos_products.json:", e);
  }
}

/**
 * Kiểm tra tồn kho giỏ hàng trước khi bấm nút thanh toán (Pre-checkout Validation)
 * @param {Array} cartItems - Danh sách món trong giỏ hàng [{ id, name, qty/quantity }]
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array, deductions: Object }
 */
function validateCartInventory(cartItems = []) {
  const products = loadProducts();
  const rawMaterials = loadRawMaterials();

  const errors = [];
  const warnings = [];
  const retailDeductions = [];
  const rawMaterialNeeds = {};

  if (!cartItems || cartItems.length === 0) {
    return {
      valid: false,
      errors: ['Giỏ hàng đang trống, không thể thực hiện kiểm tra tồn kho.'],
      warnings: [],
      deductions: { retail: [], rawMaterials: [] }
    };
  }

  for (const item of cartItems) {
    const qty = Number(item.qty || item.quantity) || 1;
    const prod = products.find(p => p.id === item.id || p.name === item.name);

    if (!prod) {
      // Bỏ qua nếu là phòng hoặc dịch vụ tính giờ không theo kho vật lý
      if (item.id && (item.id.startsWith('R-') || item.id.startsWith('H-'))) {
        continue;
      }
      warnings.push(`Sản phẩm [${item.name}] chưa được quản lý tồn kho tự động.`);
      continue;
    }

    // 1. Phân loại 1: ĐẶC SẢN OCOP / SẢN PHẨM KHÁC (Bán lẻ đóng gói: Hộp, Gói, Chai, Kg)
    if (prod.category === 'souvenir' || prod.id.startsWith('O-') || prod.unit !== 'Ly') {
      const currentStock = Number(prod.stockQuantity) || 0;
      if (qty > currentStock) {
        errors.push(`Đặc sản/Sản phẩm [${prod.name}] không đủ tồn kho (Yêu cầu: ${qty} ${prod.unit || 'món'}, Hiện còn: ${currentStock} ${prod.unit || 'món'}).`);
      } else {
        retailDeductions.push({
          type: 'packaged_product',
          productId: prod.id,
          name: prod.name,
          quantity: qty,
          unit: prod.unit || 'Hộp',
          currentStock,
          remainingStock: currentStock - qty
        });

        if (currentStock - qty <= (prod.minStockLevel || 10)) {
          warnings.push(`Sản phẩm [${prod.name}] sắp chạm ngưỡng an toàn (Sau bán còn: ${currentStock - qty} ${prod.unit || 'món'}).`);
        }
      }
    }

    // 2. Phân loại 2: ĐỒ UỐNG PHA CHẾ & ĐỒ ĂN (Định mức tiêu hao nguyên vật liệu BOM: g / ml)
    const recipe = RECIPES[prod.id];
    if (recipe && recipe.length > 0) {
      for (const ingredient of recipe) {
        const matId = ingredient.materialId;
        const totalNeeded = ingredient.amount * qty;
        
        if (!rawMaterialNeeds[matId]) {
          rawMaterialNeeds[matId] = {
            materialId: matId,
            materialName: ingredient.materialName,
            neededAmount: 0,
            unit: ingredient.unit
          };
        }
        rawMaterialNeeds[matId].neededAmount += totalNeeded;
      }
    }
  }

  // 3. Kiểm tra tính khả dụng của từng nguyên vật liệu pha chế trong kho
  const rawMaterialDeductions = [];
  for (const matId of Object.keys(rawMaterialNeeds)) {
    const need = rawMaterialNeeds[matId];
    const mat = rawMaterials.find(m => m.id === matId);

    if (!mat) {
      warnings.push(`Nguyên liệu [${need.materialName}] chưa được khai báo kho định lượng.`);
      continue;
    }

    const currentStock = Number(mat.stock) || 0;
    if (need.neededAmount > currentStock) {
      errors.push(`Kho nguyên liệu [${mat.name}] không đủ để pha chế (Cần: ${need.neededAmount} ${mat.unit}, Trong kho chỉ còn: ${currentStock} ${mat.unit}).`);
    } else {
      rawMaterialDeductions.push({
        type: 'raw_material',
        materialId: mat.id,
        name: mat.name,
        neededAmount: need.neededAmount,
        unit: mat.unit,
        currentStock,
        remainingStock: currentStock - need.neededAmount
      });

      if (currentStock - need.neededAmount <= (mat.minStock || 1000)) {
        warnings.push(`Nguyên liệu pha chế [${mat.name}] sắp hết (Sau pha chế còn: ${currentStock - need.neededAmount} ${mat.unit}).`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    deductions: {
      retail: retailDeductions,
      rawMaterials: rawMaterialDeductions
    }
  };
}

/**
 * Thực hiện khấu trừ đồng bộ đa kho sau khi đơn hàng thanh toán thành công
 * @param {Object} order - Đơn hàng hoàn tất
 * @returns {Object} Chi tiết khấu trừ và trạng thái cập nhật
 */
function deductMultiInventory(order) {
  const validation = validateCartInventory(order.items);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' | '));
  }

  const products = loadProducts();
  const rawMaterials = loadRawMaterials();

  // Trừ tồn kho đặc sản / bán lẻ (Hộp / Gói / Chai)
  for (const retail of validation.deductions.retail) {
    const prod = products.find(p => p.id === retail.productId);
    if (prod) {
      prod.stockQuantity = retail.remainingStock;
    }
  }
  saveProducts(products);

  // Trừ tồn kho nguyên vật liệu pha chế (Gram / Ml)
  for (const raw of validation.deductions.rawMaterials) {
    const mat = rawMaterials.find(m => m.id === raw.materialId);
    if (mat) {
      mat.stock = raw.remainingStock;
    }
  }
  saveRawMaterials(rawMaterials);

  // Ghi nhật ký đồng bộ tồn kho đa tầng
  const syncLog = {
    orderId: order.id || order.orderCode,
    tableOrRoom: order.tableNumber || 'Quầy Mang Về',
    timestamp: new Date().toISOString(),
    retailDeducted: validation.deductions.retail,
    rawMaterialsDeducted: validation.deductions.rawMaterials
  };

  const [logSrcPath, logRootPath] = getFilePaths('inventory_sync_logs.json');
  let logs = [];
  try {
    if (fs.existsSync(logSrcPath)) logs = JSON.parse(fs.readFileSync(logSrcPath, 'utf-8'));
    else if (fs.existsSync(logRootPath)) logs = JSON.parse(fs.readFileSync(logRootPath, 'utf-8'));
  } catch (e) {}

  logs.unshift(syncLog);
  try {
    if (fs.existsSync(path.dirname(logSrcPath))) fs.writeFileSync(logSrcPath, JSON.stringify(logs, null, 2), 'utf-8');
    if (fs.existsSync(path.dirname(logRootPath))) fs.writeFileSync(logRootPath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {}

  return {
    success: true,
    message: 'Đã đồng bộ trừ tồn kho đa tầng (Ly/ml cho pha chế & Hộp/Kg cho đặc sản) thành công!',
    deductions: validation.deductions,
    syncLog
  };
}

module.exports = {
  RECIPES,
  loadRawMaterials,
  saveRawMaterials,
  loadProducts,
  saveProducts,
  validateCartInventory,
  deductMultiInventory
};
