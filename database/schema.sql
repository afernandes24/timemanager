-- =====================================================================
--  TimeManager – schemat relacyjnej bazy danych (PostgreSQL)
--  Odpowiada modelowi z rysunku 2.2: Users, Tasks, Time_blocks,
--  Focus_sessions, Habits, Habit_logs (relacje 1:N).
--  UWAGA: skrypt usuwa istniejące tabele i tworzy je od nowa.
-- =====================================================================

DROP TABLE IF EXISTS habit_logs, habits, focus_sessions, time_blocks, tasks, users CASCADE;

-- Użytkownicy ----------------------------------------------------------
CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    name           TEXT        NOT NULL,
    email          TEXT        NOT NULL UNIQUE,
    password_hash  TEXT        NOT NULL,
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Zadania (Users 1:N Tasks) --------------------------------------------
-- due_date = NULL oznacza zadanie w Inboxie (zebrane, jeszcze nieprzeanalizowane – GTD)
CREATE TABLE tasks (
    id           SERIAL PRIMARY KEY,
    user_id      INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT        NOT NULL,
    description  TEXT,
    priority     TEXT        NOT NULL DEFAULT 'medium'
                             CHECK (priority IN ('low', 'medium', 'high')),
    status       TEXT        NOT NULL DEFAULT 'new'
                             CHECK (status IN ('new', 'in_progress', 'done')),
    due_date     DATE,
    created_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Bloki czasu – time blocking (Users 1:N, Tasks 1:N) --------------------
-- task_id może być pusty (np. przerwa), wtedy wyświetlana jest etykieta label
CREATE TABLE time_blocks (
    id          SERIAL PRIMARY KEY,
    user_id     INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id     INT         REFERENCES tasks(id) ON DELETE SET NULL,
    label       TEXT,
    date        DATE        NOT NULL,
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT time_blocks_range CHECK (end_time > start_time)
);

-- Sesje skupienia – Pomodoro (Users 1:N, Tasks 1:N) --------------------
CREATE TABLE focus_sessions (
    id                SERIAL PRIMARY KEY,
    user_id           INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id           INT         REFERENCES tasks(id) ON DELETE SET NULL,
    start_time        TIMESTAMP   NOT NULL,
    end_time          TIMESTAMP,
    duration_minutes  INT         NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
    completed         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Nawyki (Users 1:N Habits) ---------------------------------------------
CREATE TABLE habits (
    id           SERIAL PRIMARY KEY,
    user_id      INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    description  TEXT,
    frequency    TEXT        NOT NULL DEFAULT 'daily'
                             CHECK (frequency IN ('daily', 'weekdays', 'weekly')),
    created_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Historia wykonania nawyków (Habits 1:N Habit_logs) -------------------
CREATE TABLE habit_logs (
    id          SERIAL PRIMARY KEY,
    habit_id    INT         NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date        DATE        NOT NULL,
    completed   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT habit_logs_unique_day UNIQUE (habit_id, date)
);

-- Indeksy dla najczęstszych zapytań ------------------------------------
CREATE INDEX idx_tasks_user_due        ON tasks (user_id, due_date);
CREATE INDEX idx_time_blocks_user_date ON time_blocks (user_id, date);
CREATE INDEX idx_focus_user_start      ON focus_sessions (user_id, start_time);
CREATE INDEX idx_habits_user           ON habits (user_id);
