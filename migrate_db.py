import sqlite3

OLD_DB = "database.db.bak"
NEW_DB = "database.db"
TARGET_USER_ID = 1

def migrate():
    old_conn = sqlite3.connect(OLD_DB)
    new_conn = sqlite3.connect(NEW_DB)
    cur_old = old_conn.cursor()
    cur_new = new_conn.cursor()

    print("Migrating data from a backup...")

    tasks = cur_old.execute("SELECT id, title, description, urgency, completed, scope, due_date FROM task").fetchall()
    for t in tasks:
        cur_new.execute(
            """INSERT INTO task (id, title, description, urgency, completed, scope, due_date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""", 
            (t[0], t[1], t[2], t[3], t[4], t[5], t[6], TARGET_USER_ID),
        )
    print(f"Migrated {len(tasks)} tasks")

    courses = cur_old.execute("SELECT id, title, code, credits, current_grade, scope FROM course").fetchall()
    for c in courses:
        cur_new.execute(
            """INSERT INTO course (id, title, code, credits, current_grade, scope, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)""", 
            (c[0], c[1], c[2], c[3], c[4], c[5], TARGET_USER_ID),
        )
    print(f"Migrated {len(courses)} courses")

    schedules = cur_old.execute("SELECT id, title, description, type, course_id, day, start_time, end_time, repeat, repeat_until, location, scope FROM schedule").fetchall()
    for s in schedules:
        cur_new.execute(
            """INSERT INTO schedule (id, title, description, type, course_id, day, start_time, end_time, repeat, repeat_until, location, scope, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", 
            (s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], s[11], TARGET_USER_ID),
        )
    print(f"Migrated {len(schedules)} schedules")

    deadlines = cur_old.execute("SELECT id, title, course_id, type, due_date, scope FROM deadline").fetchall()
    for d in deadlines:
        cur_new.execute(
            """INSERT INTO deadline (id, title, course, type, due_date, scope, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)""", 
            (d[0], d[1], d[2], d[3], d[4], d[5], TARGET_USER_ID),
        )
    print(f"Migrated {len(deadlines)} deadlines")

    new_conn.commit()
    old_conn.close()
    new_conn.close()

    print("Migration completed successfully")

if __name__ == "__main__":
    migrate()