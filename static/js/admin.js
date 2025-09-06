const API_BASE_URL = "";
let selectedQuiz = null;
let editingQuizId = null;
let editingQuestionId = null;

let questionModal;
let editQModal;
let viewQuestionsModal;

window.addEventListener("DOMContentLoaded", () => {
  questionModal = new bootstrap.Modal(document.getElementById("questionModal"));
  editQModal = new bootstrap.Modal(document.getElementById("editQuestionModal"));
  viewQuestionsModal = new bootstrap.Modal(document.getElementById("viewQuestionsModal"));
  loadQuizzes();
});

// ----------------- QUIZZES -----------------
async function loadQuizzes() {
  const res = await fetch(`${API_BASE_URL}/api/quizzes`);
  const quizzes = await res.json();
  const list = document.getElementById("quizList");
  list.innerHTML = "";
  quizzes.forEach(q => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
      <span>${q.name}</span>
      <div>
        <button class="btn btn-sm btn-outline-info" onclick="selectQuiz(${q.id}, '${q.name}')">Câu hỏi</button>
        <button class="btn btn-sm btn-outline-warning" onclick="editQuiz(${q.id}, '${q.name}')">Sửa</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteQuiz(${q.id})">Xóa</button>
      </div>`;
    list.appendChild(li);
  });
}

function showAddQuiz() {
  new bootstrap.Modal(document.getElementById("quizModal")).show();
}

async function addQuiz() {
  const name = document.getElementById("quizName").value;
  await fetch(`${API_BASE_URL}/api/quizzes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  bootstrap.Modal.getInstance(document.getElementById("quizModal")).hide();
  document.activeElement.blur();
  loadQuizzes();
}

function editQuiz(id, name) {
  editingQuizId = id;
  document.getElementById("editQuizName").value = name;
  new bootstrap.Modal(document.getElementById("editQuizModal")).show();
}

async function updateQuiz() {
  const name = document.getElementById("editQuizName").value;
  await fetch(`${API_BASE_URL}/api/quizzes/${editingQuizId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  bootstrap.Modal.getInstance(document.getElementById("editQuizModal")).hide();
  document.activeElement.blur();
  loadQuizzes();
}

async function deleteQuiz(id) {
  if (!confirm("Xóa quiz này?")) return;
  await fetch(`${API_BASE_URL}/api/quizzes/${id}`, { method: "DELETE" });
  loadQuizzes();
}

// ----------------- QUESTIONS -----------------
async function selectQuiz(id, name) {
  selectedQuiz = id;
  document.getElementById("viewQuizName").textContent = name;
  await refreshQuestionList();
  viewQuestionsModal.show();
}

function showAddQuestion() {
  document.getElementById("qText").value = "";
  document.getElementById("correctAnswer").value = "";
  document.getElementById("qType").value = "mcq";
  renderOptionsByType();
  questionModal.show();
}

function renderOptionsByType() {
  const type = document.getElementById("qType").value;
  const box = document.getElementById("optionsBox");
  box.innerHTML = "";
  if (type === "mcq") {
    ["A","B","C","D"].forEach(letter => {
      const div = document.createElement("div");
      div.className = "input-group mb-2";
      div.innerHTML = `
        <span class="input-group-text">${letter}</span>
        <input type="text" class="form-control optionInput">
      `;
      box.appendChild(div);
    });
  } else if (type === "true_false") {
    box.innerHTML = `
      <div class="input-group mb-2">
        <span class="input-group-text">A</span>
        <input type="text" class="form-control optionInput" value="True">
      </div>
      <div class="input-group mb-2">
        <span class="input-group-text">B</span>
        <input type="text" class="form-control optionInput" value="False">
      </div>
    `;
  } else {
    box.innerHTML = `<p class="text-muted">Loại này không có lựa chọn, người chơi nhập tự do.</p>`;
  }
}

async function addQuestion() {
  const text = document.getElementById("qText").value;
  const type = document.getElementById("qType").value;
  let options = null;
  if (type !== "note") {
    const optionInputs = document.querySelectorAll(".optionInput");
    options = {};
    optionInputs.forEach((inp, idx) => {
      options[String.fromCharCode(65+idx)] = inp.value;
    });
  }
  const correct = document.getElementById("correctAnswer").value;

  await fetch(`${API_BASE_URL}/api/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quiz_id: selectedQuiz,
      question_text: text,
      question_type: type,
      options,
      correct_answer: correct
    })
  });

  questionModal.hide();
  document.activeElement.blur();
  refreshQuestionList();
}

async function editQuestion(id) {
  editingQuestionId = id;
  const res = await fetch(`${API_BASE_URL}/api/question/${id}`);
  const q = await res.json();
  document.getElementById("editQText").value = q.question_text || q.question || "";
  document.getElementById("editQType").value = q.question_type || "mcq";
  renderEditOptionsByType(q.options);
  document.getElementById("editCorrectAnswer").value = q.correct_answer || "";
  editQModal.show();
}

function renderEditOptionsByType(existingOptions=null) {
  const type = document.getElementById("editQType").value;
  const box = document.getElementById("editOptionsBox");
  box.innerHTML = "";
  if (type === "mcq") {
    ["A","B","C","D"].forEach(letter => {
      const value = existingOptions ? existingOptions[letter] || "" : "";
      const div = document.createElement("div");
      div.className = "input-group mb-2";
      div.innerHTML = `
        <span class="input-group-text">${letter}</span>
        <input type="text" class="form-control editOptionInput" data-key="${letter}" value="${value}">
      `;
      box.appendChild(div);
    });
  } else if (type === "true_false") {
    const trueVal = existingOptions ? existingOptions["A"] || "True" : "True";
    const falseVal = existingOptions ? existingOptions["B"] || "False" : "False";
    box.innerHTML = `
      <div class="input-group mb-2">
        <span class="input-group-text">A</span>
        <input type="text" class="form-control editOptionInput" data-key="A" value="${trueVal}">
      </div>
      <div class="input-group mb-2">
        <span class="input-group-text">B</span>
        <input type="text" class="form-control editOptionInput" data-key="B" value="${falseVal}">
      </div>
    `;
  } else {
    box.innerHTML = `<p class="text-muted">Loại này không có lựa chọn, người chơi nhập tự do.</p>`;
  }
}

async function updateQuestion() {
  const text = document.getElementById("editQText").value;
  const type = document.getElementById("editQType").value;
  let options = null;
  if (type !== "note") {
    const optionInputs = document.querySelectorAll(".editOptionInput");
    options = {};
    optionInputs.forEach(inp => {
      options[inp.dataset.key] = inp.value;
    });
  }
  const correct = document.getElementById("editCorrectAnswer").value;

  await fetch(`${API_BASE_URL}/api/questions/${editingQuestionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question_text: text,
      question_type: type,
      options,
      correct_answer: correct
    })
  });

  editQModal.hide();
  document.activeElement.blur();
  refreshQuestionList();
}

async function deleteQuestion(id) {
  if (!confirm("Xóa câu hỏi này?")) return;
  await fetch(`${API_BASE_URL}/api/questions/${id}`, { method: "DELETE" });
  refreshQuestionList();
}

async function refreshQuestionList() {
  if (!selectedQuiz) return;
  const res = await fetch(`${API_BASE_URL}/api/questions/${selectedQuiz}`);
  const questions = await res.json();
  const list = document.getElementById("viewQuestionList");
  list.innerHTML = "";
  questions.forEach((q, idx) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-start";
    li.innerHTML = `
      <div>
        <strong>${idx + 1}.</strong> ${q.question_text || q.question}
        <br><small>Loại: ${q.question_type}</small>
        <br><small>Đáp án đúng: <b>${q.correct_answer}</b></small>
      </div>
      <div>
        <button class="btn btn-sm btn-outline-warning" onclick="editQuestion(${q.id})">Sửa</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteQuestion(${q.id})">Xóa</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// ----------------- Helper -----------------
async function saveToGithub() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/save_quiz_file`, { method: "POST" });
    const data = await res.json();
    console.log("✅ Commit kết quả:", data);
    return data.status;
  } catch (err) {
    console.error("❌ Lỗi commit GitHub:", err);
    return "fail";
  }
}

document.getElementById("saveBtn").addEventListener("click", function(){
  this.style.opacity = 0.5;
  let status = saveToGithub();
  if (status == "live"){
    alert("Lưu thành công ✅")
  } else if (status == "cancelled"){
    alert("Lưu bị hủy. Thử lưu lại sau vài phút. ⚠️")
  } else {
    alert("Lưu thất bại ❌")
  }
  this.style.opacity = 1;
});