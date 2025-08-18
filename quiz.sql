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

INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer) VALUES
(1, 'What is 2 + 2?', 'mcq', '{"A":"3","B":"4","C":"5","D":"6"}', 'B'),
(1, 'Write any factor of 10.', 'note', NULL, '2,5,10'),
(2, 'The sun is a star.', 'true_false', '{"A":"True","B":"False"}', 'A');