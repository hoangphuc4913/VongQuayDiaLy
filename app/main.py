from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import sqlite3, json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

DB_PATH = "quiz.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/", response_class=HTMLResponse)
@app.get("/home", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("trang_chu.html", {"request": request})

@app.get("/game", response_class=HTMLResponse)
def game(request: Request):
    return templates.TemplateResponse("game.html", {"request": request})

@app.get("/result", response_class=HTMLResponse)
def result(request: Request):
    return templates.TemplateResponse("result.html", {"request": request})

@app.get("/api/quizzes")
def get_quizzes():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM quizzes")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return JSONResponse(content=rows)

@app.get("/api/questions/{quiz_id}")
def get_questions(quiz_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM questions WHERE quiz_id=?", (quiz_id,))
    rows = cur.fetchall()
    qs = []
    for r in rows:
        q = dict(r)
        if q["options"]: q["options"] = json.loads(q["options"])
        qs.append(q)
    conn.close()
    return JSONResponse(content=qs)