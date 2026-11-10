/**
 * ============================================================================
 * ĐẤT PHÚ CORE (2026 - 2027) - MODULE VẬN HÀNH 6K KÍN KẼ OS THỜI GIAN THỰC
 * Đường dẫn: src/modules/core6k/core6kController.js
 * Chuẩn hóa 6 nhóm dữ liệu cốt lõi, SLA 15 phút, VietQR Napas247 & HĐĐT tự động
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const redisLayer = require('../../core/redisCacheLayer');

const STATE_FILE = path.join(__dirname, '..', '..', 'data', 'core6k_state.json');
const GEO_KEY_TUYHOA = 'datphu:workers:tuyhoa';

const K_STAGE_LABELS = {
  K1: 'K1 - Tiếp nhận tức thì & Thợ liên hệ xác nhận thời gian di chuyển',
  K2: 'K2 - Báo giá Minh bạch & Khóa vật tư xe thợ',
  K3: 'K3 - Thi công & Giám sát hiện trường',
  K4: 'K4 - Nghiệm thu kỹ thuật tại chỗ',
  K5: 'K5 - Thanh toán VietQR Napas247 & Xuất HĐĐT tự động',
  K6: 'K6 - Kích hoạt Bảo hành số & Lưu sổ cái'
};

function computeRecordHash(prevHash, payload) {
  return crypto
    .createHash('sha256')
    .update(`${prevHash || 'GENESIS_6K'}|${JSON.stringify(payload)}`)
    .digest('hex');
}

/**
 * Tạo chuỗi EMVCo VietQR Napas247 chuẩn Ngân hàng Nhà nước
 */
function buildVietQrPayload({ bankBin = '970422', accountNo = '0979991898', amount = 0, refCode = 'YC-2001' }) {
  const cleanRef = String(refCode).replace(/[^A-Za-z0-9-]/g, '');
  const addInfo = `DATPHU 6K ${cleanRef}`;
  const qrImageUrl = `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent('CONG TY CP CONG NGHE DAT PHU')}`;
  return {
    qrTraceId: `VQR-${cleanRef}-${Date.now().toString().slice(-5)}`,
    bankBin,
    bankName: 'MBBank (Napas247)',
    virtualAccountNo: `VA6K${cleanRef.replace('-', '')}`,
    accountNo,
    accountName: 'CONG TY CP CONG NGHE DAT PHU',
    amount: Math.round(amount),
    transferContent: addInfo,
    emvcoRaw: `00020101021238540010A00000072701240006${bankBin}0110${accountNo}0208QRIBFTTA530370454${String(Math.round(amount)).length.toString().padStart(2, '0')}${Math.round(amount)}5802VN62${String(addInfo.length + 4).padStart(2, '0')}08${String(addInfo.length).padStart(2, '0')}${addInfo}63046K99`,
    qrImageUrl
  };
}

function getInitialCoreState() {
  const genesisHash = computeRecordHash('GENESIS_6K', { init: 'DATPHU_CORE_2026' });
  return {
    // NHÓM 1: THỢ 6K TUY HÒA — HỒ SƠ NĂNG LỰC & BIỂU PHÍ CÁ NHÂN DO THỢ TỰ CÔNG BỐ (SÀN KHÔNG CAN THIỆP GIÁ)
    workers6k: [
      {
        id: 'THO-01',
        workerCode: 'THO-01',
        fullName: 'Nguyễn Văn Tùng (Chú Tùng 6K)',
        phone: '0912345678',
        primaryTrade: 'DIEN_NUOC',
        tradeLabel: 'Điện nước & Máy bơm tăng áp',
        operatingWard: 'Phường 7, TP. Tuy Hòa',
        status: 'AVAILABLE',
        ratingAvg: 4.95,
        completedJobsCount: 128,
        experienceYears: 15,
        portfolioBio: 'Thợ cả Điện nước dân dụng 15 năm tại Tuy Hòa, chuyên dò chập điện âm tường & sửa máy bơm.',
        selfPublishedInspectionFee: 0,
        selfPublishedInspectionNote: '0đ (Khảo sát miễn phí nội thành Tuy Hòa)',
        baseFee: 120000,
        selfPublishedRateCard: [
          { serviceName: 'Phí kiểm tra & khảo sát tại nhà', priceLabel: '0đ (Thợ tự công bố miễn phí)', minFee: 0 },
          { serviceName: 'Xử lý chập điện, nhảy CB, thay ổ cắm/vòi nước', priceLabel: '120.000đ – 180.000đ / lần', minFee: 120000 },
          { serviceName: 'Sửa chữa / lắp mới máy bơm tăng áp gia đình', priceLabel: '150.000đ – 250.000đ / máy', minFee: 150000 }
        ],
        pricingUpdatedAt: '2026-11-08T08:00:00.000Z',
        lat: 13.0882,
        lng: 109.3087,
        vehicleInventory: [
          { skuCode: 'VT-DN-01', itemName: 'Aptomat chống giật Panasonic 32A', qtyOnVehicle: 6, unit: 'cái', unitPrice: 185000 },
          { skuCode: 'VT-DN-02', itemName: 'Van giảm áp đồng phi 27 Bình Minh', qtyOnVehicle: 10, unit: 'cái', unitPrice: 95000 },
          { skuCode: 'VT-DN-03', itemName: 'Cuộn dây điện Cadivi 2.5mm', qtyOnVehicle: 4, unit: 'cuộn', unitPrice: 420000 }
        ]
      },
      {
        id: 'THO-06',
        workerCode: 'THO-06',
        fullName: 'Võ Minh Khoa (Khoa Điện Nước Trẻ)',
        phone: '0968112299',
        primaryTrade: 'DIEN_NUOC',
        tradeLabel: 'Điện nước dân sinh & Thiết bị vệ sinh',
        operatingWard: 'Phường 5, TP. Tuy Hòa',
        status: 'AVAILABLE',
        ratingAvg: 4.86,
        completedJobsCount: 52,
        experienceYears: 4,
        portfolioBio: 'Thợ trẻ nhiệt tình, giá mềm cạnh tranh cho hộ gia đình & phòng trọ sinh viên Tuy Hòa.',
        selfPublishedInspectionFee: 0,
        selfPublishedInspectionNote: '0đ (Kiểm tra miễn phí tận nơi)',
        baseFee: 80000,
        selfPublishedRateCard: [
          { serviceName: 'Phí kiểm tra & báo giá tại chỗ', priceLabel: '0đ (Miễn phí)', minFee: 0 },
          { serviceName: 'Sửa bóng đèn, công tắc, vòi xịt, phao bồn nước', priceLabel: '80.000đ – 120.000đ / lần', minFee: 80000 },
          { serviceName: 'Thông nghẹt đường ống thoát nước sinh hoạt', priceLabel: '100.000đ – 180.000đ / điểm', minFee: 100000 }
        ],
        pricingUpdatedAt: '2026-11-08T08:00:00.000Z',
        lat: 13.0908,
        lng: 109.3112,
        vehicleInventory: [
          { skuCode: 'VT-DN-01', itemName: 'Aptomat chống giật Panasonic 32A', qtyOnVehicle: 4, unit: 'cái', unitPrice: 180000 },
          { skuCode: 'VT-DN-02', itemName: 'Van giảm áp đồng phi 27 Bình Minh', qtyOnVehicle: 6, unit: 'cái', unitPrice: 90000 }
        ]
      },
      {
        id: 'THO-02',
        workerCode: 'THO-02',
        fullName: 'Trần Hoàng Nam (Nam Điện Lạnh)',
        phone: '0987654321',
        primaryTrade: 'DIEN_LANH',
        tradeLabel: 'Điện lạnh, Tủ mát & Máy lọc nước',
        operatingWard: 'Phường 5, TP. Tuy Hòa',
        status: 'AVAILABLE',
        ratingAvg: 5.0,
        completedJobsCount: 94,
        experienceYears: 9,
        portfolioBio: 'Chuyên gia máy lạnh Inverter & lọc nước RO, trang bị đồng hồ đo gas điện tử chuyên sâu.',
        selfPublishedInspectionFee: 100000,
        selfPublishedInspectionNote: '100.000đ (Miễn phí 0đ nếu khách đồng ý sửa)',
        baseFee: 120000,
        selfPublishedRateCard: [
          { serviceName: 'Phí kiểm tra bo mạch & đo áp suất gas (Không sửa)', priceLabel: '100.000đ (Miễn phí nếu sửa)', minFee: 100000 },
          { serviceName: 'Vệ sinh bảo dưỡng máy lạnh treo tường', priceLabel: '120.000đ – 150.000đ / bộ', minFee: 120000 },
          { serviceName: 'Kiểm tra & thay lõi máy lọc nước RO tại nhà', priceLabel: '80.000đ – 120.000đ / máy', minFee: 80000 }
        ],
        pricingUpdatedAt: '2026-11-08T08:00:00.000Z',
        lat: 13.0920,
        lng: 109.3120,
        vehicleInventory: [
          { skuCode: 'VT-DL-01', itemName: 'Gas lạnh R32 chính hãng (Nạp bổ sung)', qtyOnVehicle: 8, unit: 'lần', unitPrice: 180000 },
          { skuCode: 'VT-DL-02', itemName: 'Bộ 3 lõi lọc thô Karofi chuẩn', qtyOnVehicle: 5, unit: 'bộ', unitPrice: 220000 },
          { skuCode: 'VT-DL-03', itemName: 'Tụ đề máy lạnh 35uF', qtyOnVehicle: 12, unit: 'cái', unitPrice: 85000 }
        ]
      },
      {
        id: 'THO-03',
        workerCode: 'THO-03',
        fullName: 'Lê Văn Hùng (Hùng Mở Khóa 24/7)',
        phone: '0903112233',
        primaryTrade: 'MO_KHOA',
        tradeLabel: 'Mở khóa cứu hộ & Kích bình ắc quy',
        operatingWard: 'Phường 4, TP. Tuy Hòa',
        status: 'AVAILABLE',
        ratingAvg: 4.9,
        completedJobsCount: 215,
        experienceYears: 12,
        portfolioBio: 'Thợ khóa lưu động 24/7 & cứu hộ kích bình ắc quy xe máy, ô tô toàn TP. Tuy Hòa.',
        selfPublishedInspectionFee: 50000,
        selfPublishedInspectionNote: '50.000đ phí xăng xe (Trừ vào tiền công khi làm)',
        baseFee: 80000,
        selfPublishedRateCard: [
          { serviceName: 'Phí di chuyển khảo sát tận nơi', priceLabel: '50.000đ (Miễn phí khi làm)', minFee: 50000 },
          { serviceName: 'Mở khóa cửa phòng / khóa tay gạt / khóa xe máy', priceLabel: '80.000đ – 150.000đ / ổ', minFee: 80000 },
          { serviceName: 'Cứu hộ kích bình / thay ắc quy tận nơi', priceLabel: '100.000đ / lần', minFee: 100000 }
        ],
        pricingUpdatedAt: '2026-11-08T08:00:00.000Z',
        lat: 13.0845,
        lng: 109.3040,
        vehicleInventory: [
          { skuCode: 'VT-MK-01', itemName: 'Ruột khóa đồng Việt Tiệp chống dò', qtyOnVehicle: 7, unit: 'bộ', unitPrice: 165000 },
          { skuCode: 'VT-MK-02', itemName: 'Bình ắc quy xe máy Globe 12V-5Ah', qtyOnVehicle: 4, unit: 'bình', unitPrice: 340000 }
        ]
      },
      {
        id: 'THO-04',
        workerCode: 'THO-04',
        fullName: 'Phạm Quốc Bảo (Bảo Đèn NLMT)',
        phone: '0935667788',
        primaryTrade: 'DEN_NLMT',
        tradeLabel: 'Đèn Năng lượng mặt trời & Điện áp mái',
        operatingWard: 'Phường 9, TP. Tuy Hòa',
        status: 'AVAILABLE',
        ratingAvg: 4.92,
        completedJobsCount: 76,
        experienceYears: 7,
        portfolioBio: 'Kỹ thuật viên Đèn pha NLMT & hệ thống lưu trữ điện mặt trời chống bão miền Trung.',
        selfPublishedInspectionFee: 0,
        selfPublishedInspectionNote: '0đ (Khảo sát góc nắng miễn phí)',
        baseFee: 120000,
        selfPublishedRateCard: [
          { serviceName: 'Khảo sát hướng nắng & tư vấn tại nhà', priceLabel: '0đ (Miễn phí)', minFee: 0 },
          { serviceName: 'Công lắp đặt đèn pha NLMT / thay pin LiFePO4', priceLabel: '120.000đ – 200.000đ / bộ', minFee: 120000 }
        ],
        pricingUpdatedAt: '2026-11-08T08:00:00.000Z',
        lat: 13.1015,
        lng: 109.3025,
        vehicleInventory: [
          { skuCode: 'VT-NL-01', itemName: 'Bộ đèn pha NLMT Rạng Đông 200W IP67', qtyOnVehicle: 5, unit: 'bộ', unitPrice: 890000 },
          { skuCode: 'VT-NL-02', itemName: 'Pin lưu trữ LiFePO4 thay thế 3.2V', qtyOnVehicle: 6, unit: 'viên', unitPrice: 260000 }
        ]
      },
      {
        id: 'THO-05',
        workerCode: 'THO-05',
        fullName: 'Đặng Minh Tâm (Tâm Chống Thấm)',
        phone: '0944556677',
        primaryTrade: 'CHONG_THAM',
        tradeLabel: 'Chống thấm sân thượng & Sửa chữa xây dựng',
        operatingWard: 'Phường 2, TP. Tuy Hòa',
        status: 'AVAILABLE',
        ratingAvg: 4.88,
        completedJobsCount: 63,
        experienceYears: 14,
        portfolioBio: 'Đội trưởng thi công chống thấm Sika, xử lý nứt tường & gia cố mái tôn mùa mưa bão.',
        selfPublishedInspectionFee: 100000,
        selfPublishedInspectionNote: '100.000đ khảo sát độ ẩm (Miễn phí nếu thi công)',
        baseFee: 150000,
        selfPublishedRateCard: [
          { serviceName: 'Khảo sát vết thấm & lập phương án thi công', priceLabel: '100.000đ (Miễn phí nếu làm)', minFee: 100000 },
          { serviceName: 'Xử lý chống thấm khe tường / chống dột mái tôn', priceLabel: '150.000đ – 300.000đ / điểm', minFee: 150000 }
        ],
        pricingUpdatedAt: '2026-11-08T08:00:00.000Z',
        lat: 13.0812,
        lng: 109.2980,
        vehicleInventory: [
          { skuCode: 'VT-CT-01', itemName: 'Thùng keo chống thấm Sika Raintite 4kg', qtyOnVehicle: 6, unit: 'thùng', unitPrice: 540000 },
          { skuCode: 'VT-CT-02', itemName: 'Lưới thủy tinh gia cường chống nứt', qtyOnVehicle: 10, unit: 'm2', unitPrice: 25000 }
        ]
      }
    ],

    // NHÓM 2: QUẦY SỐ ĐỊA PHƯƠNG & DANH MỤC VẬT TƯ NIÊM YẾT
    digitalBooths: [
      {
        boothCode: 'QUAY-TH-01',
        boothName: 'Quầy Số Kim Khí & Điện Nước Hòa Bình (Chuẩn 6K)',
        taxCode: '4401020233-001',
        ownerName: 'Nguyễn Hòa Bình',
        phone: '02573822111',
        address: '142 Trần Hưng Đạo, Phường 4, TP. Tuy Hòa, Phú Yên',
        lat: 13.0850,
        lng: 109.3035,
        einvoiceProvider: 'VNPT_INVOICE',
        products: [
          { skuCode: 'VT-DN-01', productName: 'Aptomat chống giật Panasonic 32A chính hãng', unit: 'cái', listedPrice: 185000, vatRate: 8, stockQty: 48, warrantyMonths: 24 },
          { skuCode: 'VT-DN-02', productName: 'Van giảm áp đồng phi 27 Bình Minh', unit: 'cái', listedPrice: 95000, vatRate: 8, stockQty: 85, warrantyMonths: 12 },
          { skuCode: 'VT-DN-04', productName: 'Máy bơm tăng áp điện tử Panasonic 200W', unit: 'máy', listedPrice: 1650000, vatRate: 8, stockQty: 14, warrantyMonths: 24 }
        ]
      },
      {
        boothCode: 'QUAY-TH-02',
        boothName: 'Quầy Số Đèn Năng Lượng Mặt Trời & Thiết Bị Xanh Đất Phú',
        taxCode: '4401020233-002',
        ownerName: 'Trần Thị Mai',
        phone: '0977478899',
        address: '21/146 Ngô Gia Tự, Phường 7, TP. Tuy Hòa, Phú Yên',
        lat: 13.0898,
        lng: 109.3105,
        einvoiceProvider: 'VIETTEL_SINVOICE',
        products: [
          { skuCode: 'VT-NL-01', productName: 'Bộ đèn pha NLMT Rạng Đông 200W IP67', unit: 'bộ', listedPrice: 890000, vatRate: 8, stockQty: 32, warrantyMonths: 24 },
          { skuCode: 'VT-NL-03', productName: 'Đèn đường NLMT liền thể 300W chống bão biển', unit: 'bộ', listedPrice: 1250000, vatRate: 8, stockQty: 20, warrantyMonths: 36 }
        ]
      },
      {
        boothCode: 'QUAY-TH-03',
        boothName: 'Quầy Số Vật Liệu Chống Thấm & Sơn Sika Tuy Hòa',
        taxCode: '4401020233-003',
        ownerName: 'Lê Quốc Khánh',
        phone: '0914777888',
        address: '26 Nguyễn Huệ, Phường 5, TP. Tuy Hòa, Phú Yên',
        lat: 13.0910,
        lng: 109.3140,
        einvoiceProvider: 'MISA_MEINVOICE',
        products: [
          { skuCode: 'VT-CT-01', productName: 'Thùng keo chống thấm Sika Raintite 4kg', unit: 'thùng', listedPrice: 540000, vatRate: 8, stockQty: 40, warrantyMonths: 18 }
        ]
      }
    ],

    // NHÓM 3: PHIẾU ĐIỀU PHỐI CỨU HỘ 15 PHÚT (YC-xxxx) & NHẬT KÝ KIỂM TOÁN 6K
    dispatchTickets: [
      {
        ticketCode: 'YC-2001',
        urgencyLevel: 'SOS_15M',
        customerName: 'Chị Nguyễn Thị Lan',
        customerPhone: '0977478899',
        customerAddress: '86 Lê Duẩn, Phường 7, TP. Tuy Hòa',
        customerLat: 13.0892,
        customerLng: 109.3095,
        issueDescription: 'Chập aptomat tổng & rò nước van bồn tầng thượng',
        assignedWorkerId: 'THO-01',
        assignedWorkerName: 'Nguyễn Văn Tùng (Chú Tùng 6K)',
        assignedWorkerPhone: '0912345678',
        currentKStage: 'K5',
        slaDeadlineAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
        laborFee: 100000,
        partsFee: 185000,
        totalAmount: 285000,
        partsUsed: [
          { skuCode: 'VT-DN-01', itemName: 'Aptomat chống giật Panasonic 32A', qty: 1, unitPrice: 185000 }
        ],
        sourceChannel: 'PORTAL_20KB',
        vietqr: buildVietQrPayload({ amount: 285000, refCode: 'YC-2001' }),
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],

    k6AuditLogs: [
      {
        id: 'AUDIT-001',
        referenceCode: 'YC-2001',
        fromStage: null,
        toStage: 'K1',
        stageLabel: K_STAGE_LABELS.K1,
        actorRole: 'PORTAL_20KB',
        note: 'Khách phát lệnh cứu hộ 15 phút, Redis GEOSEARCH định vị THO-01 cách 0.45km',
        prevHash: 'GENESIS_6K',
        recordHash: genesisHash,
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString()
      }
    ],

    // NHÓM 4: ĐƠN HÀNG & LỊCH HẸN TRƯỚC SÀN DÂN SINH (DP-xxxx) & SỔ BẢO HÀNH SỐ K6
    ordersDp: [
      {
        orderCode: 'DP-1001',
        bookingType: 'SCHEDULED_BOOKING',
        bookingStatus: 'completed', // scheduled -> reminded_2h -> in_progress -> completed
        serviceTitle: 'Lắp đặt Đèn pha NLMT Rạng Đông 200W & Kiểm tra điện định kỳ',
        bookingDate: new Date().toISOString().slice(0, 10),
        bookingSlot: '08:30 - 10:00',
        reminder2hSent: true,
        reminderChannel: 'ZALO_OA_SMS',
        customerType: 'HOUSEHOLD', // HOUSEHOLD | B2B_CONTRACT
        paymentMethod: 'VIETQR',   // VIETQR | B2B_DEBT
        boothCode: 'QUAY-TH-02',
        boothName: 'Quầy Số Đèn Năng Lượng Mặt Trời & Thiết Bị Xanh Đất Phú',
        customerName: 'Anh Trần Văn Hải',
        customerPhone: '0913456789',
        shippingAddress: '195 Hùng Vương, Phường 7, TP. Tuy Hòa',
        currentKStage: 'K6',
        subtotalAmount: 890000,
        vatAmount: 71200,
        installationFee: 120000,
        grandTotal: 1081200,
        paymentStatus: 'PAID_VIETQR',
        assignedWorkerId: 'THO-04',
        assignedWorkerName: 'Phạm Quốc Bảo (Bảo Đèn NLMT)',
        assignedWorkerPhone: '0935667788',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ],

    digitalWarranties: [
      {
        warrantyCode: 'BH6K-2026-1001',
        referenceCode: 'DP-1001',
        workerId: 'THO-04',
        workerName: 'Phạm Quốc Bảo (Bảo Đèn NLMT)',
        customerPhone: '0913456789',
        serialOrScope: 'Bộ đèn pha NLMT Rạng Đông 200W IP67 + Thi công lắp đặt chống bão',
        activatedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        status: 'ACTIVE'
      }
    ],

    // NHÓM 5: SỔ CÁI TÀI CHÍNH BÚT TOÁN KÉP, VIETQR & HÓA ĐƠN ĐIỆN TỬ
    financialLedgerEntries: [
      {
        txGroupId: 'TXG-DP-1001',
        referenceCode: 'DP-1001',
        accountType: 'ESCROW_BANK_NAPAS',
        accountOwnerId: 'DATPHU_ESCROW',
        debitAmount: 1081200,
        creditAmount: 0,
        description: 'Thu hộ VietQR Napas247 đơn hàng DP-1001',
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        txGroupId: 'TXG-DP-1001',
        referenceCode: 'DP-1001',
        accountType: 'BOOTH_PAYABLE',
        accountOwnerId: 'QUAY-TH-02',
        debitAmount: 0,
        creditAmount: 854400,
        description: 'Trả tiền vật tư chính hãng cho Quầy số QUAY-TH-02',
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        txGroupId: 'TXG-DP-1001',
        referenceCode: 'DP-1001',
        accountType: 'WORKER_PAYABLE',
        accountOwnerId: 'THO-04',
        debitAmount: 0,
        creditAmount: 114000,
        description: 'Giải ngân thù lao lắp đặt cho Thợ 6K THO-04 (95% công)',
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        txGroupId: 'TXG-DP-1001',
        referenceCode: 'DP-1001',
        accountType: 'TAX_WITHHOLDING_RESERVE',
        accountOwnerId: 'CUC_THUE_PHU_YEN',
        debitAmount: 0,
        creditAmount: 71200,
        description: 'Khấu trừ & trích lập thuế GTGT/TNCN tự động theo HĐĐT',
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        txGroupId: 'TXG-DP-1001',
        referenceCode: 'DP-1001',
        accountType: 'PLATFORM_FEE_REVENUE',
        accountOwnerId: 'DATPHU_CORE',
        debitAmount: 0,
        creditAmount: 41600,
        description: 'Phí vận hành hạ tầng kiểm toán Đất Phú Core',
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
      }
    ],

    einvoices: [
      {
        referenceCode: 'DP-1001',
        sellerBoothCode: 'QUAY-TH-02',
        invoiceTemplateCode: '1C26MTT',
        invoiceNumber: '00001428',
        taxAuthorityCode: 'M1-26-PY-4401020233-00001428',
        totalBeforeVat: 1010000,
        totalVat: 71200,
        totalPayment: 1081200,
        xmlStoragePath: 'https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/invoices/HDDT_DP-1001.xml',
        status: 'TAX_ACCEPTED',
        issuedAt: new Date(Date.now() - 3600 * 1000).toISOString()
      }
    ],

    // NHÓM 6: TRẠM CHUNG TAY CỘNG ĐỒNG 6K (CT-01)
    communityCampaigns: [
      {
        campaignCode: 'CT-01',
        title: 'Chiến dịch CT-01: Chung tay sửa nhà bị cháy cho hộ nghèo Phường 6, Tuy Hòa',
        beneficiaryHousehold: 'Hộ bà Nguyễn Thị Tư (Neo đơn)',
        address: 'Hẻm Nguyễn Công Trứ, Phường 6, TP. Tuy Hòa, Phú Yên',
        status: 'ACTIVE',
        tasksAndPledges: [
          { targetCode: 'CA-01', itemType: 'LABOR_SHIFT', title: 'Đi lại toàn bộ đường điện an toàn & bảng điện tổng', requiredQty: 2, fulfilledQty: 1, contributors: ['THO-01 (Chú Tùng 6K)'] },
          { targetCode: 'CA-02', itemType: 'LABOR_SHIFT', title: 'Lợp lại mái tôn chống dột & chống thấm tường', requiredQty: 2, fulfilledQty: 1, contributors: ['THO-05 (Tâm Chống Thấm)'] },
          { targetCode: 'VT-01', itemType: 'MATERIAL_PLEDGE', title: 'Bộ dây nguồn Cadivi + Aptomat chống giật tổng', requiredQty: 2, fulfilledQty: 2, contributors: ['QUAY-TH-01 (Quầy Hòa Bình)'] },
          { targetCode: 'VT-02', itemType: 'MATERIAL_PLEDGE', title: 'Đèn pha NLMT chiếu sáng sân & trong nhà', requiredQty: 2, fulfilledQty: 1, contributors: ['QUAY-TH-02 (Thiết Bị Xanh Đất Phú)'] }
        ]
      }
    ]
  };
}

function loadState() {
  try {
    const initial = getInitialCoreState();
    if (!fs.existsSync(STATE_FILE)) {
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      syncWorkersToRedisGeo(initial.workers6k);
      return initial;
    }
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    // Đồng bộ bổ sung Hồ sơ năng lực & Biểu phí cá nhân tự công bố nếu state cũ chưa có
    const defaultWorkersMap = new Map(initial.workers6k.map(w => [w.workerCode, w]));
    state.workers6k = (state.workers6k || []).map(w => {
      const def = defaultWorkersMap.get(w.workerCode) || {};
      return {
        ...def,
        ...w,
        experienceYears: w.experienceYears ?? def.experienceYears ?? 5,
        portfolioBio: w.portfolioBio || def.portfolioBio || 'Thợ kỹ thuật 6K tự định giá trên nền tảng Đất Phú.',
        selfPublishedInspectionFee: w.selfPublishedInspectionFee ?? def.selfPublishedInspectionFee ?? 0,
        selfPublishedInspectionNote: w.selfPublishedInspectionNote || def.selfPublishedInspectionNote || '0đ (Thợ tự công bố)',
        selfPublishedRateCard: (w.selfPublishedRateCard && w.selfPublishedRateCard.length) ? w.selfPublishedRateCard : (def.selfPublishedRateCard || [])
      };
    });
    if (!state.workers6k.some(w => w.workerCode === 'THO-06')) {
      const tho06 = defaultWorkersMap.get('THO-06');
      if (tho06) state.workers6k.splice(1, 0, tho06);
    }
    syncWorkersToRedisGeo(state.workers6k || []);
    return state;
  } catch (e) {
    const fallback = getInitialCoreState();
    syncWorkersToRedisGeo(fallback.workers6k);
    return fallback;
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    syncWorkersToRedisGeo(state.workers6k || []);
  } catch (e) {
    console.error('Lỗi lưu core6k_state.json:', e.message);
  }
}

function syncWorkersToRedisGeo(workers) {
  workers.forEach(w => {
    redisLayer.geoadd(GEO_KEY_TUYHOA, w.lng, w.lat, w.workerCode, {
      workerCode: w.workerCode,
      fullName: w.fullName,
      phone: w.phone,
      primaryTrade: w.primaryTrade,
      tradeLabel: w.tradeLabel,
      status: w.status,
      ratingAvg: w.ratingAvg,
      baseFee: w.baseFee,
      vehicleInventory: w.vehicleInventory
    });
  });
}

function broadcastSSE(clients, event, data) {
  if (!clients) return;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => {
    try { c.write(msg); } catch (e) {}
  });
}

/**
 * 1. TỔNG QUAN HỆ SINH THÁI ĐẤT PHÚ CORE (GET /api/v1/core6k/overview)
 */
function handleGetOverview(req, res) {
  const state = loadState();
  const totalLedgerDebit = state.financialLedgerEntries.reduce((s, e) => s + (e.debitAmount || 0), 0);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    project: 'ĐẤT PHÚ CORE (2026 - 2027)',
    missionPillars: [
      'Giải phóng lao động (Đội thợ 6K Tuy Hòa tự chủ & giải ngân tức thời)',
      'Minh bạch thương mại (Niêm yết giá Quầy số & Kiểm toán K1 -> K6)',
      'An toàn pháp lý (Sổ cái bút toán kép, VietQR Napas247 & HĐĐT tự động)'
    ],
    architecture4Tiers: {
      tier1_client: ['Cổng Dân Sinh Tổng Thể (/cong_dan_sinh.html)', 'Cổng Cứu Hộ Siêu Tốc 20KB (/cuu_ho_20kb.html)'],
      tier2_application: 'Node.js 6K State Machine + VietQR & E-Invoice Engine',
      tier3_redis: redisLayer.getRedisStatus(),
      tier4_supabase: 'PostgreSQL 16 + PostGIS + RLS + Storage (6 Nhóm Bảng Cốt Lõi)'
    },
    metrics: {
      totalWorkers6k: state.workers6k.length,
      availableWorkers6k: state.workers6k.filter(w => w.status === 'AVAILABLE').length,
      totalDigitalBooths: state.digitalBooths.length,
      activeDispatchTickets: state.dispatchTickets.length,
      activeOrdersDp: state.ordersDp.length,
      totalEscrowVolumeVnd: totalLedgerDebit,
      einvoicesIssuedCount: state.einvoices.length,
      activeWarrantiesCount: state.digitalWarranties.length
    },
    state
  }));
}

/**
 * 2. TRA CỨU ĐỘI THỢ 6K TUY HÒA KÈM TỒN KHO XE & REDIS GEOSEARCH (GET /api/v1/core6k/workers)
 */
function handleListWorkers6k(req, res, parsedUrl) {
  const state = loadState();
  const trade = (parsedUrl.searchParams.get('trade') || '').trim().toUpperCase();
  const lat = Number(parsedUrl.searchParams.get('lat') || 13.0890);
  const lng = Number(parsedUrl.searchParams.get('lng') || 109.3090);
  const radiusKm = Number(parsedUrl.searchParams.get('radiusKm') || 10);

  const geoMatches = redisLayer.geosearch(GEO_KEY_TUYHOA, lng, lat, radiusKm);
  const distanceMap = new Map(geoMatches.map(g => [g.memberId, g]));

  let workers = state.workers6k.map(w => {
    const geo = distanceMap.get(w.workerCode);
    const distanceKm = geo ? geo.distanceKm : Number(redisLayer.haversineKm(lat, lng, w.lat, w.lng).toFixed(2));
    const etaMinutes = Math.max(5, Math.min(15, Math.round(distanceKm * 4 + 4)));
    return {
      ...w,
      distanceKm,
      etaMinutes
    };
  });

  if (trade) {
    workers = workers.filter(w =>
      w.primaryTrade.includes(trade) ||
      w.tradeLabel.toUpperCase().includes(trade)
    );
  }

  workers.sort((a, b) => a.distanceKm - b.distanceKm);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    center: { lat, lng, radiusKm },
    count: workers.length,
    workers
  }));
}

/**
 * 2B. YÊU CẦU MÃ OTP 4 SỐ QUA ZALO ZNS & CHỐNG SPAM IP (POST /api/v1/sos/request-otp)
 * Bước 1 & 2 trong luồng Kín Kẽ OS: Kiểm tra Rate Limit IP -> Sinh OTP 4 số (TTL 180s) -> Bắn Zalo ZNS
 */
function handleRequestZaloOtp(req, res, body) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const { customerPhone = '0979991898' } = body;
  const cleanPhone = String(customerPhone).replace(/[^0-9]/g, '');

  if (cleanPhone.length < 9 || cleanPhone.length > 12) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: false,
      error: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng số điện thoại đang dùng Zalo/SMS.'
    }));
  }

  // Kiểm tra Rate Limit theo IP & Số điện thoại để chặn đứng đối thủ/kẻ gian spam
  const ipCheck = redisLayer.checkIpRateLimit(`ip:${clientIp}`, 8, 180);
  if (!ipCheck.allowed) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: false,
      error: `Hệ thống Kín Kẽ OS tạm khóa yêu cầu từ thiết bị này trong ${ipCheck.retryAfterSec} giây để chống spam/quấy rối.`
    }));
  }

  const otpPayload = redisLayer.createZaloOtp(cleanPhone, clientIp);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    channel: 'ZALO_ZNS_OA_DATPHU',
    maskedPhone: otpPayload.maskedPhone,
    ttlSeconds: otpPayload.ttlSeconds,
    resendCooldownSeconds: otpPayload.resendCooldownSeconds,
    znsTemplateMessage: otpPayload.znsMessage,
    demoOtpCode: otpPayload.otpCode
  }));
}

/**
 * 3. LỆNH CỨU HỘ / GỌI THỢ ĐÃ XÁC THỰC ZALO OTP & ẨN DANH TÍNH (POST /api/v1/sos/dispatch)
 * Áp dụng xác thực One-Time OTP trên Redis, Masked Phone & công thức chấm điểm S_dispatch
 */
function handleSosDispatch15m(req, res, body, sseClients) {
  const state = loadState();
  const {
    customerName = 'Hộ Dân Sinh Tuy Hòa',
    customerPhone = '0979991898',
    customerAddress = 'Phường 7, TP. Tuy Hòa, Phú Yên',
    customerLat = 13.0890,
    customerLng = 109.3090,
    tradeCategory = 'DIEN_NUOC',
    issueDescription = 'Sự cố khẩn cấp cần cứu hộ trong 15 phút',
    preferredWorkerId = null,
    otpCode = null,
    requireOtp = false
  } = body;

  // Nếu gửi từ Cổng Khách hàng có bật xác thực OTP Zalo ZNS: bắt buộc đối chiếu & xóa OTP 1 lần trên Redis
  let otpVerification = { valid: true, verifiedAt: new Date().toISOString(), verificationToken: 'INTERNAL_BYPASS' };
  if (requireOtp || otpCode !== null) {
    otpVerification = redisLayer.verifyAndConsumeZaloOtp(customerPhone, otpCode);
    if (!otpVerification.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        error: otpVerification.reason || 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.'
      }));
    }
  }

  // Chấm điểm S_dispatch cho từng thợ 6K:
  // S_dispatch = 0.55 * (1 - d/5) + 0.30 * I_inventory + 0.15 * (rating/5)
  const scoredWorkers = state.workers6k.map(w => {
    const distKm = redisLayer.haversineKm(Number(customerLat), Number(customerLng), w.lat, w.lng);
    const distScore = Math.max(0, 1 - distKm / 5.0);
    const tradeMatch = (w.primaryTrade === tradeCategory || w.workerCode === preferredWorkerId) ? 1 : 0.35;
    const hasStock = (w.vehicleInventory && w.vehicleInventory.length > 0) ? 1 : 0;
    const ratingScore = (w.ratingAvg || 4.8) / 5.0;
    const dispatchScore = Number(((0.55 * distScore * tradeMatch) + (0.30 * hasStock) + (0.15 * ratingScore)).toFixed(4));
    return {
      worker: w,
      distKm: Number(distKm.toFixed(2)),
      etaMinutes: Math.max(5, Math.min(15, Math.round(distKm * 4 + 4))),
      dispatchScore
    };
  });

  scoredWorkers.sort((a, b) => {
    if (preferredWorkerId && a.worker.workerCode === preferredWorkerId) return -1;
    if (preferredWorkerId && b.worker.workerCode === preferredWorkerId) return 1;
    return b.dispatchScore - a.dispatchScore;
  });

  const bestMatch = scoredWorkers[0];
  const chosenWorker = bestMatch.worker;
  const lockToken = redisLayer.acquireLock(`lock:worker:${chosenWorker.workerCode}`, 5000);

  const ticketCode = `YC-${Math.floor(2002 + Math.random() * 7990)}`;
  const suggestedPart = (chosenWorker.vehicleInventory && chosenWorker.vehicleInventory[0]) || {
    skuCode: 'VT-6K-01',
    itemName: 'Vật tư tiêu chuẩn trên xe thợ',
    unitPrice: 95000
  };
  const laborFee = chosenWorker.baseFee || 100000;
  const partsFee = suggestedPart.unitPrice || 0;
  const totalAmount = laborFee + partsFee;

  const slaInfo = redisLayer.registerSla15mTicket(ticketCode, (expiredTicket) => {
    broadcastSSE(sseClients, 'SLA_ESCALATION_90S', {
      ticketCode: expiredTicket,
      message: `Cảnh báo SLA 90s: Tự động phát sóng phiếu ${expiredTicket} tới Top 3 Thợ 6K gần nhất!`
    });
  });

  if (lockToken) {
    redisLayer.releaseLock(`lock:worker:${chosenWorker.workerCode}`, lockToken);
  }

  const newTicket = {
    ticketCode,
    urgencyLevel: body.urgencyLevel || 'URGENT_20_45M',
    preferredTimeSlot: body.preferredTimeSlot || 'Khẩn cấp (20 - 45 phút)',
    customerName,
    customerPhone,
    maskedCustomerPhone: redisLayer.maskPhone(customerPhone),
    phoneVerified: true,
    otpVerificationToken: otpVerification.verificationToken,
    customerAddress,
    customerLat: Number(customerLat),
    customerLng: Number(customerLng),
    issueDescription,
    assignedWorkerId: chosenWorker.workerCode,
    assignedWorkerName: chosenWorker.fullName,
    assignedWorkerPhone: chosenWorker.phone,
    maskedWorkerPhone: redisLayer.maskPhone(chosenWorker.phone),
    virtualSwitchboardExt: `1900-6K-${ticketCode.replace('YC-', '')}`,
    distanceKm: bestMatch.distKm,
    etaMinutes: bestMatch.etaMinutes,
    dispatchScore: bestMatch.dispatchScore,
    currentKStage: 'K1',
    slaDeadlineAt: slaInfo.deadlineAt,
    laborFee,
    partsFee,
    totalAmount,
    partsUsed: [
      { skuCode: suggestedPart.skuCode, itemName: suggestedPart.itemName, qty: 1, unitPrice: partsFee }
    ],
    sourceChannel: body.sourceChannel || 'PORTAL_20KB',
    vietqr: buildVietQrPayload({ amount: totalAmount, refCode: ticketCode }),
    createdAt: slaInfo.createdAt,
    updatedAt: slaInfo.createdAt
  };

  const prevLog = state.k6AuditLogs[0];
  const prevHash = prevLog ? prevLog.recordHash : 'GENESIS_6K';
  const auditPayload = { ticketCode, toStage: 'K1', worker: chosenWorker.workerCode, ts: slaInfo.createdAt };
  const auditEntry = {
    id: `AUDIT-${Date.now().toString().slice(-6)}`,
    referenceCode: ticketCode,
    fromStage: null,
    toStage: 'K1',
    stageLabel: K_STAGE_LABELS.K1,
    actorRole: newTicket.sourceChannel,
    note: `Tiếp nhận cứu hộ linh hoạt [${newTicket.preferredTimeSlot}] — Điều phối ${chosenWorker.fullName} (${chosenWorker.workerCode}), cách ${bestMatch.distKm}km`,
    prevHash,
    recordHash: computeRecordHash(prevHash, auditPayload),
    createdAt: slaInfo.createdAt
  };

  state.dispatchTickets.unshift(newTicket);
  state.k6AuditLogs.unshift(auditEntry);
  saveState(state);

  const customerExpectationMessage = 'Hệ thống đã chuyển yêu cầu của anh/chị tới thợ gần nhất. Thợ sẽ liên hệ trực tiếp để báo thời gian có mặt chính xác tại hiện trường.';

  broadcastSSE(sseClients, 'SOS_15M_DISPATCHED', {
    ticket: newTicket,
    customerExpectationMessage,
    audit: auditEntry
  });

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    slaCommitment: 'TIẾP NHẬN TỨC THÌ — THỢ LIÊN HỆ XÁC NHẬN THỜI GIAN DI CHUYỂN (15-30 PHÚT)',
    customerExpectationMessage,
    ticket: newTicket,
    audit: auditEntry
  }));
}

/**
 * 4. CHUYỂN GIAI ĐOẠN KIỂM TOÁN 6K KÍN KẼ OS (POST /api/v1/core6k/stage)
 */
function handleUpdateK6Stage(req, res, body, sseClients) {
  const state = loadState();
  const { referenceCode, kStage, note } = body;
  const cleanStage = String(kStage || '').toUpperCase();

  if (!['K1', 'K2', 'K3', 'K4', 'K5', 'K6'].includes(cleanStage)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Giai đoạn phải thuộc K1, K2, K3, K4, K5, K6' }));
  }

  let targetRecord = state.dispatchTickets.find(t => t.ticketCode === referenceCode);
  let recordType = 'DISPATCH_TICKET';
  if (!targetRecord) {
    targetRecord = state.ordersDp.find(o => o.orderCode === referenceCode);
    recordType = 'ORDER_DP';
  }

  if (!targetRecord) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Không tìm thấy mã đơn/phiếu ${referenceCode}` }));
  }

  const fromStage = targetRecord.currentKStage;
  targetRecord.currentKStage = cleanStage;
  targetRecord.updatedAt = new Date().toISOString();

  if (cleanStage === 'K2') {
    redisLayer.acknowledgeSlaTicket(referenceCode);
  }

  const prevLog = state.k6AuditLogs[0];
  const prevHash = prevLog ? prevLog.recordHash : 'GENESIS_6K';
  const nowIso = new Date().toISOString();
  const auditEntry = {
    id: `AUDIT-${Date.now().toString().slice(-6)}`,
    referenceCode,
    fromStage,
    toStage: cleanStage,
    stageLabel: K_STAGE_LABELS[cleanStage],
    actorRole: body.actorRole || 'WORKER_6K',
    note: note || `Chuyển giai đoạn kiểm toán ${fromStage} ➔ ${cleanStage} (${K_STAGE_LABELS[cleanStage]})`,
    prevHash,
    recordHash: computeRecordHash(prevHash, { referenceCode, fromStage, toStage: cleanStage, nowIso }),
    createdAt: nowIso
  };

  state.k6AuditLogs.unshift(auditEntry);
  saveState(state);

  broadcastSSE(sseClients, 'K6_STAGE_UPDATED', {
    referenceCode,
    recordType,
    currentKStage: cleanStage,
    stageLabel: K_STAGE_LABELS[cleanStage],
    audit: auditEntry
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    referenceCode,
    fromStage,
    currentKStage: cleanStage,
    stageLabel: K_STAGE_LABELS[cleanStage],
    record: targetRecord,
    audit: auditEntry
  }));
}

/**
 * 5. WEBHOOK THANH TOÁN VIETQR NAPAS247 -> SỔ CÁI BÚT TOÁN KÉP -> HĐĐT -> BẢO HÀNH SỐ K6
 * (POST /api/v1/core6k/vietqr-webhook)
 */
function handleVietQrNapasWebhook(req, res, body, sseClients) {
  const state = loadState();
  const {
    referenceCode = 'YC-2001',
    napasFtCode = `FT26${Date.now().toString().slice(-8)}`,
    paidAmount
  } = body;

  // Kiểm tra Idempotency trên Redis để không hạch toán 2 lần cùng 1 mã FT
  const isFirstTime = redisLayer.setnx(`idemp:napas:${napasFtCode}`, referenceCode, 86400);
  if (!isFirstTime) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      idempotentReplay: true,
      message: `Giao dịch ${napasFtCode} đã được đối soát trước đó.`
    }));
  }

  let ticket = state.dispatchTickets.find(t => t.ticketCode === referenceCode);
  let order = state.ordersDp.find(o => o.orderCode === referenceCode);
  const target = ticket || order;

  if (!target) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Không tìm thấy mã tham chiếu ${referenceCode}` }));
  }

  const totalAmount = Number(paidAmount || target.totalAmount || target.grandTotal || 285000);
  const laborFee = Number(target.laborFee || target.installationFee || 100000);
  const partsGross = Math.max(0, totalAmount - laborFee);
  const vatAmount = Math.round(totalAmount * 0.08 / 1.08);
  const platformFee = Math.round(totalAmount * 0.04);
  const workerPayable = Math.round(laborFee * 0.95);
  const boothPayable = totalAmount - vatAmount - platformFee - workerPayable;

  const nowIso = new Date().toISOString();
  const txGroupId = `TXG-${referenceCode}-${Date.now().toString().slice(-4)}`;

  // Ghi 5 bút toán kép (Double-Entry Bookkeeping: Tổng Nợ === Tổng Có)
  const newLedgerEntries = [
    {
      txGroupId,
      referenceCode,
      accountType: 'ESCROW_BANK_NAPAS',
      accountOwnerId: 'DATPHU_ESCROW',
      debitAmount: totalAmount,
      creditAmount: 0,
      description: `Napas247 [${napasFtCode}] thu hộ đơn ${referenceCode}`,
      createdAt: nowIso
    },
    {
      txGroupId,
      referenceCode,
      accountType: 'WORKER_PAYABLE',
      accountOwnerId: target.assignedWorkerId || 'THO-01',
      debitAmount: 0,
      creditAmount: workerPayable,
      description: `Giải ngân thù lao kỹ thuật cho Thợ 6K (${target.assignedWorkerId || 'THO-01'})`,
      createdAt: nowIso
    },
    {
      txGroupId,
      referenceCode,
      accountType: 'BOOTH_PAYABLE',
      accountOwnerId: target.boothCode || 'QUAY-TH-01',
      debitAmount: 0,
      creditAmount: boothPayable,
      description: `Thanh toán tiền vật tư chính hãng cho Quầy số (${target.boothCode || 'QUAY-TH-01'})`,
      createdAt: nowIso
    },
    {
      txGroupId,
      referenceCode,
      accountType: 'TAX_WITHHOLDING_RESERVE',
      accountOwnerId: 'CUC_THUE_PHU_YEN',
      debitAmount: 0,
      creditAmount: vatAmount,
      description: `Khấu trừ thuế GTGT/TNCN tự động cho giao dịch ${referenceCode}`,
      createdAt: nowIso
    },
    {
      txGroupId,
      referenceCode,
      accountType: 'PLATFORM_FEE_REVENUE',
      accountOwnerId: 'DATPHU_CORE',
      debitAmount: 0,
      creditAmount: platformFee,
      description: `Phí vận hành hạ tầng kiểm toán Đất Phú Core`,
      createdAt: nowIso
    }
  ];

  // Phát hành Hóa đơn điện tử khởi tạo từ máy tính tiền tự động
  const invoiceSeq = String(1429 + state.einvoices.length).padStart(8, '0');
  const newEInvoice = {
    referenceCode,
    sellerBoothCode: target.boothCode || 'QUAY-TH-01',
    invoiceTemplateCode: '1C26MTT',
    invoiceNumber: invoiceSeq,
    taxAuthorityCode: `M1-26-PY-4401020233-${invoiceSeq}`,
    totalBeforeVat: totalAmount - vatAmount,
    totalVat: vatAmount,
    totalPayment: totalAmount,
    xmlStoragePath: `https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/invoices/HDDT_${referenceCode}.xml`,
    status: 'TAX_ACCEPTED',
    issuedAt: nowIso
  };

  // Kích hoạt Sổ Bảo hành Số K6
  const newWarranty = {
    warrantyCode: `BH6K-2026-${referenceCode.replace('-', '')}`,
    referenceCode,
    workerId: target.assignedWorkerId || 'THO-01',
    workerName: target.assignedWorkerName || 'Nguyễn Văn Tùng (Chú Tùng 6K)',
    customerPhone: target.customerPhone || '0979991898',
    serialOrScope: target.issueDescription || 'Vật tư & Lắp đặt chuẩn 6K Đất Phú',
    activatedAt: nowIso,
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  };

  target.currentKStage = 'K6';
  target.paymentStatus = 'PAID_VIETQR';
  target.updatedAt = nowIso;

  const prevLog = state.k6AuditLogs[0];
  const prevHash = prevLog ? prevLog.recordHash : 'GENESIS_6K';
  const auditEntry = {
    id: `AUDIT-${Date.now().toString().slice(-6)}`,
    referenceCode,
    fromStage: 'K5',
    toStage: 'K6',
    stageLabel: K_STAGE_LABELS.K6,
    actorRole: 'VIETQR_NAPAS247_WEBHOOK',
    note: `Đối soát thành công ${totalAmount.toLocaleString('vi-VN')}đ [FT: ${napasFtCode}], phát hành HĐĐT #${invoiceSeq} & Bảo hành số ${newWarranty.warrantyCode}`,
    prevHash,
    recordHash: computeRecordHash(prevHash, { referenceCode, napasFtCode, totalAmount, invoiceSeq }),
    createdAt: nowIso
  };

  state.financialLedgerEntries.unshift(...newLedgerEntries);
  state.einvoices.unshift(newEInvoice);
  state.digitalWarranties.unshift(newWarranty);
  state.k6AuditLogs.unshift(auditEntry);
  saveState(state);

  broadcastSSE(sseClients, 'VIETQR_K6_COMPLETED', {
    referenceCode,
    napasFtCode,
    totalAmount,
    einvoice: newEInvoice,
    warranty: newWarranty,
    ledgerEntries: newLedgerEntries
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Đã đối soát VietQR Napas247, ghi Sổ cái bút toán kép, xuất HĐĐT và kích hoạt Bảo hành số K6!',
    referenceCode,
    napasFtCode,
    ledgerBalanced: {
      totalDebit: totalAmount,
      totalCredit: workerPayable + boothPayable + vatAmount + platformFee
    },
    ledgerEntries: newLedgerEntries,
    einvoice: newEInvoice,
    warranty: newWarranty,
    audit: auditEntry
  }));
}

/**
 * 6. ĐIỀU PHỐI TRẠM CHUNG TAY CỘNG ĐỒNG 6K (POST /api/v1/community/relief)
 */
function handleCommunityReliefAction(req, res, body, sseClients) {
  const state = loadState();
  const {
    campaignCode = 'CT-01',
    targetCode = 'CA-01',
    contributorName = 'Thợ 6K / Đại lý Tuy Hòa',
    qty = 1
  } = body;

  const campaign = state.communityCampaigns.find(c => c.campaignCode === campaignCode) || state.communityCampaigns[0];
  const item = campaign.tasksAndPledges.find(t => t.targetCode === targetCode);

  if (!item) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Không tìm thấy hạng mục ${targetCode} trong chiến dịch ${campaignCode}` }));
  }

  item.fulfilledQty = Number(item.fulfilledQty || 0) + Number(qty || 1);
  if (!item.contributors.includes(contributorName)) {
    item.contributors.push(contributorName);
  }

  saveState(state);

  broadcastSSE(sseClients, 'COMMUNITY_RELIEF_UPDATED', {
    campaignCode: campaign.campaignCode,
    item
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Cảm ơn ${contributorName} đã chung tay vào hạng mục ${targetCode} (${item.title})!`,
    campaign
  }));
}

/**
 * 7. QUY TRÌNH ĐẶT LỊCH HẸN TRƯỚC (BOOKING FLOW K1 -> K2: KHỞI TẠO & GIỮ CHỖ THỢ 6K)
 * (POST /api/v1/booking/create)
 */
function handleCreateScheduledBooking(req, res, body, sseClients) {
  const state = loadState();
  const {
    customerName = 'Chủ Hộ Gia Đình Tuy Hòa',
    customerPhone = '0979991898',
    shippingAddress = 'Phường 7, TP. Tuy Hòa, Phú Yên',
    serviceCategory = 'DIEN_LANH',
    serviceTitle = 'Bảo dưỡng máy lạnh & Kiểm tra định kỳ',
    bookingDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    bookingSlot = '08:30 - 10:00',
    customerType = 'HOUSEHOLD', // HOUSEHOLD | B2B_CONTRACT
    paymentMethod = 'VIETQR',   // VIETQR | B2B_DEBT
    estimatedLaborFee = 120000,
    estimatedPartsFee = 0
  } = body;

  // Kiểm tra lịch làm việc của các Thợ 6K trong khu vực để không bị trùng khung giờ (bookingDate + bookingSlot)
  const busyWorkerIds = new Set(
    (state.ordersDp || [])
      .filter(o => o.bookingDate === bookingDate && o.bookingSlot === bookingSlot && o.bookingStatus !== 'completed')
      .map(o => o.assignedWorkerId)
  );

  const candidates = state.workers6k.filter(w => w.primaryTrade === serviceCategory && !busyWorkerIds.has(w.workerCode));
  const chosenWorker = candidates[0] || state.workers6k.find(w => w.primaryTrade === serviceCategory) || state.workers6k[0];

  const orderCode = `DP-${Math.floor(1002 + Math.random() * 8990)}`;
  const subtotalAmount = Number(estimatedPartsFee || 0);
  const installationFee = Number(estimatedLaborFee || chosenWorker.baseFee || 120000);
  const vatAmount = Math.round((subtotalAmount + installationFee) * 0.08);
  const grandTotal = subtotalAmount + installationFee + vatAmount;
  const nowIso = new Date().toISOString();

  const newBookingOrder = {
    orderCode,
    bookingType: 'SCHEDULED_BOOKING',
    bookingStatus: 'scheduled', // Trạng thái chuẩn trên bảng orders Supabase
    serviceCategory,
    serviceTitle,
    bookingDate,
    bookingSlot,
    reminder2hSent: false,
    reminderChannel: 'ZALO_OA_SMS',
    reminderMessage: `[Zalo OA Đất Phú] Nhắc lịch trước 2 tiếng: Lịch hẹn "${serviceTitle}" của anh/chị vào khung giờ ${bookingSlot} ngày ${bookingDate} với Thợ ${chosenWorker.fullName} (${chosenWorker.phone}) đã sẵn sàng.`,
    customerType,
    paymentMethod: customerType === 'B2B_CONTRACT' ? 'B2B_DEBT' : paymentMethod,
    boothCode: 'QUAY-TH-01',
    boothName: 'Quầy Số Kim Khí & Điện Nước Hòa Bình (Chuẩn 6K)',
    customerName,
    customerPhone,
    shippingAddress,
    currentKStage: 'K2', // Đã qua K1 (Chọn lịch) -> K2 (Hệ thống kiểm tra & Giữ chỗ Thợ 6K)
    subtotalAmount,
    vatAmount,
    installationFee,
    grandTotal,
    paymentStatus: 'UNPAID',
    assignedWorkerId: chosenWorker.workerCode,
    assignedWorkerName: chosenWorker.fullName,
    assignedWorkerPhone: chosenWorker.phone,
    vietqr: buildVietQrPayload({ amount: grandTotal, refCode: orderCode }),
    createdAt: nowIso
  };

  const prevLog = state.k6AuditLogs[0];
  const prevHash = prevLog ? prevLog.recordHash : 'GENESIS_6K';
  const auditEntry = {
    id: `AUDIT-${Date.now().toString().slice(-6)}`,
    referenceCode: orderCode,
    fromStage: 'K1',
    toStage: 'K2',
    stageLabel: 'K2 - Hệ thống điều phối & Giữ chỗ Thợ 6K (status = scheduled)',
    actorRole: 'BOOKING_ENGINE',
    note: `Giữ chỗ thành công Thợ ${chosenWorker.fullName} (${chosenWorker.workerCode}) cho khung giờ ${bookingSlot} ngày ${bookingDate}. Đã gửi xác nhận Zalo/SMS cho Khách & Thợ.`,
    prevHash,
    recordHash: computeRecordHash(prevHash, { orderCode, bookingDate, bookingSlot, worker: chosenWorker.workerCode }),
    createdAt: nowIso
  };

  state.ordersDp.unshift(newBookingOrder);
  state.k6AuditLogs.unshift(auditEntry);
  saveState(state);

  broadcastSSE(sseClients, 'BOOKING_SCHEDULED', {
    booking: newBookingOrder,
    audit: auditEntry
  });

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã giữ chỗ Thợ ${chosenWorker.fullName} vào khung giờ ${bookingSlot} (${bookingDate}) và gửi xác nhận qua Zalo/SMS!`,
    booking: newBookingOrder,
    notifications: {
      customerZalo: `Xác nhận lịch hẹn #${orderCode}: ${serviceTitle} lúc ${bookingSlot} ngày ${bookingDate}. Thợ phụ trách: ${chosenWorker.fullName} (${chosenWorker.phone}).`,
      workerZalo: `Lịch hẹn mới #${orderCode} lúc ${bookingSlot} ngày ${bookingDate} tại ${shippingAddress} (${customerName} - ${customerPhone}).`,
      autoReminderRule: 'Hệ thống sẽ tự động gửi tin nhắn Zalo OA / SMS nhắc lịch trước giờ hẹn 2 tiếng.'
    }
  }));
}

/**
 * 8. KÍCH HOẠT NHẮC LỊCH TỰ ĐỘNG TRƯỚC 2 TIẾNG QUA ZALO OA / SMS
 * (POST /api/v1/booking/remind)
 */
function handleSendBookingReminder2h(req, res, body, sseClients) {
  const state = loadState();
  const { orderCode } = body;
  const booking = state.ordersDp.find(o => o.orderCode === orderCode);

  if (!booking) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Không tìm thấy lịch hẹn ${orderCode}` }));
  }

  booking.reminder2hSent = true;
  booking.bookingStatus = 'reminded_2h';
  booking.remindedAt = new Date().toISOString();
  saveState(state);

  broadcastSSE(sseClients, 'BOOKING_REMINDER_2H', {
    orderCode: booking.orderCode,
    reminderMessage: booking.reminderMessage
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    orderCode: booking.orderCode,
    bookingStatus: booking.bookingStatus,
    reminderMessage: booking.reminderMessage
  }));
}

/**
 * 9. NGHIỆM THU ĐÚNG HẸN (K3 & K4) -> THANH TOÁN VIETQR HOẶC CÔNG NỢ B2B -> SỔ CÁI & HĐĐT (K5 & K6)
 * (POST /api/v1/booking/complete)
 */
function handleCompleteBookingFlow(req, res, body, sseClients) {
  const state = loadState();
  const { orderCode, paymentMode } = body;
  const booking = state.ordersDp.find(o => o.orderCode === orderCode);

  if (!booking) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Không tìm thấy lịch hẹn ${orderCode}` }));
  }

  const finalPaymentMode = paymentMode || booking.paymentMethod || 'VIETQR';
  const totalAmount = Number(booking.grandTotal || 129600);
  const laborFee = Number(booking.installationFee || 120000);
  const vatAmount = Number(booking.vatAmount || Math.round(totalAmount * 0.08 / 1.08));
  const platformFee = Math.round(totalAmount * 0.04);
  const workerPayable = Math.round(laborFee * 0.95);
  const boothPayable = Math.max(0, totalAmount - vatAmount - platformFee - workerPayable);

  const nowIso = new Date().toISOString();
  const txGroupId = `TXG-${orderCode}-${Date.now().toString().slice(-4)}`;

  // Bút toán Nợ: Nếu khách lẻ trả VietQR -> ESCROW_BANK_NAPAS; Nếu Doanh nghiệp hợp đồng dài hạn -> B2B_ACCOUNTS_RECEIVABLE (Công nợ phải thu)
  const debitAccount = finalPaymentMode === 'B2B_DEBT' ? 'B2B_ACCOUNTS_RECEIVABLE' : 'ESCROW_BANK_NAPAS';
  const debitDesc = finalPaymentMode === 'B2B_DEBT'
    ? `Ghi nhận công nợ hợp đồng dài hạn B2B cho lịch hẹn ${orderCode} (${booking.customerName})`
    : `Thu VietQR Napas247 cho lịch hẹn ${orderCode} (${booking.customerName})`;

  const newLedgerEntries = [
    {
      txGroupId,
      referenceCode: orderCode,
      accountType: debitAccount,
      accountOwnerId: finalPaymentMode === 'B2B_DEBT' ? booking.customerName : 'DATPHU_ESCROW',
      debitAmount: totalAmount,
      creditAmount: 0,
      description: debitDesc,
      createdAt: nowIso
    },
    {
      txGroupId,
      referenceCode: orderCode,
      accountType: 'WORKER_PAYABLE',
      accountOwnerId: booking.assignedWorkerId,
      debitAmount: 0,
      creditAmount: workerPayable,
      description: `Thù lao thực hiện đúng hẹn cho Thợ 6K ${booking.assignedWorkerName}`,
      createdAt: nowIso
    },
    {
      txGroupId,
      referenceCode: orderCode,
      accountType: 'TAX_WITHHOLDING_RESERVE',
      accountOwnerId: 'CUC_THUE_PHU_YEN',
      debitAmount: 0,
      creditAmount: vatAmount,
      description: `Trích lập thuế GTGT tự động theo HĐĐT cho lịch hẹn ${orderCode}`,
      createdAt: nowIso
    },
    {
      txGroupId,
      referenceCode: orderCode,
      accountType: 'PLATFORM_FEE_REVENUE',
      accountOwnerId: 'DATPHU_CORE',
      debitAmount: 0,
      creditAmount: platformFee + boothPayable,
      description: `Doanh thu dịch vụ & điều phối lịch hẹn Đất Phú Core`,
      createdAt: nowIso
    }
  ];

  const invoiceSeq = String(1429 + state.einvoices.length).padStart(8, '0');
  const newEInvoice = {
    referenceCode: orderCode,
    sellerBoothCode: booking.boothCode || 'QUAY-TH-01',
    invoiceTemplateCode: '1C26MTT',
    invoiceNumber: invoiceSeq,
    taxAuthorityCode: `M1-26-PY-4401020233-${invoiceSeq}`,
    totalBeforeVat: totalAmount - vatAmount,
    totalVat: vatAmount,
    totalPayment: totalAmount,
    xmlStoragePath: `https://ckyydvyzucvcdunvedmg.supabase.co/storage/v1/object/public/invoices/HDDT_${orderCode}.xml`,
    status: 'TAX_ACCEPTED',
    issuedAt: nowIso
  };

  const newWarranty = {
    warrantyCode: `BH6K-2026-${orderCode.replace('-', '')}`,
    referenceCode: orderCode,
    workerId: booking.assignedWorkerId,
    workerName: booking.assignedWorkerName,
    customerPhone: booking.customerPhone,
    serialOrScope: `${booking.serviceTitle} (Thực hiện khung giờ ${booking.bookingSlot} ngày ${booking.bookingDate})`,
    activatedAt: nowIso,
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  };

  booking.bookingStatus = 'completed';
  booking.currentKStage = 'K6';
  booking.paymentMethod = finalPaymentMode;
  booking.paymentStatus = finalPaymentMode === 'B2B_DEBT' ? 'B2B_CONTRACT_RECORDED' : 'PAID_VIETQR';
  booking.completedAt = nowIso;

  state.financialLedgerEntries.unshift(...newLedgerEntries);
  state.einvoices.unshift(newEInvoice);
  state.digitalWarranties.unshift(newWarranty);
  saveState(state);

  broadcastSSE(sseClients, 'BOOKING_COMPLETED_K6', {
    booking,
    einvoice: newEInvoice,
    warranty: newWarranty
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: finalPaymentMode === 'B2B_DEBT'
      ? `Đã nghiệm thu đúng hẹn, ghi nhận Công nợ Doanh nghiệp (B2B), hạch toán Sổ cái và xuất HĐĐT #${invoiceSeq}!`
      : `Đã nghiệm thu đúng hẹn, đối soát VietQR, hạch toán Sổ cái và xuất HĐĐT #${invoiceSeq}!`,
    booking,
    einvoice: newEInvoice,
    warranty: newWarranty,
    ledgerEntries: newLedgerEntries
  }));
}

/**
 * 10. THỢ TỰ CÔNG BỐ & CẬP NHẬT BIỂU PHÍ CÁ NHÂN TRÊN GIAN HÀNG SỐ (POST /api/v1/worker/rate-card)
 * Sàn hoàn toàn không can thiệp vào các con số do thợ tự niêm yết.
 */
function handleWorkerUpdateRateCard(req, res, body, sseClients) {
  const state = loadState();
  const {
    workerCode = 'THO-01',
    selfPublishedInspectionFee = 0,
    selfPublishedInspectionNote = '0đ (Thợ tự công bố)',
    baseFee = 100000,
    portfolioBio = '',
    selfPublishedRateCard = []
  } = body;

  const worker = state.workers6k.find(w => w.workerCode === workerCode);
  if (!worker) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Không tìm thấy hồ sơ Thợ ${workerCode}` }));
  }

  worker.selfPublishedInspectionFee = Number(selfPublishedInspectionFee || 0);
  worker.selfPublishedInspectionNote = selfPublishedInspectionNote || `${Number(selfPublishedInspectionFee || 0).toLocaleString('vi-VN')}đ (Thợ tự công bố)`;
  worker.baseFee = Number(baseFee || 100000);
  if (portfolioBio) worker.portfolioBio = portfolioBio;
  if (Array.isArray(selfPublishedRateCard) && selfPublishedRateCard.length > 0) {
    worker.selfPublishedRateCard = selfPublishedRateCard;
  } else {
    worker.selfPublishedRateCard = [
      {
        serviceName: 'Phí kiểm tra & khảo sát tại nhà',
        priceLabel: worker.selfPublishedInspectionNote,
        minFee: worker.selfPublishedInspectionFee
      },
      {
        serviceName: `Đơn giá nhân công tiêu chuẩn (${worker.tradeLabel})`,
        priceLabel: `Từ ${worker.baseFee.toLocaleString('vi-VN')}đ / lần`,
        minFee: worker.baseFee
      }
    ];
  }
  worker.pricingUpdatedAt = new Date().toISOString();

  saveState(state);

  broadcastSSE(sseClients, 'WORKER_RATE_CARD_UPDATED', {
    workerCode: worker.workerCode,
    worker
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    legalNotice: 'Biểu phí cá nhân do chính Thợ tự niêm yết — Sàn Đất Phú chỉ cung cấp hạ tầng hiển thị, không can thiệp giá.',
    worker
  }));
}

/**
 * 11. BÁO GIÁ ĐỘNG TRỰC TIẾP TẠI HIỆN TRƯỜNG GIỮA THỢ VÀ KHÁCH HÀNG (POST /api/v1/worker/field-quote)
 * Thợ khảo sát thực tế -> Tự lập bảng báo giá (Nhân công + Vật tư) gửi thẳng cho khách -> Hai bên tự thỏa thuận dân sự.
 */
function handleWorkerSubmitFieldQuote(req, res, body, sseClients) {
  const state = loadState();
  const {
    referenceCode,
    workerCode,
    laborFee = 100000,
    partsFee = 0,
    partsDescription = 'Không phát sinh vật tư thay thế',
    workerNote = 'Thợ đã khảo sát thực tế tại nhà và thống nhất mức giá trực tiếp với chủ nhà.'
  } = body;

  let targetRecord = state.dispatchTickets.find(t => t.ticketCode === referenceCode);
  if (!targetRecord) {
    targetRecord = state.ordersDp.find(o => o.orderCode === referenceCode);
  }

  if (!targetRecord) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Không tìm thấy mã phiếu/đơn ${referenceCode}` }));
  }

  const cleanLabor = Number(laborFee || 0);
  const cleanParts = Number(partsFee || 0);
  const totalAmount = cleanLabor + cleanParts;
  const nowIso = new Date().toISOString();

  targetRecord.laborFee = cleanLabor;
  targetRecord.partsFee = cleanParts;
  targetRecord.totalAmount = totalAmount;
  targetRecord.grandTotal = totalAmount;
  targetRecord.currentKStage = 'K2';
  targetRecord.dynamicFieldQuote = {
    submittedByWorker: workerCode || targetRecord.assignedWorkerId,
    laborFee: cleanLabor,
    partsFee: cleanParts,
    partsDescription,
    totalAmount,
    workerNote,
    civilAgreementNotice: 'Báo giá do Thợ lập trực tiếp tại hiện trường. Thỏa thuận giá là giao dịch dân sự trực tiếp giữa Chủ nhà và Thợ; Sàn Đất Phú không can thiệp giá, chỉ cung cấp công cụ VietQR và sổ cái minh bạch.',
    submittedAt: nowIso
  };
  targetRecord.vietqr = buildVietQrPayload({ amount: totalAmount, refCode: referenceCode });

  const prevLog = state.k6AuditLogs[0];
  const prevHash = prevLog ? prevLog.recordHash : 'GENESIS_6K';
  const auditEntry = {
    id: `AUDIT-${Date.now().toString().slice(-6)}`,
    referenceCode,
    fromStage: 'K1',
    toStage: 'K2',
    stageLabel: 'K2 - Thợ gửi Báo giá động trực tiếp tại hiện trường (Sàn không can thiệp giá)',
    actorRole: 'WORKER_FIELD_QUOTE',
    note: `Thợ lập báo giá động tại chỗ: Công ${cleanLabor.toLocaleString('vi-VN')}đ + Vật tư ${cleanParts.toLocaleString('vi-VN')}đ (${partsDescription}) = Tổng ${totalAmount.toLocaleString('vi-VN')}đ`,
    prevHash,
    recordHash: computeRecordHash(prevHash, { referenceCode, cleanLabor, cleanParts, nowIso }),
    createdAt: nowIso
  };

  state.k6AuditLogs.unshift(auditEntry);
  saveState(state);

  broadcastSSE(sseClients, 'WORKER_FIELD_QUOTE_SENT', {
    referenceCode,
    dynamicFieldQuote: targetRecord.dynamicFieldQuote,
    record: targetRecord
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: `Đã gửi Báo giá động tại hiện trường (${totalAmount.toLocaleString('vi-VN')}đ) trực tiếp tới khách hàng!`,
    dynamicFieldQuote: targetRecord.dynamicFieldQuote,
    record: targetRecord
  }));
}

module.exports = {
  handleGetOverview,
  handleListWorkers6k,
  handleRequestZaloOtp,
  handleSosDispatch15m,
  handleUpdateK6Stage,
  handleVietQrNapasWebhook,
  handleCommunityReliefAction,
  handleCreateScheduledBooking,
  handleSendBookingReminder2h,
  handleCompleteBookingFlow,
  handleWorkerUpdateRateCard,
  handleWorkerSubmitFieldQuote
};
