# BookVerse — Social Book Review Platform

BookVerse is a full-stack book discovery, review, and curation platform that enables users to browse, search, and catalog books, post rich reviews, rate novels, and construct personalized bookshelves.

This application has been engineered using **React (Vite)** on the frontend, **FastAPI** on the backend, and **MongoDB** + **Redis** as the storage and caching layer. The entire stack is containerized using **Docker Compose** for streamlined deployment.

---

## 🛠️ Architecture & Tech Stack

```
                                  +-------------------+
                                  | React (Vite) App  |
                                  |   (Port 5173/80)  |
                                  +---------+---------+
                                            |
                                            | REST API Requests (JWT Auth)
                                            v
                                  +-------------------+
                                  |  FastAPI Backend  |
                                  |    (Port 8000)    |
                                  +----+---------+----+
                                       |         |
                     MongoDB (Motor)   |         | Redis Cache
                                       v         v
                                  +----+---+ +---+----+
                                  |MongoDB | | Redis  |
                                  +--------+ +--------+
```

### Stack Components
*   **Frontend**: React (Vite) with vanilla CSS glassmorphism styling, Axios (with automatic token refresh interceptors), React Router v6, and Lucide React icons.
*   **Backend**: FastAPI, Pydantic V2 schemas, Motor async driver, passlib (bcrypt password hashing), python-jose (JWT authorization).
*   **Database**: MongoDB (efficient storage for flexible, unstructured book data and rich reviews).
*   **Cache**: Redis (token blacklisting on logout, popular search result caching, personalized recommendation caching).
*   **Integrations**: Google Books API (used as a fallback proxy for book details and search querying).

---

## 🚀 Getting Started

You can run the application either directly on your local system or via Docker Compose.

### Option A: Local Run (Recommended for Development)

#### 1. Start Database & Redis
Ensure MongoDB (`localhost:27017`) and Redis (`localhost:6379`) are running on your system.

#### 2. Run the Backend API
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill details:
   ```bash
   cp .env.example .env
   ```
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`. You can inspect endpoints via the interactive Swagger docs at `http://localhost:8000/docs`.

#### 3. Run the Frontend App
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The client application will launch at `http://localhost:5173`.

---

### Option B: Docker Compose (Production/Single Command Run)

To stand up the entire architecture (React Frontend, FastAPI Backend, MongoDB Database, Redis Cache) automatically, run:

```bash
docker-compose up --build
```

The application will be accessible:
*   **Frontend**: `http://localhost` (Port 80)
*   **Backend API**: `http://localhost:8000`
*   **API Documentation**: `http://localhost:8000/docs`

---

## 📂 Project Structure

```
BookVerse/
├── backend/
│   ├── app/
│   │   ├── api/            # API endpoints & dependency injection
│   │   ├── core/           # DB connections, Config settings, JWT Security
│   │   ├── models/         # BSON document schemas
│   │   ├── schemas/        # Request/Response validation models
│   │   ├── services/       # Core business logic handlers
│   │   └── main.py         # Entry point and lifespans
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API config
│   │   ├── components/     # StarRating, BookCard, Navbar, ReviewCard
│   │   ├── context/        # Auth state context
│   │   ├── pages/          # Home, Browse, Details, Profile, ReadingList
│   │   ├── App.jsx         # Routes definition
│   │   └── index.css       # Global styling & layout
│   └── Dockerfile
└── docker-compose.yml
```
