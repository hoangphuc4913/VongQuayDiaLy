const API_BASE_URL = "";
let selectedQuiz = null;
let editingQuizId = null;
let editingQuestionId = null;

// Load quizzes
async function loadQuizzes() {
  const res = await fetch(`${API_BASE_URL}/api/quizzes`);
  const quizzes = await res.json();
  const list = document.getElementById("quizList");
  list.innerHTML = "";
  quizzes.forEach(q => {
    const li = document.createElement("li");
    li.className = "list-group-item";
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

// Show add quiz modal
function showAddQuiz() {
  new bootstrap.Modal(document.getElementById("quizModal")).show();
}

// Add quiz
async function addQuiz() {
  const name = document.getElementById("quizName").value;
  await fetch(`${API_BASE_URL}/api/quizzes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  bootstrap.Modal.getInstance(document.getElementById("quizModal")).hide();
  loadQuizzes();
}

// Edit quiz
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
  loadQuizzes();
}

// Delete quiz
async function deleteQuiz(id) {
  if (!confirm("Xóa quiz này?")) return;
  await fetch(`${API_BASE_URL}/api/quizzes/${id}`, { method: "DELETE" });
  loadQuizzes();
}

// Select quiz
async function selectQuiz(id, name) {
  selectedQuiz = id;
  document.getElementById("selectedQuizName").textContent = name;
  document.getElementById("addQuestionBtn").disabled = false;
  document.getElementById("addQuestionBtn").onclick = showAddQuestion;
  const res = await fetch(`${API_BASE_URL}/api/questions/${id}`);
  const questions = await res.json();
  const list = document.getElementById("questionList");
  console.log("Questions loaded:", questions);
  list.innerHTML = "";
  questions.forEach((q, idx) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `
      <span>${idx+1}. ${q.question_text}</span>
      <div>
        <button class="btn btn-sm btn-outline-warning" onclick="editQuestion(${q.id})">Sửa</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteQuestion(${q.id})">Xóa</button>
      </div>`;
    list.appendChild(li);
  });
}

// Show add question modal
function showAddQuestion() {
  document.getElementById("optionsBox").innerHTML = "";
  addOptionField();
  new bootstrap.Modal(document.getElementById("questionModal")).show();
}

// Add option input
let optionCount = 0;
function addOptionField() {
  optionCount++;
  const div = document.createElement("div");
  div.className = "input-group mb-2";
  div.innerHTML = `
    <span class="input-group-text">${String.fromCharCode(64+optionCount)}</span>
    <input type="text" class="form-control optionInput">
  `;
  document.getElementById("optionsBox").appendChild(div);
}

// Add question
async function addQuestion() {
  const text = document.getElementById("qText").value;
  const optionInputs = document.querySelectorAll(".optionInput");
  let options = {};
  optionInputs.forEach((inp, idx) => {
    options[String.fromCharCode(65+idx)] = inp.value;
  });
  const correct = document.getElementById("correctAnswer").value;
  await fetch(`${API_BASE_URL}/api/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quiz_id: selectedQuiz,
      question_text: text,
      question_type: "mcq",
      options,
      correct_answer: correct
    })
  });
  bootstrap.Modal.getInstance(document.getElementById("questionModal")).hide();
  selectQuiz(selectedQuiz, document.getElementById("selectedQuizName").textContent);
}

// Edit question
async function editQuestion(id) {
  editingQuestionId = id;
  const res = await fetch(`${API_BASE_URL}/api/question/${id}`);
  const q = await res.json();
  document.getElementById("editQText").value = q.question_text;
  document.getElementById("editOptionsBox").innerHTML = "";
  Object.entries(q.options).forEach(([key,val]) => {
    const div = document.createElement("div");
    div.className = "input-group mb-2";
    div.innerHTML = `
      <span class="input-group-text">${key}</span>
      <input type="text" class="form-control editOptionInput" data-key="${key}" value="${val}">
    `;
    document.getElementById("editOptionsBox").appendChild(div);
  });
  document.getElementById("editCorrectAnswer").value = q.correct_answer;
  new bootstrap.Modal(document.getElementById("editQuestionModal")).show();
}

async function updateQuestion() {
  const text = document.getElementById("editQText").value;
  const optionInputs = document.querySelectorAll(".editOptionInput");
  let options = {};
  optionInputs.forEach(inp => {
    options[inp.dataset.key] = inp.value;
  });
  const correct = document.getElementById("editCorrectAnswer").value;
  await fetch(`${API_BASE_URL}/api/questions/${editingQuestionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question_text: text,
      question_type: "mcq",
      options,
      correct_answer: correct
    })
  });
  bootstrap.Modal.getInstance(document.getElementById("editQuestionModal")).hide();
  selectQuiz(selectedQuiz, document.getElementById("selectedQuizName").textContent);
}

// Delete question
async function deleteQuestion(id) {
  if (!confirm("Xóa câu hỏi này?")) return;
  await fetch(`${API_BASE_URL}/api/questions/${id}`, { method: "DELETE" });
  selectQuiz(selectedQuiz, document.getElementById("selectedQuizName").textContent);
}

window.onload = loadQuizzes;
