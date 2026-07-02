const API_BASE_URL = "";
let selectedQuiz = null;
let editingQuizId = null;
let editingQuestionId = null;
let questionImage = "";
let optionAImagePath = "";
let optionBImagePath = "";
let optionCImagePath = "";
let optionDImagePath = "";

let questionModal;
let editQModal;
let viewQuestionsModal;

window.addEventListener("DOMContentLoaded", () => {
    const questionModalEl = document.getElementById("questionModal");
    if (questionModalEl) {
        questionModal = new bootstrap.Modal(questionModalEl);
    }
    const editQuestionModalEl = document.getElementById("editQuestionModal");
    if (editQuestionModalEl) {
        editQModal = new bootstrap.Modal(editQuestionModalEl);
    }
    const viewQuestionsModalEl = document.getElementById("viewQuestionsModal");
    if (viewQuestionsModalEl) {
        viewQuestionsModal = new bootstrap.Modal(viewQuestionsModalEl);
    }
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
  questionImage="";
  optionAImagePath="";
  optionBImagePath="";
  optionCImagePath="";
  optionDImagePath="";
  document.getElementById("qText").value = "";
  document.getElementById("correctAnswer").value = "";
  document.getElementById("qType").value = "mcq";
  const img=document.getElementById("questionPreview");
  img.src="";
  img.style.display="none";
  renderOptionsByType();
  questionModal.show();
}

function renderOptionsByType() {
    const type = document.getElementById("qType").value;
    const box = document.getElementById("optionsBox");
    const qImgBox = document.getElementById("questionImageBox");
    qImgBox.style.display =
        type === "question_img" ? "block" : "none";
    box.innerHTML = "";
    if (type === "mcq" || type === "question_img") {
        ["A","B","C","D"].forEach(letter => {
            box.innerHTML += `
                <input
                    class="form-control mb-2 option-input"
                    id="option${letter}"
                    placeholder="${letter}">
            `;
        });
    }
    else if (type === "ans_img") {
        ["A","B","C","D"].forEach(letter => {
            box.innerHTML += `
                <div class="border rounded p-2 mb-3">
                    <label>${letter}</label>
                    <input
                        type="file"
                        accept="image/*"
                        id="option${letter}Image"
                        class="form-control mb-2">
                    <img
                        id="preview${letter}"
                        style="
                            display:none;
                            max-width:140px;
                            max-height:140px;
                            border:1px solid #ccc;
                            border-radius:8px;">
                </div>
            `;
        });
        setTimeout(initAnswerImageUpload,50);
    }
    else if (type === "true_false") {
        box.innerHTML = `
            <input class="form-control mb-2" id="optionA" value="Đúng">
            <input class="form-control mb-2" id="optionB" value="Sai">
        `;
    }
    else {
        box.innerHTML = `
            <small class="text-muted">
                Không có đáp án lựa chọn.
            </small>
        `;
    }
}

async function addQuestion() {
  const text = document.getElementById("qText").value;
  const type = document.getElementById("qType").value;
  let options = null;
  if (type == "mcq" || type == "question_img") {
    const optionInputs = document.querySelectorAll(".option-input");
    options = {};
    optionInputs.forEach((inp, idx) => {
      options[String.fromCharCode(65+idx)] = inp.value;
    });
  } else if(type=="ans_img"){
    options={A:"", B:"", C:"", D:"" };
  } else if(type=="true_false"){
    options={
        A:document.getElementById("optionA").value,
        B:document.getElementById("optionB").value
    };
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
      correct_answer: correct,
      question_image: questionImage,
      option_a_image: optionAImagePath,
      option_b_image: optionBImagePath,
      option_c_image: optionCImagePath,
      option_d_image: optionDImagePath,
    })
  });
  questionModal.hide();
  document.activeElement.blur();
  refreshQuestionList();
}

async function initAnswerImageUpload(){
    ["A","B","C","D"].forEach(letter=>{
        const input=document.getElementById(`option${letter}Image`);
        if(!input) return;
        input.onchange=async()=>{
            const path=await uploadImage(input.files[0]);
            window[`option${letter}ImagePath`]=path;
            const img=document.getElementById(`preview${letter}`);
            img.src="/static/"+path;
            img.style.display="block";
        }
    });
}

document.getElementById("questionImage").onchange=async function(){
    questionImage=await uploadImage(this.files[0]);
    const img=document.getElementById("questionPreview");
    img.src="/static/"+questionImage;
    img.style.display="block";
}

async function editQuestion(id) {
  editingQuestionId = id;
  const res = await fetch(`${API_BASE_URL}/api/question/${id}`);
  const q = await res.json();
  questionImage=q.question_image||"";

  const questionPreview = document.getElementById("editQuestionPreview");
  if(questionPreview){
      if(questionImage){
          questionPreview.src="/static/"+questionImage;
          questionPreview.style.display="block";
      }else{
          questionPreview.src="";
          questionPreview.style.display="none";
      }
  }

  optionAImagePath=q.option_a_image||"";
  optionBImagePath=q.option_b_image||"";
  optionCImagePath=q.option_c_image||"";
  optionDImagePath=q.option_d_image||"";
  document.getElementById("editQText").value = q.question_text || q.question || "";
  document.getElementById("editQType").value = q.question_type || "mcq";
  renderEditOptionsByType(q.options, q);
  document.getElementById("editCorrectAnswer").value = q.correct_answer || "";
  editQModal.show();
}

function renderEditOptionsByType(existingOptions = null, q = null) {
    const type = document.getElementById("editQType").value;
    const box = document.getElementById("editOptionsBox");
    // Box chứa ảnh câu hỏi trong modal Edit
    const qImgBox = document.getElementById("editQuestionImageBox");
    box.innerHTML = "";
    // Hiện/ẩn upload ảnh câu hỏi
    if (qImgBox) {
        qImgBox.style.display = (type === "question_img") ? "block" : "none";
    }

    // Hiện preview ảnh câu hỏi
    if (type === "question_img") {
        questionImage = q?.question_image || "";
        const preview = document.getElementById("editQuestionPreview");
        if (preview) {
            if (questionImage) {
                preview.src = "/static/" + questionImage;
                preview.style.display = "block";
            } else {
                preview.src = "";
                preview.style.display = "none";
            }
        }
        // upload ảnh mới
        const input = document.getElementById("editQuestionImage");
        if (input) {
            input.onchange = async function () {
                questionImage = await uploadImage(this.files[0]);
                preview.src = "/static/" + questionImage;
                preview.style.display = "block";
            };
        }
    }

    // ===========================
    // MCQ + QUESTION IMAGE
    // ===========================

    if (type === "mcq" || type === "question_img") {
        ["A","B","C","D"].forEach(letter=>{
            const value = existingOptions ? (existingOptions[letter] || "") : "";
            box.innerHTML += `
                <div class="input-group mb-2">
                    <span class="input-group-text">${letter}</span>

                    <input
                        type="text"
                        class="form-control editOptionInput"
                        data-key="${letter}"
                        value="${value}">
                </div>
            `;
        });
    }

    // ===========================
    // ANSWER IMAGE
    // ===========================

    else if(type==="ans_img"){
        ["A","B","C","D"].forEach(letter=>{
            let path = q ? q[`option_${letter.toLowerCase()}_image`] : "";
            let img = path ? "/static/" + path : "";
            box.innerHTML += `
            <div class="border rounded p-2 mb-3">
                <label class="fw-bold">${letter}</label>
                <input
                    type="file"
                    id="editOption${letter}Image"
                    accept="image/*"
                    class="form-control mb-2">
                <img
                  id="editPreview${letter}"
                  src="${img}"
                  style="
                      display:${img ? "block":"none"};
                      max-width:140px;
                      max-height:140px;
                      object-fit:contain;
                      border:1px solid #ccc;
                      border-radius:8px;">
            </div>`;
        });
        setTimeout(initEditAnswerImageUpload,50);
    }

    // ===========================
    // TRUE FALSE
    // ===========================

    else if(type==="true_false"){

        const a = existingOptions ? (existingOptions["A"] || "Đúng") : "Đúng";

        const b = existingOptions ? (existingOptions["B"] || "Sai") : "Sai";

        box.innerHTML = `

            <div class="input-group mb-2">

                <span class="input-group-text">A</span>

                <input
                    class="form-control editOptionInput"
                    data-key="A"
                    value="${a}">

            </div>

            <div class="input-group mb-2">

                <span class="input-group-text">B</span>

                <input
                    class="form-control editOptionInput"
                    data-key="B"
                    value="${b}">

            </div>

        `;

    }

    // ===========================
    // NOTE
    // ===========================

    else if(type==="note"){

        box.innerHTML = `
            <p class="text-muted">
                Loại câu hỏi này không có đáp án lựa chọn.
            </p>
        `;

    }

}

async function initEditAnswerImageUpload(){
    ["A","B","C","D"].forEach(letter=>{
        const input=document.getElementById(`editOption${letter}Image`);
        if(!input) return;
        input.onchange=async()=>{
            const path=await uploadImage(input.files[0]);
            switch(letter){
                case "A": optionAImagePath=path; break;
                case "B": optionBImagePath=path; break;
                case "C": optionCImagePath=path; break;
                case "D": optionDImagePath=path; break;
            }
            const preview=document.getElementById(`editPreview${letter}`);
            preview.src="/static/"+path;
            preview.style.display="block";
        };
    });
}

async function updateQuestion() {

    const text = document.getElementById("editQText").value;
    const type = document.getElementById("editQType").value;

    let options = null;

    // MCQ + QUESTION IMAGE
    if(type==="mcq" || type==="question_img"){

        options={};

        document.querySelectorAll(".editOptionInput").forEach(inp=>{

            options[inp.dataset.key]=inp.value;

        });

    }

    // ANSWER IMAGE
    else if(type==="ans_img"){

        options={
            A:"",
            B:"",
            C:"",
            D:""
        };

    }

    // TRUE FALSE
    else if(type==="true_false"){

        options={
            A:document.querySelector('.editOptionInput[data-key="A"]').value,
            B:document.querySelector('.editOptionInput[data-key="B"]').value
        };

    }

    // NOTE
    else if(type==="note"){

        options=null;

    }

    const correct=document.getElementById("editCorrectAnswer").value;

    await fetch(`${API_BASE_URL}/api/questions/${editingQuestionId}`,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            question_text:text,

            question_type:type,

            options:options,

            correct_answer:correct,

            question_image:questionImage,

            option_a_image:optionAImagePath,

            option_b_image:optionBImagePath,

            option_c_image:optionCImagePath,

            option_d_image:optionDImagePath

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
        ${q.question_image
        ?`<img src="/static/${q.question_image}" style="width:90px"><br>`
        :""}
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
    console.log(res);
    const contentType = res.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      // Không phải JSON, có thể xử lý khác
      const text = await res.text();
      console.log("Response không phải JSON:", text);
    }
    console.log("✅ Commit kết quả:", data);
    return data.status;
  } catch (err) {
    console.error("❌ Lỗi commit GitHub:", err);
    return "fail";
  }
}

document.getElementById("saveBtn").addEventListener("click", async function() {
  this.style.opacity = 0.5;

  try {
    let status = await saveToGithub();  // await giờ hợp lệ
    if (status === "live") {
      alert("Lưu thành công ✅");
    } else if (status === "cancelled") {
      alert("Lưu bị hủy. Thử lưu lại sau vài phút. ⚠️");
    } else {
      alert("Lưu thất bại ❌");
    }
  } catch (err) {
    console.error(err);
    alert("Có lỗi xảy ra khi lưu ❌");
  }

  this.style.opacity = 1;
});

// EXPORT
function exportExcel() {
  if (!selectedQuiz) return alert("Chọn quiz trước!");

  window.location.href = `/api/export_questions/${selectedQuiz}`;
}


// IMPORT
document.getElementById("importFile").addEventListener("change", async function () {
  if (!selectedQuiz) {
    alert("Chọn quiz trước!");
    return;
  }
  const file = this.files[0];
  const formData = new FormData();
  formData.append("file", file);
  await fetch(`/api/import_questions/${selectedQuiz}`, {
    method: "POST",
    body: formData
  });
  alert("Import thành công ✅");
  refreshQuestionList();
});

async function uploadImage(file){
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload_image",{
        method:"POST",
        body:form
    });
    return (await res.json()).path;
}