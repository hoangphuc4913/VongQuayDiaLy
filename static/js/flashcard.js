let currentQuestions = [];
let currentIndex = 0;
let selectedQuizId = null;

function loadQuizzes() {
    fetch("/api/quizzes")
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("quiz-container");
            container.innerHTML = "";

            data.forEach(quiz => {

                // bỏ qua ô đặc biệt + -
                if (quiz.name.includes("+") || quiz.name.includes("-")) return;

                const btn = document.createElement("button");
                btn.className = "btn btn-primary m-2";
                btn.innerText = quiz.name;
                btn.onclick = () => loadFlashcards(quiz.id);
                container.appendChild(btn);
            });
        });
}

function loadFlashcards(quizId) {
    selectedQuizId = quizId;

    fetch(`/api/questions/${quizId}`)
        .then(res => res.json())
        .then(data => {

            currentQuestions = data;
            currentIndex = 0;

            // 🔥 Hiện flashcard
            document.getElementById("flashcard-section").classList.remove("d-none");

            showCard();
        });
}

function showCard() {
    if (currentQuestions.length === 0) return;

    const q = currentQuestions[currentIndex];

    // Mặt trước
    document.getElementById("card-front").innerText = q.question_text;

    // Mặt sau (chỉ đáp án đúng)
    if (q.question_type === "mcq" || q.question_type === "true_false") {
        document.getElementById("card-back").innerText =
            q.options[q.correct_answer];
    } else {
        document.getElementById("card-back").innerText =
            q.correct_answer;
    }

    // Reset flip
    document.getElementById("flashcard").classList.remove("flip");

    // 🔥 Cập nhật Câu x / y
    document.getElementById("progress-text").innerText =
        `Câu ${currentIndex + 1} / ${currentQuestions.length}`;
}


// =====================
// NEXT (vòng tròn)
// =====================
document.getElementById("nextBtn").onclick = function () {

    if (currentQuestions.length === 0) return;

    currentIndex++;

    if (currentIndex >= currentQuestions.length) {
        currentIndex = 0; // quay về câu đầu
    }

    showCard();
};


// =====================
// PREVIOUS (vòng tròn)
// =====================
document.getElementById("prevBtn").onclick = function () {

    if (currentQuestions.length === 0) return;

    currentIndex--;

    if (currentIndex < 0) {
        currentIndex = currentQuestions.length - 1; // nhảy về câu cuối
    }

    showCard();
};


// =====================
// FLIP
// =====================
document.getElementById("flashcard").onclick = function () {
    this.classList.toggle("flip");
};


window.onload = loadQuizzes;