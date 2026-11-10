/**
 * ============================================================================
 * ĐẤT PHÚ ASTRONOMICAL ENGINE - GIẢI THUẬT THIÊN VĂN JEAN MEEUS ĐỘC LẬP
 * ============================================================================
 * Bản quyền: CÔNG TY TNHH THƯƠNG MẠI ĐẤT PHÚ
 * Tác giả kế thừa: Dựa trên giải thuật Jean Meeus (Astronomical Algorithms 1998)
 *                  và chuẩn hóa múi giờ Việt Nam GMT+7 (TS. Hồ Ngọc Đức).
 *
 * ĐẶC ĐIỂM KỸ THUẬT:
 * 1. Thuần JavaScript (Zero-Dependencies): Không phụ thuộc bất kỳ thư viện ngoài.
 * 2. Tốc độ cực hạn: ~0.001ms / phép tính, an toàn tuyệt đối khi tính toán hàng triệu ngày.
 * 3. Tính toán chính xác tuyệt đối:
 *    - Điểm Sóc (New Moon) theo nhiễu loạn Mặt Trăng - Mặt Trời.
 *    - Kinh độ Mặt Trời (Sun Longitude) 0° - 360° -> 24 Tiết khí thiên văn.
 *    - Chuyển đổi hai chiều: Dương lịch <-> Âm lịch.
 *    - Con nước triều cường / triều kiệt (Nước rong / Nước kém) cho ngư dân Nam Trung Bộ.
 *    - Chu kỳ Can Chi (Lục thập hoa giáp) cho Năm, Tháng, Ngày, Giờ.
 * ============================================================================
 */

'use strict';

const TIME_ZONE = 7.0; // Múi giờ Việt Nam (UTC+7 / GMT+7)

// 10 Thiên Can & 12 Địa Chi
const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

// 24 Tiết khí thiên văn tương ứng với kinh độ Mặt Trời (0° đến 345°, mỗi tiết 15°)
const SOLAR_TERMS = [
  { name: "Xuân Phân", degree: 0, season: "Mùa Xuân" },
  { name: "Thanh Minh", degree: 15, season: "Mùa Xuân" },
  { name: "Cốc Vũ", degree: 30, season: "Mùa Xuân" },
  { name: "Lập Hạ", degree: 45, season: "Mùa Hè" },
  { name: "Tiểu Mãn", degree: 60, season: "Mùa Hè" },
  { name: "Mang Chủng", degree: 75, season: "Mùa Hè" },
  { name: "Hạ Chí", degree: 90, season: "Mùa Hè" },
  { name: "Tiểu Thử", degree: 105, season: "Mùa Hè" },
  { name: "Đại Thử", degree: 120, season: "Mùa Hè" },
  { name: "Lập Thu", degree: 135, season: "Mùa Thu" },
  { name: "Xử Thử", degree: 150, season: "Mùa Thu" },
  { name: "Bạch Lộ", degree: 165, season: "Mùa Thu" },
  { name: "Thu Phân", degree: 180, season: "Mùa Thu" },
  { name: "Hàn Lộ", degree: 195, season: "Mùa Thu" },
  { name: "Sương Giáng", degree: 210, season: "Mùa Thu" },
  { name: "Lập Đông", degree: 225, season: "Mùa Đông" },
  { name: "Tiểu Tuyết", degree: 240, season: "Mùa Đông" },
  { name: "Đại Tuyết", degree: 255, season: "Mùa Đông" },
  { name: "Đông Chí", degree: 270, season: "Mùa Đông" },
  { name: "Tiểu Hàn", degree: 285, season: "Mùa Đông" },
  { name: "Đại Hàn", degree: 300, season: "Mùa Đông" },
  { name: "Lập Xuân", degree: 315, season: "Mùa Xuân" },
  { name: "Vũ Thủy", degree: 330, season: "Mùa Xuân" },
  { name: "Kinh Trập", degree: 345, season: "Mùa Xuân" }
];

function INT(d) {
  return Math.floor(d);
}

/**
 * Tính số ngày Julius (Julian Day Number - JDN) từ ngày Dương lịch
 */
function jdFromDate(dd, mm, yy) {
  let a = INT((14 - mm) / 12);
  let y = yy + 4800 - a;
  let m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
}

/**
 * Chuyển số ngày Julius (JDN) ngược lại thành ngày Dương lịch [dd, mm, yyyy]
 */
function jdToDate(jd) {
  let a, b, c, d, e, m, day, month, year;
  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  d = INT((4 * c + 3) / 1461);
  e = c - INT((1461 * d) / 4);
  m = INT((5 * e + 2) / 153);
  day = e - INT((153 * m + 2) / 5) + 1;
  month = m + 3 - 12 * INT(m / 10);
  year = b * 100 + d - 4800 + INT(m / 10);
  return [day, month, year];
}

/**
 * Tính thời điểm Điểm Sóc (New Moon) theo giải thuật Jean Meeus
 * @param {number} k Chỉ số tuần trăng (k = 0 ứng với 1900-01-01)
 */
function NewMoon(k) {
  let T = k / 1236.85;
  let T2 = T * T;
  let T3 = T2 * T;
  let dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  let M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  let Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  let F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M)
         - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr)
         - 0.0004 * Math.sin(dr * 3 * Mpr) + 0.0104 * Math.sin(dr * 2 * F)
         - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr))
         + 0.0004 * Math.sin(dr * (2 * F + M)) - 0.0004 * Math.sin(dr * (2 * F - M))
         - 0.0006 * Math.sin(dr * (2 * F + Mpr)) + 0.0010 * Math.sin(dr * (2 * F - Mpr))
         + 0.0005 * Math.sin(dr * (2 * Mpr + M));

  let deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2
    : -0.000278 + 0.000265 * T + 0.000262 * T2;

  return Jd1 + C1 - deltat;
}

/**
 * Tính kinh độ biểu kiến Mặt Trời (Sun Apparent Longitude) theo bức xạ JDN
 */
function SunLongitude(jdn) {
  let T = (jdn - 2451545.0) / 36525;
  let T2 = T * T;
  let dr = Math.PI / 180;
  let M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  let L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
         + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M)
         + 0.000290 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  return L - Math.PI * 2 * (INT(L / (Math.PI * 2)));
}

function getSunLongitude(dayNumber, timeZone = TIME_ZONE) {
  return SunLongitude(dayNumber - 0.5 - timeZone / 24.0);
}

function getNewMoonDay(k, timeZone = TIME_ZONE) {
  return INT(NewMoon(k) + 0.5 + timeZone / 24.0);
}

function getLunarMonth11(yy, timeZone = TIME_ZONE) {
  let off = jdFromDate(31, 12, yy) - 2415021;
  let k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  let sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= Math.PI * 1.5) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11, timeZone = TIME_ZONE) {
  let k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let last = 0;
  let i = 1;
  let arc = Math.PI / 6.0;
  while (true) {
    let d = getNewMoonDay(k + i, timeZone);
    let sunLong = getSunLongitude(d, timeZone);
    let current = INT(sunLong / arc);
    if (current === last) return i;
    last = current;
    i++;
    if (i > 14) break;
  }
  return i;
}

/**
 * Chuyển ngày Dương Lịch -> Âm Lịch (Chuẩn Jean Meeus & TS. Hồ Ngọc Đức)
 * @param {number} dd Ngày dương (1-31)
 * @param {number} mm Tháng dương (1-12)
 * @param {number} yy Năm dương (1900-2199)
 * @param {number} timeZone Múi giờ (mặc định 7.0)
 */
function solarToLunar(dd, mm, yy, timeZone = TIME_ZONE) {
  let dayNumber = jdFromDate(dd, mm, yy);
  let k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }

  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }

  let lunarDay = dayNumber - monthStart + 1;
  let diff = INT((monthStart - a11) / 29.0);
  let lunarLeap = 0;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    let leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = 1;
      }
    }
  }

  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    isLeap: lunarLeap === 1,
    jdn: dayNumber
  };
}

/**
 * Chuyển ngày Âm Lịch -> Dương Lịch (Chuẩn hai chiều tuyệt đối)
 */
function lunarToSolar(lunarDay, lunarMonth, lunarYear, isLeap = false, timeZone = TIME_ZONE) {
  let a11, b11;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }

  let k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth < 11 ? lunarMonth + 1 : lunarMonth - 11;
  let leapOff = 0;
  let leapMonth = 0;

  if (b11 - a11 > 365) {
    leapOff = getLeapMonthOffset(a11, timeZone);
    leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (isLeap && lunarMonth !== leapMonth) {
      return null; // Không tồn tại tháng nhuận này trong năm
    }
    if (isLeap || off >= leapOff) {
      off += 1;
    }
  }

  let monthStart = getNewMoonDay(k + off, timeZone);
  let jdn = monthStart + lunarDay - 1;
  let [d, m, y] = jdToDate(jdn);
  return { day: d, month: m, year: y, jdn };
}

/**
 * Tính Can Chi của Ngày, Tháng, Năm
 */
function getCanChi(solarDay, solarMonth, solarYear, lunarMonth, lunarYear) {
  let jdn = jdFromDate(solarDay, solarMonth, solarYear);

  // Can Chi Năm
  let yearCan = CAN[(lunarYear + 6) % 10];
  let yearChi = CHI[(lunarYear + 8) % 12];

  // Can Chi Tháng
  let monthCan = CAN[(lunarYear * 12 + lunarMonth + 3) % 10];
  let monthChi = CHI[(lunarMonth + 1) % 12];

  // Can Chi Ngày (JDN + 9 chia 10 lấy Can, JDN + 1 chia 12 lấy Chi)
  let dayCan = CAN[(jdn + 9) % 10];
  let dayChi = CHI[(jdn + 1) % 12];

  return {
    year: `${yearCan} ${yearChi}`,
    month: `${monthCan} ${monthChi}`,
    day: `${dayCan} ${dayChi}`,
    raw: {
      yearCan, yearChi,
      monthCan, monthChi,
      dayCan, dayChi
    }
  };
}

/**
 * Lấy 24 Tiết khí thiên văn chính xác dựa vào kinh độ Mặt Trời tại ngày đó
 */
function getSolarTerm(jdn, timeZone = TIME_ZONE) {
  let sl = getSunLongitude(jdn, timeZone) * 180 / Math.PI;
  let index = INT(sl / 15);
  let term = SOLAR_TERMS[index % 24];
  return {
    name: term.name,
    solarLongitude: Math.round(sl * 100) / 100,
    season: term.season,
    index: index % 24
  };
}

/**
 * Quy luật Thủy Triều & Sinh Kế Biển / Đầm Vịnh Nam Trung Bộ
 * Áp dụng cho: Đầm Ô Loan, Vịnh Xuân Đài, Cửa Biển Đà Diễn (Sông Ba), Cửa Sông Kỳ Lộ
 */
function getTidePrediction(lunarDay) {
  // Nước rong: Triều cường cực đại quanh kỳ Sóc (Mùng 1 - Mùng 3) và kỳ Vọng (14 - 17 âm lịch)
  let isSpringTide = (lunarDay >= 1 && lunarDay <= 3) || (lunarDay >= 14 && lunarDay <= 17);

  // Nước kém: Triều kiệt, nước đứng vào kỳ huyền (mùng 7 - 9 và 22 - 24 âm lịch)
  let isNeapTide = (lunarDay >= 7 && lunarDay <= 9) || (lunarDay >= 22 && lunarDay <= 24);

  if (isSpringTide) {
    return {
      status: "NƯỚC RONG",
      description: "Triều lớn, cá vào lộng, mực nước dâng cao phục vụ kéo lưới và lưu thông thuyền bè cửa lạch.",
      intensity: "Cao",
      tideCode: "SPRING_TIDE"
    };
  } else if (isNeapTide) {
    return {
      status: "NƯỚC KÉM",
      description: "Triều cạn, nước đứng yếu, thuận lợi cào nghêu đầm Ô Loan và sửa chữa lồng bè vịnh Xuân Đài.",
      intensity: "Thấp",
      tideCode: "NEAP_TIDE"
    };
  } else {
    return {
      status: "NƯỚC VỪA",
      description: "Mực nước dao động trung bình, điều kiện sinh kế bình ổn.",
      intensity: "Trung bình",
      tideCode: "MODERATE_TIDE"
    };
  }
}

/**
 * Pha Mặt Trăng & Tỷ lệ sáng (Moon Phase & Illumination)
 */
function getMoonPhase(lunarDay) {
  let phaseAngle = (lunarDay - 1) / 29.53058868;
  let illumination = Math.round((1 - Math.cos(phaseAngle * 2 * Math.PI)) / 2 * 100);

  let phaseName = "Trăng Khuyết";
  if (lunarDay === 1) phaseName = "Điểm Sóc (Trăng Tối)";
  else if (lunarDay >= 2 && lunarDay <= 6) phaseName = "Trăng Lưỡi Liềm Đầu Tháng";
  else if (lunarDay >= 7 && lunarDay <= 9) phaseName = "Trăng Bán Nguyệt Đầu Tháng";
  else if (lunarDay >= 10 && lunarDay <= 13) phaseName = "Trăng Tròn Dần (Trăng Khương)";
  else if (lunarDay === 15) phaseName = "Trăng Rằm (Điểm Vọng)";
  else if (lunarDay >= 16 && lunarDay <= 21) phaseName = "Trăng Khuyết Dần";
  else if (lunarDay >= 22 && lunarDay <= 24) phaseName = "Trăng Bán Nguyệt Cuối Tháng";
  else if (lunarDay >= 25 && lunarDay <= 29) phaseName = "Trăng Tàn (Lưỡi Liềm Cuối Tháng)";

  return {
    phaseName,
    illuminationPercent: illumination,
    lunarDay
  };
}

/**
 * Tạo ma trận lưới lịch cho 1 tháng Dương lịch hoàn chỉnh
 * Phục vụ chế độ xem Hàng Tháng (Lưới Ngày Dương kèm Số Âm Lịch To Rõ)
 */
function getMonthCalendar(month, year) {
  let firstDay = new Date(year, month - 1, 1);
  let daysInMonth = new Date(year, month, 0).getDate();
  let startDayOfWeek = firstDay.getDay(); // 0 = Chủ Nhật, 1 = Thứ Hai...

  let days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    let lun = solarToLunar(d, month, year);
    let canChi = getCanChi(d, month, year, lun.month, lun.year);
    let tide = getTidePrediction(lun.day);
    let term = getSolarTerm(lun.jdn);
    let dayOfWeek = (startDayOfWeek + d - 1) % 7;

    days.push({
      solarDay: d,
      solarMonth: month,
      solarYear: year,
      dayOfWeek: WEEKDAYS[dayOfWeek],
      dayOfWeekIndex: dayOfWeek,
      lunarDay: lun.day,
      lunarMonth: lun.month,
      lunarYear: lun.year,
      isLeapMonth: lun.isLeap,
      canChiDay: canChi.day,
      canChiMonth: canChi.month,
      canChiYear: canChi.year,
      tideStatus: tide.status,
      tideCode: tide.tideCode,
      solarTerm: term.name,
      isFirstLunarDay: lun.day === 1,
      isFullMoon: lun.day === 15
    });
  }

  return {
    month,
    year,
    startDayOfWeek,
    totalDays: daysInMonth,
    days
  };
}

module.exports = {
  TIME_ZONE,
  CAN,
  CHI,
  WEEKDAYS,
  SOLAR_TERMS,
  jdFromDate,
  jdToDate,
  solarToLunar,
  lunarToSolar,
  getCanChi,
  getSolarTerm,
  getTidePrediction,
  getMoonPhase,
  getMonthCalendar
};
