-- =====================================================================
--  TimeManager – dane demonstracyjne
--  Odwzorowują makietę z rysunku 2.3 / widok z rysunku 3.3.
--  Daty liczone względem CURRENT_DATE, więc demo zawsze pokazuje "dziś".
--  Konto demo: anna.nowak@example.com / hasło: demo1234 (hash bcrypt)
-- =====================================================================

INSERT INTO users (name, email, password_hash) VALUES
  ('Anna Nowak', 'anna.nowak@example.com',
   '$2b$10$G3UDq/xoMmV5.GW8I1Kiuuo38Lu1R50zBEuW9say0qgc3nYzOIdai');

-- Zadania na dziś (id 1–3) ---------------------------------------------
INSERT INTO tasks (user_id, title, description, priority, status, due_date) VALUES
  (1, 'Przygotować śniadanie', 'Owsianka i kawa przed nauką', 'medium', 'done',        CURRENT_DATE),
  (1, 'Zakupy spożywcze',      'Warzywa, pieczywo, nabiał',    'medium', 'done',        CURRENT_DATE),
  (1, 'Nauka / praca własna',  'Rozdział 3 – implementacja',   'high',   'in_progress', CURRENT_DATE);

-- Inbox – zadania zebrane, jeszcze bez terminu (GTD: gromadzenie) -------
INSERT INTO tasks (user_id, title, description, priority, status, due_date) VALUES
  (1, 'Oddzwonić do dentysty',            NULL,                         'medium', 'new', NULL),
  (1, 'Przeczytać artykuł o technice Pomodoro', 'Link w zakładkach',   'low',    'new', NULL),
  (1, 'Zapłacić rachunek za internet',    NULL,                         'high',   'new', NULL);

-- Zadania na kolejne dni -------------------------------------------------
INSERT INTO tasks (user_id, title, description, priority, status, due_date) VALUES
  (1, 'Odebrać paczkę z paczkomatu',      NULL,                          'low',  'new', CURRENT_DATE + 1),
  (1, 'Przygotować prezentację na zajęcia', 'Slajdy + notatki do wystąpienia', 'high', 'new', CURRENT_DATE + 2),
  (1, 'Trening na siłowni',               'Plan A – góra ciała',         'medium', 'new', CURRENT_DATE + 3);

-- Zadania wykonane w poprzednich dniach (dane do podsumowania tygodnia) --
INSERT INTO tasks (user_id, title, priority, status, due_date) VALUES
  (1, 'Powtórka materiału – statystyka', 'high',   'done', CURRENT_DATE - 1),
  (1, 'Sprzątanie mieszkania',           'low',    'done', CURRENT_DATE - 1),
  (1, 'Wysłać CV',                       'high',   'done', CURRENT_DATE - 2),
  (1, 'Notatki z wykładu',               'medium', 'done', CURRENT_DATE - 3),
  (1, 'Pranie',                          'low',    'done', CURRENT_DATE - 3),
  (1, 'Projekt bazy danych – poprawki',  'high',   'done', CURRENT_DATE - 3),
  (1, 'Odpisać na maile',                'medium', 'done', CURRENT_DATE - 4),
  (1, 'Rozliczyć wydatki',               'medium', 'done', CURRENT_DATE - 5),
  (1, 'Lista zakupów na tydzień',        'low',    'done', CURRENT_DATE - 6),
  (1, 'Przeczytać rozdział książki',     'medium', 'new',  CURRENT_DATE - 2);

-- Plan dnia – bloki czasu (time blocking) -------------------------------
INSERT INTO time_blocks (user_id, task_id, label, date, start_time, end_time) VALUES
  (1, 1,    'Śniadanie',           CURRENT_DATE, '07:30', '08:00'),
  (1, 3,    'Pomodoro 1: nauka',   CURRENT_DATE, '09:00', '09:25'),
  (1, NULL, 'Przerwa 5 min',       CURRENT_DATE, '09:25', '09:30'),
  (1, 3,    'Pomodoro 2: nauka',   CURRENT_DATE, '09:30', '09:55'),
  (1, 2,    'Zakupy',              CURRENT_DATE, '11:00', '12:00'),
  (1, 3,    'Praca własna',        CURRENT_DATE, '14:00', '15:00'),
  (1, NULL, 'Spacer',              CURRENT_DATE, '18:00', '18:30');

-- Plan na jutro (przykład) ----------------------------------------------
INSERT INTO time_blocks (user_id, task_id, label, date, start_time, end_time) VALUES
  (1, 7, 'Paczka',                 CURRENT_DATE + 1, '08:30', '09:00'),
  (1, 8, 'Pomodoro 1: prezentacja', CURRENT_DATE + 1, '10:00', '10:25');

-- Sesje skupienia (Pomodoro) --------------------------------------------
INSERT INTO focus_sessions (user_id, task_id, start_time, end_time, duration_minutes, completed) VALUES
  (1, 3, CURRENT_DATE + TIME '09:00', CURRENT_DATE + TIME '09:25', 25, TRUE),
  (1, 3, CURRENT_DATE + TIME '09:30', CURRENT_DATE + TIME '09:55', 25, TRUE);

INSERT INTO focus_sessions (user_id, task_id, start_time, end_time, duration_minutes, completed)
SELECT 1, NULL,
       (CURRENT_DATE - d) + (TIME '09:00' + (s * INTERVAL '30 minutes')),
       (CURRENT_DATE - d) + (TIME '09:25' + (s * INTERVAL '30 minutes')),
       25, TRUE
FROM generate_series(1, 6) AS d,
     generate_series(0, 3) AS s
WHERE s < (ARRAY[3, 4, 2, 4, 1, 2])[d];

-- Nawyki ----------------------------------------------------------------
INSERT INTO habits (user_id, name, description, frequency) VALUES
  (1, 'Wypić wodę',          '2 litry w ciągu dnia',      'daily'),
  (1, '30 min ruchu',        'Spacer, rower lub trening', 'daily'),
  (1, 'Czytanie wieczorem',  '20 stron przed snem',       'daily');

-- Historia nawyków: dziś 2/3 wykonane + ostatni tydzień
INSERT INTO habit_logs (habit_id, date, completed) VALUES
  (1, CURRENT_DATE, TRUE),
  (2, CURRENT_DATE, TRUE);

INSERT INTO habit_logs (habit_id, date, completed)
SELECT h, CURRENT_DATE - d, TRUE
FROM generate_series(1, 3) AS h,
     generate_series(1, 6) AS d
WHERE (h + d) % 3 <> 0 OR h = 1;
