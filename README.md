# BookVerse — Social Book Discovery & AI Literary Platform

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-LLM%20%26%20RAG-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-NoSQL-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

**BookVerse** is a modern full-stack book discovery, review, and curation platform enhanced with **Retrieval-Augmented Generation (RAG)** and **Generative AI**. Readers can explore an expansive literary universe, catalog reads across personalized bookshelves, post rich reviews with star ratings, and interact with an intelligent **Google Gemini-powered AI Literary Companion**.

---

## 🌟 Core Highlights

- **📚 Expansive Catalog & Search**: Real-time book discovery powered by MongoDB and Google Books API proxy.
- **🧠 Retrieval-Augmented Generation (RAG)**: AI insights dynamically grounded on book metadata and real community reviews.
- **💬 Context-Aware AI Reading Companion**: Interactive sliding AI drawer that intelligently detects the active book page to answer plot questions, conduct vibe checks, and recommend similar books.
- **📊 Deep Literary Analytics**: Multi-dimensional radar metrics (Pacing, Complexity, Character Depth, Emotional Intensity, Accessibility), tropes, and thematic breakdowns.
- **🔗 Entity-Linked Recommendations**: AI book suggestions automatically resolve to database records for one-click navigation.
- **📖 Curated Bookshelves & Reading Lists**: Default shelves (*Want to Read*, *Currently Reading*, *Finished*) plus unlimited custom lists.
- **✍️ Community Reviews & Ratings**: Rich reviews with star ratings, reviewer avatars, and community sentiment aggregation.
- **⚡ Dual-Tier Caching & Performance**: Redis for fast session token blacklisting, query caching, and MongoDB persistence for generated AI insights.
- **🎨 Glassmorphic Dark UI**: Custom Vanilla CSS design with smooth micro-animations, responsive drawer layouts, and modern typography.

---

## 🧠 AI, LLM & RAG Architecture

BookVerse integrates **Google Gemini** Large Language Models using an asynchronous, resilient **Retrieval-Augmented Generation (RAG)** pipeline:

```
                                USER QUERY / PAGE VISIT
                                           │
                                           ▼
                            +─────────────────────────────+
                            |  React Frontend (AI Drawer) |
                            +──────────────┬──────────────+
                                           │ HTTP Request (Context Book ID + Chat)
                                           ▼
                            +─────────────────────────────+
                            |     FastAPI AI Service      |
                            +──────┬───────────────┬──────+
                                   │               │
      [1. Context Retrieval (RAG)] │               │ [2. Cache Check]
                                   ▼               ▼
                      +─────────────────+  +─────────────────+
                      |     MongoDB     |  |   Redis Cache   |
                      |  • Book Meta    |  |  • Recommendations
                      |  • User Reviews |  +─────────────────+
                      +────────┬────────+
                               │ Extracted Book Data + Reviews
                               ▼
               +───────────────────────────────────+
               |  Dynamic RAG Prompt & Context     |
               |  • Synopsis & Tropes Injection    |
               |  • Community Reviews Grounding    |
               |  • Pydantic Strict JSON Schema    |
               +─────────────────┬─────────────────+
                                 │
                                 ▼
               +───────────────────────────────────+
               |      Google Gemini LLM Engine     |
               |      (gemini-1.5-flash / Pro)     |
               +─────────────────┬─────────────────+
                                 │ Structured JSON Response
                                 ▼
               +───────────────────────────────────+
               |   Catalog Matcher & DB Linker     |
               |   (Cross-references titles to ID) |
               +─────────────────┬─────────────────+
                                 │
                                 ▼
               +───────────────────────────────────+
               |  Saved to MongoDB & Returned      |
               |  • Sub-millisecond future loads   |
               |  • On-demand refresh supported    |
               +───────────────────────────────────+
```

### 1. Retrieval-Augmented Generation (RAG)
Rather than relying solely on frozen LLM knowledge or generic prompts:
- **Dynamic Context Injection**: When generating book insights, BookVerse dynamically pulls the specific book's metadata (synopsis, categories, page counts, authors) along with the **latest reader reviews** from MongoDB.
- **Grounded Literary Critic**: Gemini ingests this contextual package as dynamic context in the prompt, synthesizing real reader sentiment and narrative facts to generate objective, hallucination-free analytics.
- **Route-Aware Conversation**: When a user chats with the assistant while viewing a specific book, the backend dynamically fetches and injects the active book's information into the LLM system instruction, allowing questions like *"Is this book character-driven?"* or *"Give me a spoiler-free vibe check"* to be answered accurately.

### 2. Multi-Dimensional Literary Analytics (`/api/ai/book-insights/{id}`)
Every book page features a Gemini-generated literary breakdown with strict schema validation:
- **Executive Summary**: A crisp, spoiler-free premise and narrative hook.
- **5-Axis Parameter Radar (1–10 Scale)**:
  - **Pacing**: Contemplative slow burn (1) to breathless action (10).
  - **Plot Complexity**: Linear progression (1) to multi-threaded puzzle (10).
  - **Character Depth**: Archetype-driven (1) to profound psychological study (10).
  - **Emotional Intensity**: Cozy & lighthearted (1) to gut-wrenching (10).
  - **Accessibility**: Dense academic prose (1) to seamless page-turner (10).
- **Key Themes & Mood Tags**: Curated literary tags (e.g., *Existential dread*, *Found family*, *Atmospheric*).
- **Notable Tropes & Target Audience**: Reader taste matching and narrative devices.

### 3. Entity Linking & Catalog Resolution
When the LLM suggests books during a chat conversation:
- The backend parses the structured suggestions and queries MongoDB for matching titles.
- If a recommended book exists in the BookVerse library, its database ID is attached, rendering an interactive **"View in Catalog"** badge in the UI.

### 4. Resilient Fallback Engine
- If the Gemini API key is not configured or an external rate limit occurs, an intelligent fallback analyzer generates heuristic literary profiles and starter recommendations, guaranteeing zero frontend disruption or downtime.

---

## 🛠️ Tech Stack Breakdown

### Frontend
- **Framework**: [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Styling**: Vanilla CSS with modern Glassmorphism, CSS variables, and responsive grid/flexbox
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/) with automatic JWT refresh interceptors

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Data Validation**: [Pydantic V2](https://docs.pydantic.dev/latest/) & `pydantic-settings`
- **Asynchronous Database Driver**: [Motor](https://motor.readthedocs.io/) (async MongoDB)
- **Security & Auth**: [Passlib](https://passlib.readthedocs.io/) (bcrypt hashing) & [Python-Jose](https://python-jose.readthedocs.io/) (JWT tokens with rotation)
- **Async HTTP & AI**: [HTTPX](https://www.python-httpx.org/) for async communication with Google Gemini and external book APIs

### AI & LLM Stack
- **Foundation Models**: Google Gemini (`gemini-1.5-flash`, candidate models with automatic failover)
- **Techniques**: Retrieval-Augmented Generation (RAG), Dynamic System Instructions, Structured JSON Schema Generation (`responseSchema`)
- **Integration**: Native REST over HTTPX with connection pooling

### Storage & Infrastructure
- **Database**: [MongoDB](https://www.mongodb.com/) (documents for users, books, reviews, reading lists, cached AI analytics)
- **Cache**: [Redis](https://redis.io/) (token revocation lists, query caching, personalized recommendation caching)
- **External Data**: [Google Books API](https://developers.google.com/books)
- **Containerization**: Docker & Docker Compose

---

## 🔌 API Overview

Interactive Swagger documentation is available at `http://localhost:8000/docs`.

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/ai/chat` | `POST` | Multi-turn conversational AI book assistant with RAG context & entity linking |
| `/api/ai/book-insights/{id}` | `GET` | AI-generated literary summary & 5-axis metric analytics (cached in DB) |
| `/api/auth/register` | `POST` | Register new user account |
| `/api/auth/login` | `POST` | Authenticate user & receive access/refresh JWTs |
| `/api/auth/refresh` | `POST` | Rotate expired access tokens |
| `/api/books` | `GET` | Browse, paginate, and filter books |
| `/api/books/search` | `GET` | Search catalog and fallback to Google Books API |
| `/api/books/{id}` | `GET` | Retrieve book details, average rating, and community reviews |
| `/api/reviews` | `POST` | Post a review and star rating (updates book aggregate rating) |
| `/api/reading-lists` | `GET` / `POST` | Manage user bookshelves (Default + Custom) |
| `/api/reading-lists/{id}/books/{book_id}` | `POST` / `DELETE` | Add or remove books from shelves |
| `/api/users/me/recommendations` | `GET` | Redis-cached personalized recommendations |

---

## 🚀 Getting Started

You can run BookVerse locally for development or with Docker Compose.

### Option A: Local Run (Recommended for Development)

#### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- **MongoDB** running locally on port `27017`
- **Redis** running locally on port `6379`

#### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Open `backend/.env` and configure your keys:
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=bookverse
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-secure-secret-key
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

> **Note**: Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/). If omitted, BookVerse will automatically provide heuristic fallback responses.

Start the FastAPI backend:
```bash
uvicorn app.main:app --reload --port 8000
```
API runs at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

#### 3. Frontend Setup
```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
The client application will start at `http://localhost:5173`.

---

### Option B: Docker Compose (Single-Command Launch)

To start the full stack (Frontend, Backend, MongoDB, Redis):

```bash
docker-compose up --build
```

Access points:
- **Frontend App**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:8000`
- **Interactive API Docs**: `http://localhost:8000/docs`

---

## 📂 Project Structure

```
BookVerse/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── ai.py               # AI Chat & Literary Insights routes
│   │   │   │   ├── auth.py             # Authentication & token endpoints
│   │   │   │   ├── books.py            # Book catalog & search endpoints
│   │   │   │   ├── reading_lists.py    # Bookshelves & custom reading lists
│   │   │   │   ├── reviews.py          # User reviews & star ratings
│   │   │   │   └── users.py            # User profile & recommendations
│   │   │   └── deps.py                 # Dependency injection (Auth, DB)
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic Settings & environment vars
│   │   │   ├── database.py             # Async MongoDB (Motor) & Redis pools
│   │   │   └── security.py             # Bcrypt hashing & JWT management
│   │   ├── models/                     # BSON schemas & database models
│   │   ├── schemas/
│   │   │   ├── ai.py                   # Pydantic schemas for AI analytics & chat
│   │   │   ├── book.py                 # Book schemas
│   │   │   └── review.py               # Review & rating schemas
│   │   ├── services/
│   │   │   ├── gemini_service.py       # Google Gemini LLM, RAG & JSON schema logic
│   │   │   ├── book_service.py         # Google Books proxy & catalog service
│   │   │   ├── recommendation_service.py # Redis-cached personalized recommendations
│   │   │   └── review_service.py       # Aggregate rating & review calculations
│   │   └── main.py                     # FastAPI app factory & lifecycle handlers
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                # Axios instance with auto JWT refresh
│   │   ├── components/
│   │   │   ├── AIAssistantDrawer.jsx   # Sliding AI Companion drawer & chat UI
│   │   │   ├── AIBookInsights.jsx      # AI literary breakdown & radar metrics card
│   │   │   ├── BookCard.jsx            # Book cover card with status badges
│   │   │   ├── Navbar.jsx              # Navigation bar & search trigger
│   │   │   ├── ReviewCard.jsx          # User review card with star rating
│   │   │   └── StarRating.jsx          # Interactive & display star ratings
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Global authentication state
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Landing page with hero & trending books
│   │   │   ├── Browse.jsx              # Search, filter, and pagination
│   │   │   ├── BookDetails.jsx         # Detail view with AI Insights & reviews
│   │   │   ├── Profile.jsx             # User stats and reviews
│   │   │   └── ReadingList.jsx         # Bookshelf and reading list manager
│   │   ├── App.jsx                     # Route definitions & layout wrapper
│   │   └── index.css                   # Global glassmorphism design system
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).
