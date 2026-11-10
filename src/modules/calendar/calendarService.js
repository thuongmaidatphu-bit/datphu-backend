/**
 * ============================================================================
 * ĐẤT PHÚ CALENDAR & LIVELIHOOD SERVICE
 * ============================================================================
 * Kết hợp giải thuật thiên văn Meeus với dữ liệu vi khí hậu vệ tinh Open-Meteo
 * phục vụ sinh kế nông dân, ngư dân, bà con hạ lưu các đập thủy điện Phú Yên.
 * ============================================================================
 */

'use strict';

const https = require('https');
const meeusEngine = require('./meeusEngine');

// 4 Trọng điểm kinh tế & sinh kế vi khí hậu tại Phú Yên
const REGIONS = {
  "tuy_hoa": {
    id: "tuy_hoa",
    name: "TP. Tuy Hòa",
    tag: "Đồng bằng duyên hải & Hạ lưu Sông Ba",
    lat: 13.088,
    lon: 109.313,
    nearestRainAnchor: "14 km (Chư Sê / Gia Lai)"
  },
  "dong_xuan": {
    id: "dong_xuan",
    name: "Đồng Xuân",
    tag: "Rốn lũ hạ lưu Sông Kỳ Lộ",
    lat: 13.385,
    lon: 109.050,
    nearestRainAnchor: "8 km (Vân Canh / Bình Định)"
  },
  "song_cau": {
    id: "song_cau",
    name: "TX. Sông Cầu",
    tag: "Vịnh Xuân Đài & Vùng nuôi tôm hùm lồng bè",
    lat: 13.480,
    lon: 109.220,
    nearestRainAnchor: "22 km (Quy Nhơn)"
  },
  "song_hinh": {
    id: "song_hinh",
    name: "Huyện Sông Hinh",
    tag: "Vùng đập hồ thủy điện Sông Hinh & Thượng nguồn Sông Ba",
    lat: 12.920,
    lon: 109.000,
    nearestRainAnchor: "11 km (Krông Năng / Đắk Lắk)"
  }
};

// Bộ đệm in-memory RAM cache (TTL linh hoạt)
const memoryCache = new Map();

function getCached(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data, ttlSeconds) {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
}

/**
 * Fetch thời tiết vệ tinh Open-Meteo siêu nhẹ (<500 bytes)
 */
function fetchSatelliteWeather(lat, lon) {
  return new Promise((resolve) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=Asia%2FBangkok`;

    const req = https.get(url, { timeout: 3500 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const cur = parsed.current || {};
          resolve({
            temperature: cur.temperature_2m ?? 25.0,
            humidity: cur.relative_humidity_2m ?? 80,
            precipitation: cur.precipitation ?? 0.0,
            windSpeed: cur.wind_speed_10m ?? 12.0,
            fetchedAt: new Date().toISOString()
          });
        } catch (e) {
          resolve(getFallbackWeather());
        }
      });
    });

    req.on('error', () => resolve(getFallbackWeather()));
    req.on('timeout', () => {
      req.destroy();
      resolve(getFallbackWeather());
    });
  });
}

function getFallbackWeather() {
  return {
    temperature: 25.0,
    humidity: 82,
    precipitation: 0.0,
    windSpeed: 14.0,
    isFallback: true,
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Lấy toàn bộ dữ liệu ngày hôm nay (Bloc Ngày Đại)
 */
async function getTodayData(regionKey = 'tuy_hoa', customDate = null) {
  const targetDate = customDate ? new Date(customDate) : new Date();
  const d = targetDate.getDate();
  const m = targetDate.getMonth() + 1;
  const y = targetDate.getFullYear();
  const wd = targetDate.getDay();

  const region = REGIONS[regionKey] || REGIONS["tuy_hoa"];
  const weatherCacheKey = `weather:${region.id}`;

  let weather = getCached(weatherCacheKey);
  if (!weather) {
    weather = await fetchSatelliteWeather(region.lat, region.lon);
    setCached(weatherCacheKey, weather, 900); // Cache 15 phút
  }

  // Giải thuật thiên văn Meeus
  const lunar = meeusEngine.solarToLunar(d, m, y);
  const canChi = meeusEngine.getCanChi(d, m, y, lunar.month, lunar.year);
  const tide = meeusEngine.getTidePrediction(lunar.day);
  const moon = meeusEngine.getMoonPhase(lunar.day);
  const term = meeusEngine.getSolarTerm(lunar.jdn);

  // Cảnh báo thời tiết / thủy văn nguy hiểm nếu mưa lớn
  let floodWarning = null;
  if (weather.precipitation >= 20.0 || weather.windSpeed >= 35.0) {
    floodWarning = {
      level: "CẢNH BÁO CAO",
      message: `Mưa đầu nguồn ${weather.precipitation} mm, gió giật ${weather.windSpeed} km/h tại khu vực ${region.name}. Đề phòng lũ quét và nước dâng!`,
      shouldAlarm: true
    };
  }

  return {
    solar: {
      day: d,
      month: m,
      year: y,
      dayOfWeek: meeusEngine.WEEKDAYS[wd],
      dayOfWeekIndex: wd,
      fullText: `${meeusEngine.WEEKDAYS[wd].toUpperCase()}, ${d < 10 ? '0' : ''}${d} THÁNG ${m} NĂM ${y}`,
      gmt: "GMT+7"
    },
    lunar: {
      day: lunar.day,
      dayPadded: lunar.day < 10 ? `0${lunar.day}` : `${lunar.day}`,
      month: lunar.month,
      year: lunar.year,
      isLeap: lunar.isLeap,
      dayText: lunar.day === 1 ? "MÙNG 1" : (lunar.day === 15 ? "NGÀY RẰM 15" : `NGÀY ${lunar.day}`),
      fullTitle: `${lunar.day === 1 ? 'MÙNG 1' : (lunar.day === 15 ? 'RẰM 15' : `MÙNG ${lunar.day}`)} THÁNG ${lunar.month} ÂM LỊCH`,
      canChiYear: `NĂM ${canChi.year.toUpperCase()}`
    },
    canChi: {
      day: canChi.day,
      month: canChi.month,
      year: canChi.year
    },
    astronomy: {
      solarTerm: term.name,
      solarLongitudeDegree: term.solarLongitude,
      season: term.season,
      moonPhase: moon.phaseName,
      illuminationPercent: moon.illuminationPercent
    },
    livelihoodTide: {
      status: tide.status,
      description: tide.description,
      intensity: tide.intensity,
      tideCode: tide.tideCode
    },
    weather: {
      regionId: region.id,
      regionName: region.name,
      regionTag: region.tag,
      nearestRain: region.nearestRainAnchor,
      temperature: weather.temperature,
      humidity: weather.humidity,
      precipitation: weather.precipitation,
      windSpeed: weather.windSpeed,
      floodWarning
    }
  };
}

/**
 * Lấy lịch tháng hoàn chỉnh
 */
function getMonthData(month, year) {
  const m = parseInt(month, 10) || (new Date().getMonth() + 1);
  const y = parseInt(year, 10) || new Date().getFullYear();
  const cacheKey = `cal:month:${y}:${m}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const monthGrid = meeusEngine.getMonthCalendar(m, y);
  setCached(cacheKey, monthGrid, 86400); // Cache 24 giờ
  return monthGrid;
}

/**
 * Tổng quan 12 tháng hàng năm
 */
function getYearOverview(year) {
  const y = parseInt(year, 10) || new Date().getFullYear();
  const cacheKey = `cal:year:${y}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  let months = [];
  for (let m = 1; m <= 12; m++) {
    const cal = meeusEngine.getMonthCalendar(m, y);
    // Tìm ngày mùng 1 âm lịch đầu tiên trong tháng
    const firstLunar = cal.days.find(d => d.lunarDay === 1);
    months.push({
      month: m,
      year: y,
      totalDays: cal.totalDays,
      firstLunarMonthNotice: firstLunar ? `Mùng 1 Th.${firstLunar.lunarMonth}` : null,
      hasFullMoon: cal.days.some(d => d.isFullMoon)
    });
  }

  const result = {
    year: y,
    months
  };

  setCached(cacheKey, result, 86400 * 7); // Cache 7 ngày
  return result;
}

/**
 * Chuyển đổi linh hoạt 2 chiều
 */
function convertDate({ type, day, month, year, isLeap }) {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const leap = isLeap === 'true' || isLeap === true;

  if (type === 'lunar2solar') {
    const sol = meeusEngine.lunarToSolar(d, m, y, leap);
    if (!sol) return { success: false, error: "Ngày âm lịch không hợp lệ" };
    return {
      success: true,
      input: { day: d, month: m, year: y, isLeap: leap },
      converted: { day: sol.day, month: sol.month, year: sol.year }
    };
  } else {
    const lun = meeusEngine.solarToLunar(d, m, y);
    const canChi = meeusEngine.getCanChi(d, m, y, lun.month, lun.year);
    return {
      success: true,
      input: { day: d, month: m, year: y },
      converted: {
        lunarDay: lun.day,
        lunarMonth: lun.month,
        lunarYear: lun.year,
        isLeap: lun.isLeap,
        canChi: canChi
      }
    };
  }
}

module.exports = {
  REGIONS,
  getTodayData,
  getMonthData,
  getYearOverview,
  convertDate
};
