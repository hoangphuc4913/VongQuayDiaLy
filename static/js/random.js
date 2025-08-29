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
let currentMode = "quiz"; // "quiz" -> quay chọn quiz, "question" -> quay chọn câu hỏi
let selectedQuiz = null;

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
  sb.innerHTML = gameState.players.map((p,i) =>
    `<div class="d-inline-flex align-items-center border rounded px-2 py-1 me-2 mb-2 ${i===gameState.currentPlayerIndex?'bg-warning-subtle':''}">
       <strong>${p.name}</strong>
       <span class="ms-2 badge bg-dark">${p.score}</span>
     </div>`).join('');
}

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
  // Sau khi trả lời xong → quay lại mode quiz
  currentMode = "quiz";
  drawWheel(allQuizzes.map(q => q.name));
}

async function fetchQuizzes() {
  const res = await fetch(`${API_BASE_URL}/api/quizzes`);
  allQuizzes = await res.json();
  drawWheel(allQuizzes.map(q => q.name));
}

async function fetchQuestions(quizId) {
  const res = await fetch(`${API_BASE_URL}/api/questions/${quizId}`);
  const data = await res.json();
  currentQuestions = data;
  drawWheel(data.map((q,i)=>`Q${i+1}`));
}

function drawWheel(labels) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const n = labels.length;
  const arc = (2 * Math.PI) / n;
  for (let i = 0; i < n; i++) {
    const start = angle + i * arc;
    ctx.beginPath();
    ctx.fillStyle = i % 2 === 0 ? "#ffcc66" : "#66ccff";
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, WHEEL_RADIUS, start, start + arc);
    ctx.closePath();
    ctx.fill();
    // Text
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(start + arc/2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.fillText(labels[i], WHEEL_RADIUS - 10, 5);
    ctx.restore();
  }
}

// Tính kết quả dựa trên kim chỉ ở trên cùng
function pickResult(labels) {
  const n = labels.length;
  const arc = (2 * Math.PI) / n;
  let selected = Math.floor(((angle % (2 * Math.PI)) / arc));
  selected = (n - selected) % n; // đảo để trúng phần ở 12h
  return selected;
}

function spinWheel() {
  if (spinning) return;
  spinning = true;
  let spins = Math.random() * 5 + 5; // quay 5-10 vòng
  let finalAngle = angle + spins * 2 * Math.PI;
  let duration = 4000;
  let start = null;

  function animate(ts) {
    if (!start) start = ts;
    let progress = ts - start;
    let t = Math.min(progress / duration, 1);
    let eased = 1 - Math.pow(1 - t, 3); // easing out
    angle = finalAngle * eased;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (currentMode === "quiz") {
      drawWheel(allQuizzes.map(q=>q.name));
    } else {
      drawWheel(currentQuestions.map((q,i)=>`Q${i+1}`));
    }
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      let idx;
      if (currentMode === "quiz") {
        idx = pickResult(allQuizzes.map(q=>q.name));
        selectedQuiz = allQuizzes[idx];
        currentMode = "question";
        fetchQuestions(selectedQuiz.id);
      } else {
        idx = pickResult(currentQuestions.map((q,i)=>`Q${i+1}`));
        showQuestion(idx);
      }
    }
  }
  requestAnimationFrame(animate);
}

function showQuestion(index) {
  const question = currentQuestions[index];
  const popup = document.getElementById("popup");
  popup.classList.add("active");

  const content = document.getElementById("popup-content");
  content.innerHTML = `<h5>${question.question_text}</h5>`;

  if (question.question_type === "mcq" || question.question_type === "true_false") {
    for (let key in question.options) {
      content.innerHTML += `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="answer" value="${key}">
          <label class="form-check-label">${key}: ${question.options[key]}</label>
        </div>`;
    }
  } else {
    content.innerHTML += `<input type="text" class="form-control" id="note-answer">`;
  }
  content.innerHTML += `<button class="btn btn-success mt-2" onclick="checkAnswer(${index})">Check</button>`;
}

function checkAnswer(index) {
  const q = currentQuestions[index];
  let isCorrect = false;
  if (q.question_type === "note") {
    const val = document.getElementById("note-answer").value.trim().toLowerCase();
    const valid = q.correct_answer.toLowerCase().split(",").map(s=>s.trim());
    isCorrect = valid.includes(val);
  } else {
    const sel = document.querySelector('input[name="answer"]:checked');
    if (sel && sel.value === q.correct_answer) isCorrect = true;
  }
  alert(isCorrect ? "✅ Correct!" : "❌ Wrong!");
  document.getElementById("popup").classList.remove("active");
  awardAndAdvance(isCorrect);
}

window.onload = async function() {
  initGameState();
  await fetchQuizzes();
  document.getElementById("spinBtn").onclick = spinWheel;
};