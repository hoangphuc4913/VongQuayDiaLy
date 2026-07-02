let currentQuestions = [];
const API_BASE_URL = '';
let gameState = null;

function initGameState() {
    const raw = sessionStorage.getItem("quizGameState");
    if (!raw) {
        alert("Chưa có dữ liệu game!");
        window.location.href = "/home";
        return;
    }
    gameState = JSON.parse(raw);
    renderHeader();
}

function renderHeader() {
    document.getElementById('currentPlayerName').textContent =
        gameState.players[gameState.currentPlayerIndex].name;
    document.getElementById('roundInfo').textContent =
        `${gameState.currentRound}/${gameState.totalRounds}`;

    const sb = document.getElementById('scoreboard');
    sb.innerHTML = gameState.players.map((p, i) => {
        const highlight = i === gameState.currentPlayerIndex ? 'bg-warning-subtle' : '';
        return `<div class="d-inline-flex align-items-center border rounded px-2 py-1 me-2 mb-2 ${highlight}">
                  <strong>${p.name}</strong>
                  <span class="ms-2 badge text-bg-dark">${p.score}</span>
                </div>`;
    }).join('');
}

function awardAndAdvance(isCorrect, score = 1) {
    if (isCorrect) gameState.players[gameState.currentPlayerIndex].score += score;
    gameState.currentPlayerIndex++;
    if (gameState.currentPlayerIndex >= gameState.players.length) {
        gameState.currentPlayerIndex = 0;
        gameState.currentRound++;
        if (gameState.currentRound > gameState.totalRounds) {
            sessionStorage.setItem("quizResult", JSON.stringify(gameState.players));
            window.location.href = "/result";
            return;
        }
    }
    renderHeader();
}

function fetchQuizzes() {
    fetch(`${API_BASE_URL}/api/quizzes`)
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("button-container");
            container.innerHTML = "";
            data.forEach(quiz => {
                const btn = document.createElement("button");
                btn.className = "btn btn-primary btn-quiz";
                btn.innerText = quiz.name;
                btn.onclick = () => loadQuiz(quiz.id, quiz.name);
                container.appendChild(btn);
            });
        });
}

function loadQuiz(quizId, quizName) {
    // NẾU quay trúng ô đặc biệt ở VÒNG QUAY TỈNH THÀNH
    if (quizName.includes("+") || quizName.includes("-")) {
        const match = quizName.match(/([+-]\d+)/);
        if (match) {
            const value = parseInt(match[1]);
            awardAndAdvance(true, value);
            return;
        }
    }

    fetch(`${API_BASE_URL}/api/questions/${quizId}`)
        .then(res => res.json())
        .then(data => {
            currentQuestions = data;
            const container = document.getElementById("button-container");
            container.innerHTML = "";

            for (let i = 0; i < data.length; i++) {
                const btn = document.createElement("button");
                btn.className = "btn btn-outline-secondary btn-quiz";
                btn.innerText = "Câu " + (i + 1);
                btn.onclick = () => showQuestion(i);
                container.appendChild(btn);
            }

            // 👉 Thêm nút Back
            const backBtn = document.createElement("button");
            backBtn.className = "btn btn-danger btn-quiz";
            backBtn.innerText = "Quay lại";
            backBtn.onclick = fetchQuizzes;   // quay lại danh sách quiz
            container.appendChild(backBtn);
        });
}

function showQuestion(index) {
    const question = currentQuestions[index];
    const popup = document.getElementById("popup");
    popup.classList.add("active");
    const content = document.getElementById("popup-content");
    let html = "";

    // ======================
    // Ảnh câu hỏi
    // ======================
    if(question.question_image){
        html += `
        <div style="text-align:center;margin-bottom:15px;">
            <img
                src="/static/${question.question_image}"
                style="
                    max-width:100%;
                    max-height:260px;
                    object-fit:contain;
                    border-radius:10px;
                    border:1px solid #ccc;">
        </div>
        `;
    }
    // ======================
    // Nội dung câu hỏi
    // ======================
    if(question.question_text){
        html += `<h5>${question.question_text}</h5>`;
    }

    // ======================
    // MCQ
    // ======================
    if(question.question_type==="mcq" || question.question_type==="question_img"){
        for(const key in question.options){
            html += `
            <div class="form-check">
                <input
                    class="form-check-input"
                    type="radio"
                    name="answer"
                    value="${key}">

                <label class="form-check-label">
                    ${key}: ${question.options[key]}
                </label>

            </div>
            `;
        }
    }

    // ======================
    // Đúng Sai
    // ======================
    else if(question.question_type==="true_false"){
        for(const key in question.options){
            html += `
            <div class="form-check">
                <input
                    class="form-check-input"
                    type="radio"
                    name="answer"
                    value="${key}">
                <label class="form-check-label">
                    ${question.options[key]}
                </label>

            </div>
            `;
        }
    }

    // ======================
    // Answer Image
    // ======================
    else if(question.question_type==="ans_img"){
        html += `<div class="row g-3">`;
        ["A","B","C","D"].forEach(letter=>{
            const path=question[`option_${letter.toLowerCase()}_image`];
            html += `
            <div class="col-6 text-center">
                <input
                    type="radio"
                    class="btn-check"
                    name="answer"
                    id="ans${letter}"
                    value="${letter}">
                <label
                    class="btn btn-outline-secondary w-100"
                    for="ans${letter}">
                    <img
                        src="/static/${path}"
                        style="
                            width:120px;
                            height:120px;
                            object-fit:contain;">
                </label>
            </div>
            `;
        });
        html += `</div>`;
    }

    // ======================
    // Note
    // ======================

    else{
        html += `
        <input
            id="note-answer"
            class="form-control">
        `;
    }
    html += `
    <button
        class="btn btn-success mt-3"
        onclick="checkAnswer(${index})">
        Kiểm tra
    </button>
    `;
    content.innerHTML=html;
}

function checkAnswer(index){
    const q=currentQuestions[index];
    let isCorrect=false;
    if(q.question_type==="note"){
        const val=document
            .getElementById("note-answer")
            .value
            .trim()
            .toLowerCase();
        const valid=q.correct_answer
            .toLowerCase()
            .split(",")
            .map(x=>x.trim());
        isCorrect=valid.includes(val);
    }
    else{
        const sel=document.querySelector(
            'input[name="answer"]:checked'
        );
        if(sel){
            isCorrect=sel.value===q.correct_answer;
        }

    }
    alert(isCorrect ? "✅ Đúng rồi!" : "❌ Sai rồi!");
    document
        .getElementById("popup")
        .classList
        .remove("active");
    awardAndAdvance(isCorrect);
}

// ================== QR SCAN ==================
let qrScanner = null;
let qrIsRunning = false;

function openQrScanner() {
    const modal = document.getElementById('qr-modal');
    modal.classList.add('active');
    if (qrIsRunning) return;

    qrScanner = new Html5Qrcode("qr-reader");
    qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            processQrText(decodedText);
        }
    ).then(() => {
        qrIsRunning = true;
    }).catch(err => {
        alert("Không mở được camera: " + err);
        closeQrScanner();
    });
}

function processQrText(text) {
    const payload = (text || "").trim().toLowerCase();
    const buttons = document.querySelectorAll('#button-container button');
    for (const btn of buttons) {
        if (btn.innerText.trim().toLowerCase().includes(payload)) {
            btn.click();
            break;
        }
    }
    closeQrScanner();
}

function closeQrScanner() {
    const modal = document.getElementById('qr-modal');
    modal.classList.remove('active');
    if (qrScanner && qrIsRunning) {
        qrScanner.stop().then(() => {
            qrScanner.clear();
            qrScanner = null;
            qrIsRunning = false;
        });
    }
}

window.onload = function () {
    initGameState();
    fetchQuizzes();
};
