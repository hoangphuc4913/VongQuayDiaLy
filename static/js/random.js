const API_BASE_URL = '';
let gameState = null;

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const WHEEL_RADIUS = 250;
const CENTER = 250;
let angle = 0;
let spinning = false;

// Data
let allQuizzes = [];
let currentQuestions = [];
let currentMode = "quiz";
let selectedQuiz = null;


/* ============================================================
   1) KHỞI TẠO GAME
============================================================ */
function initGameState() {
  const raw = sessionStorage.getItem("quizGameState");
  if (!raw) { window.location.href = "/home"; return; }
  gameState = JSON.parse(raw);
  renderHeader();
}

function renderHeader() {
  document.getElementById('currentPlayerName').textContent =
    gameState.players[gameState.currentPlayerIndex].name;

  document.getElementById('roundInfo').textContent =
    `${gameState.currentRound}/${gameState.totalRounds}`;

  const sb = document.getElementById('scoreboard');
  sb.innerHTML = gameState.players.map((p, i) =>
    `<div class="d-inline-flex align-items-center border rounded px-2 py-1 me-2 mb-2 ${i === gameState.currentPlayerIndex ? 'bg-warning-subtle' : ''}">
       <strong>${p.name}</strong>
       <span class="ms-2 badge bg-dark">${p.score}</span>
     </div>`).join('');
}


/* ============================================================
   2) CHUYỂN LƯỢT & HOÀN THÀNH GAME
============================================================ */
function awardAndAdvance(isCorrect) {
  if (isCorrect) gameState.players[gameState.currentPlayerIndex].score++;

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
  currentMode = "quiz";
  drawWheel(distributeSpecialSlots(allQuizzes.map(q => q.name)));
}


/* ============================================================
   3) API
============================================================ */
async function fetchQuizzes() {
  const res = await fetch(`${API_BASE_URL}/api/quizzes`);
  allQuizzes = await res.json();

  const arranged = distributeSpecialSlots(allQuizzes.map(q => q.name));
  drawWheel(arranged);
}

async function fetchQuestions(quizId) {
  const res = await fetch(`${API_BASE_URL}/api/questions/${quizId}`);
  currentQuestions = await res.json();

  const labels = currentQuestions.map((q, i) => `Câu ${i + 1}`);
  const arranged = distributeSpecialSlots(labels);

  drawWheel(arranged);
}


/* ============================================================
   4) PHÂN BỐ Ô ĐẶC BIỆT CÁCH ĐỀU
============================================================ */
function distributeSpecialSlots(labels) {
  const specials = labels.filter(txt => txt.includes("+") || txt.includes("-"));

  if (specials.length === 0) return labels;

  const n = labels.length;
  const s = specials.length;

  const step = Math.floor(n / s);
  const result = Array(n).fill(null);

  let used = new Set();
  let positions = [];

  for (let i = 0; i < s; i++) {
    positions.push((i * step) % n);
  }

  specials.forEach((sp, idx) => {
    result[positions[idx]] = sp;
    used.add(sp);
  });

  let normalIdx = 0;

  labels.forEach(lbl => {
    if (!used.has(lbl)) {
      while (result[normalIdx] !== null) normalIdx++;
      result[normalIdx] = lbl;
    }
  });

  return result;
}


/* ============================================================
   5) VẼ VÒNG QUAY
============================================================ */
function drawWheel(labels) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const n = labels.length;
  const arc = (2 * Math.PI) / n;

  for (let i = 0; i < n; i++) {
    const start = angle + i * arc;

    ctx.beginPath();
    ctx.fillStyle =
      (i % 3 === 0) ? "#ffcc66" :
      (i % 3 === 1) ? "#66ccff" :
                      "green";

    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, WHEEL_RADIUS, start, start + arc);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.fillText(labels[i], WHEEL_RADIUS - 10, 5);
    ctx.restore();
  }
}


/* ============================================================
   6) TÍNH Ô TRÚNG
============================================================ */
function pickResult(labels) {
  const n = labels.length;
  const arc = (2 * Math.PI) / n;
  let adjustedAngle = (angle + 2 * Math.PI) % (2 * Math.PI) + arc;
  let selected = Math.floor(adjustedAngle / arc);
  return (n - selected) % n;
}


/* ============================================================
   7) QUAY VÒNG
============================================================ */
function spinWheel() {
  if (spinning) return;
  spinning = true;

  let spins = Math.random() * 5 + 5;
  let finalAngle = angle + spins * 2 * Math.PI;
  let duration = 4000;
  let start = null;

  const labelEl = document.getElementById("selectedQuizName");

  function animate(ts) {
    if (!start) start = ts;
    let progress = ts - start;
    let t = Math.min(progress / duration, 1);
    angle = finalAngle * (1 - Math.pow(1 - t, 3));

    if (currentMode === "quiz") {
      const arranged = distributeSpecialSlots(allQuizzes.map(q => q.name));
      drawWheel(arranged);
      labelEl.style.display = "none";
    } else {
      const arranged = distributeSpecialSlots(currentQuestions.map((q, i) => `Câu ${i + 1}`));
      drawWheel(arranged);
      labelEl.style.display = "block";
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      handleSpinResult(labelEl);
    }
  }

  requestAnimationFrame(animate);
}


function handleSpinResult(labelEl) {
  let idx;

  if (currentMode === "quiz") {
    const arranged = distributeSpecialSlots(allQuizzes.map(q => q.name));
    idx = pickResult(arranged);
    selectedQuiz = allQuizzes.find(q => q.name === arranged[idx]);

    labelEl.textContent = selectedQuiz.name === "Bất ngờ chưa!"
      ? "Bất ngờ chưa!"
      : `Tỉnh thành được chọn: ${selectedQuiz.name}`;

    labelEl.style.display = "block";

    setTimeout(() => {
      currentMode = "question";
      fetchQuestions(selectedQuiz.id);
    }, 1500);

  } else {
    const arranged = distributeSpecialSlots(currentQuestions.map((q, i) => `Câu ${i + 1}`));
    idx = pickResult(arranged);
    showQuestion(idx);
  }
}


/* ============================================================
   8) POPUP CÂU HỎI
============================================================ */
function showQuestion(index) {
  const question = currentQuestions[index];
  const popup = document.getElementById("popup");
  popup.classList.add("active");

  const content = document.getElementById("popup-content");

  // SPECIAL +/- VALUE
  const match = question.question_text.match(/([+-]\d+)/);
  if (match) {
    const value = parseInt(match[1]);
    let color = value > 0 ? "text-success" : "text-danger";
    let msg = value > 0 ? `+${value} điểm!` : `${value} điểm!`;

    content.innerHTML = `
      <h3 class="${color}">${msg}</h3>
      <p>${question.question_text}</p>
      <button class="btn btn-primary mt-3" onclick="specialPlus(${value})">OK</button>
    `;
    return;
  }

  // CÂU HỎI THƯỜNG
  content.innerHTML = `<h5>${question.question_text}</h5>`;

  if (question.question_type === "mcq" || question.question_type === "true_false") {
    for (let key in question.options) {
      content.innerHTML += `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="answer" value="${key}">
          <label class="form-check-label">${key}: ${question.options[key]}</label>
        </div>
      `;
    }
  } else {
    content.innerHTML += `<input type="text" class="form-control" id="note-answer">`;
  }

  content.innerHTML += `
    <button class="btn btn-success mt-2" onclick="checkAnswer(${index})">Check</button>
  `;
}


/* ============================================================
   9) CHECK ĐÁP ÁN
============================================================ */
function checkAnswer(index) {
  const q = currentQuestions[index];
  let isCorrect = false;

  if (q.question_type === "note") {
    const val = document.getElementById("note-answer").value.trim().toLowerCase();
    const valid = q.correct_answer.toLowerCase().split(",").map(s => s.trim());
    isCorrect = valid.includes(val);
  } else {
    const sel = document.querySelector('input[name="answer"]:checked');
    if (sel && sel.value === q.correct_answer) isCorrect = true;
  }

  alert(isCorrect ? "✅ Đúng rồi!" : "❌ Sai rồi!");
  document.getElementById("popup").classList.remove("active");
  awardAndAdvance(isCorrect);
}


/* ============================================================
   10) SPECIAL +/- ĐIỂM
============================================================ */
function specialPlus(value) {
  document.getElementById("popup").classList.remove("active");

  gameState.players[gameState.currentPlayerIndex].score += value;

  awardAndAdvance(false);
}


/* ============================================================
   READY
============================================================ */
window.onload = async function () {
  initGameState();
  await fetchQuizzes();
  document.getElementById("spinBtn").onclick = spinWheel;
};
