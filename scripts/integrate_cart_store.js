const fs = require('fs');

// 1. Update posController.js
const controllerPath = 'E:/datphu-backend/src/modules/pos/posController.js';
let ctrlCode = fs.readFileSync(controllerPath, 'utf8');

// Insert require cartStore
if (!ctrlCode.includes("const cartStore = require('./cartStore');")) {
  ctrlCode = "const cartStore = require('./cartStore');\n" + ctrlCode;
}

// Add handleValidateCart & handleGetRawMaterials
const cartStoreHandlers = `
// ============================================================================
// HÀM TRIGGER & CONTROLLER XỬ LÝ ĐA KHO MULTI-INVENTORY SYNC
// ============================================================================
function handleValidateCart(req, res, body = {}) {
  const items = body.items || [];
  const validation = cartStore.validateCartInventory(items);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(validation));
}

function handleGetRawMaterials(req, res) {
  const materials = cartStore.loadRawMaterials();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, materials }));
}
`;

if (!ctrlCode.includes('function handleValidateCart')) {
  ctrlCode = ctrlCode.replace('module.exports = {', cartStoreHandlers + '\nmodule.exports = {\n  handleValidateCart,\n  handleGetRawMaterials,');
}

// Update handleCreateOrder to integrate cartStore multi-inventory validation and deduction
const oldCreateOrderValidationRegex = /if \(!items \|\| items\.length === 0\) \{[\s\S]*?return res\.end\(JSON\.stringify\(\{ error: 'Đơn hàng phải có ít nhất một sản phẩm\/dịch vụ' \}\)\);\s*\}/;

const newCreateOrderValidation = `if (!items || items.length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Đơn hàng phải có ít nhất một sản phẩm/dịch vụ' }));
  }

  // Trigger kiểm tra tồn kho đa tầng (BOM pha chế ml/g & Đặc sản hộp/kg) trước khi chốt đơn
  const inventoryValidation = cartStore.validateCartInventory(items);
  if (!inventoryValidation.valid) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'Tồn kho không đủ để thực hiện thanh toán đơn hàng!',
      details: inventoryValidation.errors,
      warnings: inventoryValidation.warnings
    }));
  }`;

if (oldCreateOrderValidationRegex.test(ctrlCode)) {
  ctrlCode = ctrlCode.replace(oldCreateOrderValidationRegex, newCreateOrderValidation);
}

// In handleCreateOrder, call cartStore.deductMultiInventory
const oldSaveOrdersSnippet = `  orders.unshift(newOrder);
  saveOrders(orders);`;

const newSaveOrdersSnippet = `  // Khấu trừ tồn kho đa tầng tự động (ml/g cho pha chế & Hộp/kg cho đặc sản)
  try {
    const deductResult = cartStore.deductMultiInventory(newOrder);
    newOrder.multiInventoryDeductions = deductResult.deductions;
  } catch (err) {
    console.error("Lỗi khấu trừ kho đa tầng:", err.message);
  }

  orders.unshift(newOrder);
  saveOrders(orders);`;

if (!ctrlCode.includes('cartStore.deductMultiInventory') && ctrlCode.includes(oldSaveOrdersSnippet)) {
  ctrlCode = ctrlCode.replace(oldSaveOrdersSnippet, newSaveOrdersSnippet);
}

fs.writeFileSync(controllerPath, ctrlCode, 'utf8');
console.log('Successfully updated posController.js with Multi-Inventory cartStore integration!');

// 2. Update posRoutes.js
const routesPath = 'E:/datphu-backend/src/modules/pos/posRoutes.js';
let routesCode = fs.readFileSync(routesPath, 'utf8');

const newRoutesSnippet = `
  // 9. Multi-Inventory Sync & Cart Validation
  if (pathname === '/api/pos/inventory/validate-cart' && req.method === 'POST') {
    posController.handleValidateCart(req, res, body);
    return true;
  }

  if (pathname === '/api/pos/inventory/raw-materials' && req.method === 'GET') {
    posController.handleGetRawMaterials(req, res);
    return true;
  }
`;

if (!routesCode.includes('/api/pos/inventory/validate-cart')) {
  routesCode = routesCode.replace('return false;\n}', newRoutesSnippet + '\n  return false;\n}');
  fs.writeFileSync(routesPath, routesCode, 'utf8');
  console.log('Successfully updated posRoutes.js with inventory routes!');
}
