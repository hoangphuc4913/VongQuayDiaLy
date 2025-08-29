import sqlite3

FILE_NAME = "quiz.sql"
DB_NAME = "quiz.db"

# Tạo file database mới
conn = sqlite3.connect(DB_NAME)
cursor = conn.cursor()

# Đọc nội dung từ file SQL
with open(FILE_NAME, 'r', encoding='utf-8') as f:
    sql_script = f.read()

# Thực thi toàn bộ script
cursor.executescript(sql_script)

conn.commit()
conn.close()
 
print(f"✅ Đã tạo thành công file {DB_NAME} từ {FILE_NAME}")