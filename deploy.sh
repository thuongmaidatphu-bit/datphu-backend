#!/bin/bash
# ============================================================================
# KỊCH BẢN TRIỂN KHAI & NÂNG CẤP KHÔNG GIÁN ĐOẠN (ZERO-DOWNTIME DEPLOYMENT)
# Hệ thống: Đất Phú Core Backend Engine (Cụm 2 VPS NVMe)
# ============================================================================

set -e

echo "🚀 [Đất Phú Deploy] Bắt đầu nâng cấp phiên bản mới..."

# 1. Kéo mã nguồn mới nhất từ kho lưu trữ
git pull origin main

# 2. Cài đặt các gói phụ thuộc (nếu có thay đổi)
npm install --production

# 3. Nạp lại cụm Node.js bằng cơ chế Zero-Downtime Reload của PM2
# (Các tiến trình được reload lần lượt từng cái một, người dùng không hề bị mất kết nối)
pm2 reload ecosystem.config.js --update-env

# 4. Kiểm tra trạng thái các tiến trình
pm2 status

echo "✅ [Đất Phú Deploy] Nâng cấp hoàn tất thành công! Hệ thống hoạt động 100% không gián đoạn."
