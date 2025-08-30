from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import sqlite3, json, os
from starlette.responses import Response
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from datetime import datetime

@app.middleware("http")
async def add_timestamp(request: Request, call_next):
    request.state.timestamp = int(datetime.now().timestamp())
    response = await call_next(request)
    return response

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

DB_PATH = "quiz.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------- ROUTES --------------------
@app.get("/", response_class=HTMLResponse)
@app.get("/home", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        "trang_chu.html",
        {"request": request, "timestamp": request.state.timestamp}
    )

@app.get("/game", response_class=HTMLResponse)
def game(request: Request):
    return templates.TemplateResponse(
        "game.html",
        {"request": request, "timestamp": request.state.timestamp}
    )

@app.get("/result", response_class=HTMLResponse)
def result(request: Request):
    return templates.TemplateResponse(
        "result.html",
        {"request": request, "timestamp": request.state.timestamp}
    )

@app.get("/random", response_class=HTMLResponse)
def random_mode(request: Request):
    return templates.TemplateResponse(
        "random.html",
        {"request": request, "timestamp": request.state.timestamp}
    )

@app.get("/admin", response_class=HTMLResponse)
def admin_page(request: Request):
    return templates.TemplateResponse(
        "admin.html",
        {"request": request, "timestamp": request.state.timestamp}
    )

# -------------------- API QUIZZES --------------------
@app.get("/api/quizzes")
def get_quizzes():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM quizzes")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return JSONResponse(content=rows)

@app.post("/api/quizzes")
def create_quiz(data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO quizzes (name) VALUES (?)", (data["name"],))
    conn.commit()
    quiz_id = cur.lastrowid
    conn.close()
    return {"id": quiz_id}

@app.put("/api/quizzes/{quiz_id}")
def update_quiz(quiz_id: int, data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE quizzes SET name=? WHERE id=?", (data["name"], quiz_id))
    conn.commit()
    conn.close()
    return {"status": "updated"}

@app.delete("/api/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM quizzes WHERE id=?", (quiz_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

# -------------------- API QUESTIONS --------------------
@app.get("/api/questions/{quiz_id}")
def get_questions(quiz_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM questions WHERE quiz_id=?", (quiz_id,))
    rows = cur.fetchall()
    qs = []
    for r in rows:
        q = dict(r)
        if q["options"]:
            q["options"] = json.loads(q["options"])
        qs.append(q)
    conn.close()
    return JSONResponse(content=qs)

@app.get("/api/question/{q_id}")
def get_question(q_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM questions WHERE id=?", (q_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return {"error": "not found"}
    q = dict(row)
    if q["options"]:
        q["options"] = json.loads(q["options"])
    return q

@app.post("/api/questions")
def create_question(data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer)
           VALUES (?, ?, ?, ?, ?)""",
        (data["quiz_id"], data["question_text"], data["question_type"],
         json.dumps(data["options"]), data["correct_answer"])
    )
    conn.commit()
    qid = cur.lastrowid
    conn.close()
    return {"id": qid}

@app.put("/api/questions/{q_id}")
def update_question(q_id: int, data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """UPDATE questions 
           SET question_text=?, question_type=?, options=?, correct_answer=? 
           WHERE id=?""",
        (data["question_text"], data["question_type"],
         json.dumps(data["options"]), data["correct_answer"], q_id)
    )
    conn.commit()
    conn.close()
    return {"status": "updated"}

@app.delete("/api/questions/{q_id}")
def delete_question(q_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM questions WHERE id=?", (q_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}