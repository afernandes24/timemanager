# TimeManager

Aplikacja webowa wspierająca zarządzanie czasem własnym – projekt do pracy licencjackiej
„Projekt i implementacja aplikacji webowej TimeManager wspierającej zarządzanie czasem własnym”.

Łączy trzy metody: **GTD** (Inbox), **time blocking** (plan dnia) i **Pomodoro** (tryb skupienia),
a do tego nawyki i podsumowanie postępów.

**Technologie:** React (Vite) · Node.js · Express · PostgreSQL · Local Storage (zapis pomocniczy)

---

## Wymagania

- Node.js 18+ (z npm)
- PostgreSQL 14+ (lokalnie, domyślnie użytkownik `postgres` / hasło `postgres`)

## Uruchomienie (lokalnie)

```bash
# 1. Instalacja zależności (osobno backend i frontend)
cd backend  && npm install
cd ../frontend && npm install

# 2. Konfiguracja bazy – w razie potrzeby skopiuj backend/.env.example do backend/.env
cd ../backend
npm run db:setup      # tworzy bazę "timemanager", tabele i dane demo

# 3. Uruchomienie – najpierw backend, potem frontend (dwa terminale)
npm run dev           # backend:  http://localhost:4000
cd ../frontend
npm run dev           # frontend: http://localhost:5173
```

Aplikację otwierasz pod adresem **http://localhost:5173**.

Alternatywnie z katalogu głównego: `npm install && npm run install:all && npm run db:setup && npm run dev`
(uruchamia oba serwery naraz).

> `npm run db:setup` czyści bazę i wczytuje dane demo od nowa – przydatne przed prezentacją.
> Dane demo zawsze odnoszą się do „dziś”, więc widok główny wygląda jak na rysunku 3.3.

## Struktura projektu (rysunek 3.2)

```
TIMEMANAGER
├── backend
│   ├── config        db.js (połączenie z PostgreSQL), auth.js (przypisanie żądań do użytkownika), initDb.js
│   ├── controllers   logika: zadania, bloki czasu, sesje skupienia, nawyki, podsumowanie
│   ├── models        encje i walidacja danych (Task, TimeBlock, FocusSession, Habit)
│   ├── routes        endpointy API
│   ├── .env          port serwera i parametry bazy
│   └── server.js
├── database          schema.sql (rysunek 2.2), seed.sql (dane demo)
├── frontend
│   ├── public
│   └── src
│       ├── components  formularz zadania, karta zadania, blok czasu, timer, nawyki, panel podsumowania…
│       ├── pages       Plan dnia, Inbox, Lista zadań, Tryb skupienia, Nawyki, Podsumowanie
│       ├── services    api.js (komunikacja z backendem), storage.js (Local Storage), daty
│       ├── styles
│       ├── App.jsx
│       └── main.jsx
├── package.json
└── README.md
```

## Funkcje → miejsca w pracy

| Funkcja | Gdzie w aplikacji | Rozdział |
|---|---|---|
| Szybkie dodawanie zadań (GTD – gromadzenie) | pasek „Szybkie dodanie zadania” | 3.2, 3.3 |
| Analizowanie Inboxu, zasada 2 minut | widok **Inbox** | 1.1 |
| Edycja, usuwanie, status, priorytet, termin | **Lista zadań** | 3.3 |
| Wyszukiwanie, filtrowanie, sortowanie, grupowanie | **Lista zadań** (pasek filtrów) | 1.3 |
| Time blocking: bloki, przesuwanie, skracanie, wydłużanie, wykrywanie kolizji | karta **Plan dnia** | 1.1, 3.3 |
| Timer Pomodoro 25/5, długa przerwa po 4 cyklach, zapis sesji | **Tryb skupienia** (Listing 3.2) | 1.1, 3.3 |
| Nawyki z historią 7 dni i serią | **Nawyki** | 3.3 |
| Podsumowanie: 2/3 zadania, sesje, % planu, nawyki, wykresy 7 dni | **Podsumowanie** | 3.2, 3.4 |
| Dodawanie zadania (Listing 3.1) | `backend/controllers/taskController.js` → `addTask` | 3.3 |
| Zapis pomocniczy (ostatni widok, filtry, stan timera) | `frontend/src/services/storage.js` | 2.3 |

## API (REST/JSON)

| Metoda | Endpoint | Opis |
|---|---|---|
| GET | `/api/tasks?status=&priority=&q=&sort=&inbox=` | lista zadań z filtrami |
| GET | `/api/tasks/today?date=` | zadania dnia (termin lub blok w planie) |
| POST / PUT / DELETE | `/api/tasks`, `/api/tasks/:id` | dodanie / edycja / usunięcie |
| PATCH | `/api/tasks/:id/status` | zmiana statusu |
| GET / POST | `/api/time-blocks?date=`, `/api/time-blocks` | plan dnia |
| PUT / DELETE | `/api/time-blocks/:id` | korekta / usunięcie bloku (kolizje → 409) |
| GET / POST | `/api/focus-sessions?date=`, `/api/focus-sessions` | sesje skupienia |
| GET / POST | `/api/habits?date=`, `/api/habits` | nawyki |
| POST | `/api/habits/:id/log` | odznaczenie wykonania w danym dniu |
| GET | `/api/summary?date=` | podsumowanie dnia i tygodnia |
| GET | `/api/users/me`, `/api/health` | użytkownik, stan serwera i bazy |

## Uwagi

- Pełne logowanie nie jest zaimplementowane – zgodnie z „Zakończeniem” pracy to kierunek dalszego
  rozwoju. Wszystkie dane należą do użytkownika demo **Anna Nowak** (`DEMO_USER_ID` w `.env`),
  ale każde zapytanie jest filtrowane po `user_id`, więc dodanie logowania nie wymaga zmian w modelu danych.
- Wersja produkcyjna: `npm run build` (frontend), a potem `npm start` (backend serwuje też zbudowany frontend
  na porcie 4000). Na hostingu (np. Railway) wystarczy ustawić `DATABASE_URL`.
