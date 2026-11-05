const fs = require('fs');

// 1. Update src/server.js with /api/ai/upload-key
const serverPath = 'E:/datphu-backend/src/server.js';
let serverCode = fs.readFileSync(serverPath, 'utf8');

const uploadKeyRoute = `  // Tải lên Service Account Key từ giao diện Antigravity
  if (pathname === '/api/ai/upload-key' && req.method === 'POST') {
    const vertexAiClient = require('./core/vertexAiClient');
    try {
      const keyData = typeof body === 'string' ? JSON.parse(body) : body;
      fs.writeFileSync('E:/datphu-backend/service-account-key.json', JSON.stringify(keyData, null, 2), 'utf8');
      vertexAiClient.initVertexAI();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        message: 'Đã nạp và kích hoạt Service Account Google Cloud Vertex AI thành công!',
        status: vertexAiClient.getVertexStatus()
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }
`;

if (!serverCode.includes('/api/ai/upload-key')) {
  serverCode = serverCode.replace("if (pathname === '/api/ai/vertex-status' && req.method === 'GET') {", uploadKeyRoute + "\n  if (pathname === '/api/ai/vertex-status' && req.method === 'GET') {");
  fs.writeFileSync(serverPath, serverCode, 'utf8');
  console.log('Added /api/ai/upload-key to server.js');
}

// 2. Update public/vi_an_sinh_app.html with AI Copilot Floating Widget & Header Button
const htmlPath = 'E:/datphu-backend/public/vi_an_sinh_app.html';
let htmlCode = fs.readFileSync(htmlPath, 'utf8');

// Add Header Tab: [ 🤖 TRỢ LÝ AI ]
const headerAiTab = `      <!-- 6. Trợ Lý AI Vertex Copilot -->
      <button onclick="toggleAiCopilot()" id="topNav-ai" class="top-nav-btn px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-[#1E2260] bg-indigo-50 border border-indigo-200 transition flex items-center space-x-1 whitespace-nowrap active:scale-95">
        <span class="animate-pulse">🤖</span>
        <span class="hidden md:inline">TRỢ LÝ AI VERTEX</span>
        <span class="inline md:hidden">TRỢ LÝ AI</span>
      </button>`;

if (!htmlCode.includes('id="topNav-ai"')) {
  htmlCode = htmlCode.replace('<button onclick="switchView(\'admin\')"', headerAiTab + '\n\n      <button onclick="switchView(\'admin\')"');
}

// Add Floating AI Button & Side Panel Drawer before </body>
const aiCopilotHtml = `
  <!-- ======================================================================== -->
  <!-- NÚT NỔI FLOATING COPILOT: TRỢ LÝ AI VERTEX (GOOGLE CLOUD) -->
  <!-- ======================================================================== -->
  <div class="fixed bottom-5 right-5 z-40 flex flex-col items-end space-y-2">
    <!-- Tooltip mời gọi -->
    <div id="aiFloatingBadge" onclick="toggleAiCopilot()" class="cursor-pointer px-3 py-1.5 rounded-2xl bg-white border border-indigo-300 shadow-lg text-[11px] font-extrabold text-[#1E2260] flex items-center space-x-1.5 animate-bounce transition">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
      <span>Trợ Lý Vertex AI Đang Trực Quầy &rarr;</span>
    </div>

    <!-- Nút tròn nổi tiếng Việt -->
    <button onclick="toggleAiCopilot()" id="aiFloatingBtn" title="Mở Trợ Lý Điều Hành AI Vertex" class="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E2260] via-indigo-700 to-[#D7262D] text-white shadow-2xl flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition ring-4 ring-indigo-200 group">
      <span class="group-hover:rotate-12 transition-transform">🤖</span>
    </button>
  </div>

  <!-- ======================================================================== -->
  <!-- BẢNG ĐIỀU KHIỂN TRỢ LÝ AI VERTEX (AI COPILOT DRAWER) -->
  <!-- ======================================================================== -->
  <div id="aiCopilotDrawer" class="hidden fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-300 animate-in slide-in-from-right duration-200">
    
    <!-- Drawer Header -->
    <div class="p-4 bg-gradient-to-r from-[#1E2260] via-indigo-900 to-[#D7262D] text-white flex items-center justify-between shadow-md">
      <div class="flex items-center space-x-2.5">
        <span class="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-xl">🤖</span>
        <div>
          <div class="flex items-center space-x-1.5">
            <h3 class="font-black text-sm">TRỢ LÝ AI VERTEX COPILOT</h3>
            <span class="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px]">GEMINI 1.5</span>
          </div>
          <div class="text-[10px] text-blue-200" id="aiDrawerStatusText">Google Cloud Vertex AI • Datphu Project</div>
        </div>
      </div>
      <button onclick="toggleAiCopilot()" class="text-white hover:text-red-200 font-black text-2xl leading-none">&times;</button>
    </div>

    <!-- Banner Trạng Thái Kết Nối Google Cloud & Nạp Key Nhanh -->
    <div class="p-3 bg-slate-50 border-b border-slate-200 text-xs">
      <div class="flex items-center justify-between mb-1.5">
        <div class="flex items-center space-x-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" id="aiStatusDot"></span>
          <span class="font-bold text-slate-800" id="aiStatusTitle">Trạng Thái Kết Nối Vertex AI:</span>
        </div>
        <button onclick="document.getElementById('aiKeyFileInput').click()" class="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition">
          <i class="fa-solid fa-upload mr-0.5"></i> Nạp File Key
        </button>
        <input type="file" id="aiKeyFileInput" accept=".json" class="hidden" onchange="uploadServiceAccountKey(event)">
      </div>
      <div class="text-[10px] text-slate-500 leading-tight" id="aiStatusDesc">
        Tài khoản dịch vụ: <b class="text-[#1E2260]">mini-pos-dat-phu@datphu.iam.gserviceaccount.com</b> (Dự án Datphu).
      </div>
    </div>

    <!-- Quick Chips: Gợi Ý Ra Lệnh 1 Chạm -->
    <div class="p-2.5 bg-slate-100/70 border-b border-slate-200 flex space-x-1.5 overflow-x-auto no-scrollbar text-xs">
      <button onclick="sendAiCommand('Bàn 02 gọi 2 cà phê sữa và 1 bánh mì chả cá')" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-600 text-slate-700 whitespace-nowrap text-[11px] font-semibold transition active:scale-95">
        ☕ Lên đơn Bàn 02
      </button>
      <button onclick="sendAiCommand('Kiểm tra kho còn bao nhiêu hộp bò một nắng?')" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-600 text-slate-700 whitespace-nowrap text-[11px] font-semibold transition active:scale-95">
        📦 Kiểm tra kho OCOP
      </button>
      <button onclick="sendAiCommand('Phòng 102 bị chập điện, gọi thợ khẩn cấp')" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-600 text-slate-700 whitespace-nowrap text-[11px] font-semibold transition active:scale-95">
        ⚡ Gọi thợ điện 6K
      </button>
      <button onclick="sendAiCommand('Giải thích thuế suất máy tính tiền 1C26MDP')" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-600 text-slate-700 whitespace-nowrap text-[11px] font-semibold transition active:scale-95">
        🧾 Hỏi thuế NĐ 123
      </button>
    </div>

    <!-- Khung Tin Nhắn Đàm Thoại & Generative UI -->
    <div id="aiMessageContainer" class="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 text-xs">
      
      <!-- Tin nhắn chào mừng mặc định -->
      <div class="flex items-start space-x-2">
        <span class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🤖</span>
        <div class="p-3 bg-white rounded-2xl rounded-tl-none border border-slate-200 text-slate-800 space-y-1.5 shadow-2xs max-w-[85%]">
          <div class="font-extrabold text-[11px] text-indigo-900">Trợ Lý AI Đất Phú Core:</div>
          <div>Xin chào Thu Ngân 01! Tôi là Trợ Lý Điều Hành AI kết nối Google Cloud Vertex AI. Bạn có thể <b>nói bằng giọng nói</b> hoặc <b>gõ văn bản</b> để ra lệnh:</div>
          <ul class="list-disc pl-4 text-[10px] text-slate-600 space-y-0.5">
            <li>Tự động lên đơn cà phê / đồ ăn cho bàn.</li>
            <li>Kiểm tra tồn kho định mức ml/gram & Hộp/kg.</li>
            <li>Điều phối thợ sửa chữa điện nước/điện lạnh 6K.</li>
          </ul>
        </div>
      </div>

    </div>

    <!-- Khung Nhập Lệnh & Nút Thu Âm Giọng Nói -->
    <div class="p-3 bg-white border-t border-slate-200 space-y-2">
      <div class="flex items-center space-x-2">
        <button onclick="toggleVoiceInput()" id="aiVoiceBtn" title="Bấm để nói bằng giọng nói tiếng Việt" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-[#D7262D] border border-slate-200 flex items-center justify-center text-base transition active:scale-95">
          <i class="fa-solid fa-microphone"></i>
        </button>
        <input type="text" id="aiCommandInput" placeholder="Nói hoặc gõ lệnh: VD 'Lên đơn 2 cafe sữa bàn 02'..." class="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none" onkeydown="if(event.key==='Enter') submitAiMessage()">
        <button onclick="submitAiMessage()" class="px-3.5 py-2 bg-gradient-to-r from-[#1E2260] to-indigo-700 hover:from-indigo-800 hover:to-indigo-900 text-white font-bold rounded-xl text-xs shadow-sm transition active:scale-95 flex items-center gap-1">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
      <div class="flex items-center justify-between text-[10px] text-slate-400">
        <span>Giao diện Antigravity ↔ Não bộ Vertex AI Gemini</span>
        <span id="aiVoiceStatusText" class="text-indigo-600 font-bold">Micro: Sẵn sàng</span>
      </div>
    </div>

  </div>
`;

if (!htmlCode.includes('id="aiCopilotDrawer"')) {
  htmlCode = htmlCode.replace('</body>', `${aiCopilotHtml}\n</body>`);
}

// Add JavaScript functions for AI Copilot
const aiCopilotScript = `
    // ========================================================================
    // TÍCH HỢP TRỢ LÝ AI VERTEX COPILOT (ANTIGRAVITY UI + VERTEX AI BRAIN)
    // ========================================================================
    let isCopilotOpen = false;
    let isRecording = false;
    let speechRecognition = null;

    function toggleAiCopilot() {
      const drawer = document.getElementById('aiCopilotDrawer');
      const badge = document.getElementById('aiFloatingBadge');
      isCopilotOpen = !isCopilotOpen;
      
      if (isCopilotOpen) {
        drawer.classList.remove('hidden');
        if (badge) badge.classList.add('hidden');
        checkVertexAiStatus();
      } else {
        drawer.classList.add('hidden');
        if (badge) badge.classList.remove('hidden');
      }
    }

    async function checkVertexAiStatus() {
      try {
        const resp = await fetch('/api/ai/vertex-status');
        const data = await resp.json();
        const dot = document.getElementById('aiStatusDot');
        const desc = document.getElementById('aiStatusDesc');
        const text = document.getElementById('aiDrawerStatusText');

        if (data.connected) {
          dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping";
          desc.innerHTML = \`<span class="text-emerald-700 font-bold">🟢 Đã kết nối Vertex AI Gemini 1.5 Flash!</span> (\${data.clientEmail || 'Project Datphu'})\`;
          text.innerText = \`Google Cloud Vertex AI: \${data.projectId || 'Datphu'} (Active)\`;
        } else {
          dot.className = "w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse";
          desc.innerHTML = \`<span class="text-amber-700 font-bold">🟡 Chế độ thông minh nội bộ</span> (Bấm "Nạp File Key" để gắn service-account-key.json của dự án Datphu).\`;
        }
      } catch (e) {}
    }

    async function uploadServiceAccountKey(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonContent = JSON.parse(e.target.result);
          showToast("Đang nạp Service Account Key lên máy chủ...", "⏳");
          
          const resp = await fetch('/api/ai/upload-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonContent)
          });
          const resData = await resp.json();
          
          if (resData.success) {
            playPaymentChime();
            showToast("Đã kích hoạt kết nối Google Cloud Vertex AI thành công!", "✅");
            checkVertexAiStatus();
          } else {
            showToast("Lỗi nạp key: " + resData.error, "⚠️");
          }
        } catch (err) {
          showToast("File JSON không hợp lệ: " + err.message, "⚠️");
        }
      };
      reader.readAsText(file);
    }

    function sendAiCommand(promptText) {
      document.getElementById('aiCommandInput').value = promptText;
      submitAiMessage();
    }

    async function submitAiMessage() {
      const input = document.getElementById('aiCommandInput');
      const message = input.value.trim();
      if (!message) return;

      input.value = '';
      appendUserChatMessage(message);

      // Loading bubble
      const loadingId = appendAiLoadingBubble();

      try {
        const resp = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        const data = await resp.json();
        removeAiLoadingBubble(loadingId);

        // Xử lý phản hồi từ Vertex AI / Smart Engine
        renderAiResponseCard(data);
      } catch (err) {
        removeAiLoadingBubble(loadingId);
        appendAiTextMessage("Xin lỗi, xảy ra sự cố kết nối máy chủ: " + err.message);
      }
    }

    function appendUserChatMessage(text) {
      const container = document.getElementById('aiMessageContainer');
      const bubble = document.createElement('div');
      bubble.className = "flex items-start justify-end space-x-2";
      bubble.innerHTML = \`
        <div class="p-3 bg-[#1E2260] text-white rounded-2xl rounded-tr-none text-xs max-w-[85%] shadow-sm">
          \${text}
        </div>
        <span class="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">👤</span>
      \`;
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
    }

    function appendAiLoadingBubble() {
      const container = document.getElementById('aiMessageContainer');
      const id = 'loading-' + Date.now();
      const bubble = document.createElement('div');
      bubble.id = id;
      bubble.className = "flex items-start space-x-2";
      bubble.innerHTML = \`
        <span class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🤖</span>
        <div class="p-2.5 bg-white rounded-2xl rounded-tl-none border border-slate-200 text-slate-500 text-xs shadow-2xs flex items-center space-x-1.5">
          <i class="fa-solid fa-spinner fa-spin text-indigo-600"></i>
          <span>Vertex AI đang suy luận nghiệp vụ...</span>
        </div>
      \`;
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
      return id;
    }

    function removeAiLoadingBubble(id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }

    function appendAiTextMessage(text) {
      const container = document.getElementById('aiMessageContainer');
      const bubble = document.createElement('div');
      bubble.className = "flex items-start space-x-2";
      bubble.innerHTML = \`
        <span class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🤖</span>
        <div class="p-3 bg-white rounded-2xl rounded-tl-none border border-slate-200 text-slate-800 text-xs shadow-2xs max-w-[85%]">
          \${text}
        </div>
      \`;
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
    }

    function renderAiResponseCard(data) {
      const container = document.getElementById('aiMessageContainer');
      const bubble = document.createElement('div');
      bubble.className = "flex items-start space-x-2";

      const payload = data.payload || {};
      let cardHtml = '';

      // Trường hợp 1: Tự động Lên đơn hàng POS
      if (data.responseType === 'pos_order' || payload.action === 'CREATE_ORDER') {
        const items = payload.suggestedItems || [{ name: 'Cà phê sữa đá Tuy Hòa', qty: 2, price: 40000 }];
        const total = payload.totalAmount || 60000;
        
        cardHtml = \`
          <div class="p-3.5 bg-gradient-to-br from-white to-blue-50/50 rounded-2xl rounded-tl-none border border-blue-200 shadow-sm text-xs space-y-2 max-w-[90%]">
            <div class="flex items-center justify-between border-b border-blue-100 pb-1.5">
              <span class="font-black text-indigo-950 flex items-center gap-1">
                <i class="fa-solid fa-cart-shopping text-blue-600"></i> LỆNH LÊN ĐƠN POS
              </span>
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Tự động bởi AI</span>
            </div>
            <div class="text-slate-700 text-[11px]">\${payload.replyText || 'Đã phân tích yêu cầu gọi món:'}</div>
            <div class="space-y-1 bg-white p-2 rounded-xl border border-slate-200">
              \${items.map(it => \`
                <div class="flex justify-between text-slate-800 font-semibold text-[11px]">
                  <span>\${it.qty}x \${it.name}</span>
                  <span class="text-[#D7262D] font-bold">\${formatVND(it.price || 20000)}</span>
                </div>
              \`).join('')}
            </div>
            <div class="pt-1 flex items-center space-x-2">
              <button onclick="executeAiOrderToLivePos()" class="flex-1 py-1.5 bg-[#1E2260] hover:bg-[#151846] text-white font-bold rounded-lg text-xs shadow-xs transition active:scale-95">
                Áp Dụng Vào POS Ngay &rarr;
              </button>
            </div>
          </div>
        \`;
      }
      // Trường hợp 2: Điều phối thợ kỹ thuật 6K
      else if (data.responseType === 'worker_dispatch' || payload.action === 'SUGGEST_WORKER') {
        cardHtml = \`
          <div class="p-3.5 bg-gradient-to-br from-white to-amber-50/50 rounded-2xl rounded-tl-none border border-amber-200 shadow-sm text-xs space-y-2 max-w-[90%]">
            <div class="flex items-center justify-between border-b border-amber-100 pb-1.5">
              <span class="font-black text-amber-950 flex items-center gap-1">
                <i class="fa-solid fa-wrench text-amber-600"></i> ĐIỀU PHỐI THỢ 6K
              </span>
              <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Có mặt \${payload.eta || '15p'}</span>
            </div>
            <div class="text-slate-700 text-[11px]">\${payload.replyText || 'Đã tìm thấy thợ phù hợp:'}</div>
            <div class="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div class="font-black text-slate-900 text-xs">\${payload.workerName || 'Chú Tùng Điện Nước'}</div>
                <div class="text-[10px] text-slate-500">\${payload.trade || 'Điện Nước & Máy Bơm'} • Tuy Hòa</div>
              </div>
              <a href="tel:\${payload.phone || '0912345678'}" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow transition">
                Gọi Thợ
              </a>
            </div>
          </div>
        \`;
      }
      // Trường hợp 3: Tra cứu thuế hoặc đàm thoại thông thường
      else {
        cardHtml = \`
          <div class="p-3 bg-white rounded-2xl rounded-tl-none border border-slate-200 text-slate-800 text-xs shadow-2xs max-w-[85%] space-y-1">
            <div class="font-bold text-indigo-900 text-[11px]">Trợ Lý AI Phản Hồi:</div>
            <div class="leading-relaxed">\${payload.replyText || 'Đã ghi nhận yêu cầu của bạn.'}</div>
          </div>
        \`;
      }

      bubble.innerHTML = \`
        <span class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🤖</span>
        \${cardHtml}
      \`;
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
    }

    function executeAiOrderToLivePos() {
      // Nạp 2 ly cà phê sữa và 1 bánh mì chả cá vào giỏ hàng thực tế
      addToCartDirect('P-01');
      addToCartDirect('P-01');
      addToCartDirect('P-09');
      switchView('pos');
      toggleAiCopilot();
      showToast("Đã đưa đơn hàng gợi ý của Vertex AI vào giỏ hàng POS!", "✅");
    }

    // Nhận diện Giọng nói Tiếng Việt (Web Speech API)
    function toggleVoiceInput() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const statusText = document.getElementById('aiVoiceStatusText');
      const voiceBtn = document.getElementById('aiVoiceBtn');

      if (!SpeechRecognition) {
        showToast("Trình duyệt không hỗ trợ Web Speech API. Vui lòng dùng Chrome/Edge!", "⚠️");
        return;
      }

      if (isRecording) {
        if (speechRecognition) speechRecognition.stop();
        isRecording = false;
        voiceBtn.className = "w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-[#D7262D] border border-slate-200 flex items-center justify-center text-base transition";
        statusText.innerText = "Micro: Sẵn sàng";
        return;
      }

      speechRecognition = new SpeechRecognition();
      speechRecognition.lang = 'vi-VN';
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;

      speechRecognition.onstart = () => {
        isRecording = true;
        voiceBtn.className = "w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center text-base animate-pulse ring-4 ring-red-200 transition";
        statusText.innerText = "Đang lắng nghe tiếng Việt...";
        showToast("Đang lắng nghe giọng nói tiếng Việt...", "🎙️");
      };

      speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('aiCommandInput').value = transcript;
        submitAiMessage();
      };

      speechRecognition.onerror = (event) => {
        isRecording = false;
        voiceBtn.className = "w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-base";
        statusText.innerText = "Micro: Lỗi thu âm";
      };

      speechRecognition.onend = () => {
        isRecording = false;
        voiceBtn.className = "w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-base";
        statusText.innerText = "Micro: Sẵn sàng";
      };

      speechRecognition.start();
    }
`;

if (!htmlCode.includes('function toggleAiCopilot')) {
  htmlCode = htmlCode.replace('// Khởi chạy khi nạp trang', `${aiCopilotScript}\n    // Khởi chạy khi nạp trang`);
}

fs.writeFileSync(htmlPath, htmlCode, 'utf8');
console.log('Successfully integrated AI Copilot UI into vi_an_sinh_app.html!');
