DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS questions;

CREATE TABLE quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- "mcq", "true_false", "note"
    options TEXT,                -- JSON string for ABCD, e.g. {"A": "...", "B": "..."}
    correct_answer TEXT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-- Sample data
INSERT INTO quizzes (name) VALUES ('Hà Nội'),('Huế'),('Lai Châu'),('Điện Biên'),('Sơn La'),('Cao Bằng'),('Lạng Sơn'),('Quảng Ninh'),('Thanh Hóa'),('Nghệ An'),('Hà Tĩnh'),('Tuyên Quang'),('Lào Cai'),('Thái Nguyên'),('Phú Thọ'),('Bắc Ninh'),('Hưng Yên'),('Hải Phòng'),('Ninh Bình'),('Quảng Trị'),('Đà Nẵng'),('Quảng Ngãi'),('Gia Lai'),('Khánh Hòa'),('Lâm Đồng'),('Đắk Lắk'),('TP. Hồ Chí Minh'),('Đồng Nai'),('Tây Ninh'),('Cần Thơ'),('Vĩnh Long'),('Đồng Tháp'),('Cà Mau'),('An Giang');