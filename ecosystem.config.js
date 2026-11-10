/**
 * ============================================================================
 * PM2 CLUSTER CONFIGURATION CHO CỤM 2 SERVER VPS ĐẤT PHÚ
 * Đường dẫn: ecosystem.config.js
 * Cấu hình phần cứng mục tiêu: 4 vCPU, 8GB RAM, ổ cứng NVMe
 * ============================================================================
 */

module.exports = {
  apps: [
    // 1. NHÓM ỨNG DỤNG WEB & API GATEWAY (CHẠY CLUSTER MODE TẬN DỤNG HẾT 4 vCPU)
    {
      name: 'datphu-api',
      script: 'src/server.js',
      instances: 4,                  // Chạy 4 tiến trình song song tương ứng 4 vCPU
      exec_mode: 'cluster',          // Chế độ cân bằng tải nội bộ PM2
      watch: false,                  // Tắt watch trên production để tối ưu hiệu năng
      max_memory_restart: '1G',      // Tự động khởi động lại nếu 1 instance vượt 1GB RAM
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        NODE_OPTIONS: '--use-system-ca --max-old-space-size=1536'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-api-error.log',
      out_file: 'logs/pm2-api-out.log',
      merge_logs: true,
      min_uptime: '10s',             // Ngăn ngừa crash loop
      max_restarts: 10,
      listen_timeout: 8000,
      kill_timeout: 3000             // Thời gian chờ đóng kết nối an toàn khi reload
    },

    // 2. NHÓM TIẾN TRÌNH TỰ ĐỘNG CHẠY NGẦM (CHỈ CHẠY DUY NHẤT 1 INSTANCE)
    // Phục vụ canh lũ 15 phút/lần và quét sổ giỗ lúc 5:00 AM
    {
      name: 'datphu-sentinel-worker',
      script: 'src/jobs/index.js',
      instances: 1,                  // Bắt buộc 1 instance duy nhất để không trùng lặp tin nhắn
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        ROLE: 'SENTINEL_WORKER',
        NODE_OPTIONS: '--use-system-ca'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-sentinel-error.log',
      out_file: 'logs/pm2-sentinel-out.log'
    }
  ]
};
