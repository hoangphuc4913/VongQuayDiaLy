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

function showCard(){

    if(currentQuestions.length==0) return;

    const q=currentQuestions[currentIndex];

    const front=document.getElementById("card-front");
    const back=document.getElementById("card-back");

    front.innerHTML="";
    back.innerHTML="";

    //========================
    // FRONT
    //========================

    if(q.question_image){

        front.innerHTML+=`
        <img src="/static/${q.question_image}">
        `;
    }

    if(q.question_text){

        front.innerHTML+=`
        <div class="fs-4 fw-bold">
            ${q.question_text}
        </div>
        `;
    }

    //========================
    // BACK
    //========================

    if(q.question_type=="ans_img"){

        const imgs={
            A:q.option_a_image,
            B:q.option_b_image,
            C:q.option_c_image,
            D:q.option_d_image
        };

        back.innerHTML=`
            <img
                class="answer-image"
                src="/static/${imgs[q.correct_answer]}">
        `;
    }

    else if(
        q.question_type=="mcq"||
        q.question_type=="question_img"||
        q.question_type=="true_false"
    ){

        back.innerHTML=`
        <div class="fs-2 fw-bold">
            ${q.options[q.correct_answer]}
        </div>
        `;
    }

    else{

        back.innerHTML=`
        <div class="fs-2 fw-bold">
            ${q.correct_answer}
        </div>
        `;

    }

    document
        .getElementById("flashcard")
        .classList.remove("flip");

    document.getElementById("progress-text").innerHTML=
        `Câu ${currentIndex+1} / ${currentQuestions.length}`;
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