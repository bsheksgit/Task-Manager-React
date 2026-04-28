# Task Manager

A full-stack task management application built with **React** on the frontend and **FastAPI** on the backend, powered by a **PostgreSQL** database. Users can sign up, log in, create and manage tasks with rich descriptions and todo lists, update their profile with a bio and profile picture, and delete their account with a secure password-confirmation flow. The entire stack runs locally via **Docker Compose**, making it easy to spin up the complete environment with a single command.

The frontend uses **Material-UI** for a polished component library, **Redux Toolkit** for global state management, and **React Query** for efficient server-state caching and optimistic updates. The backend provides a RESTful API with **JWT-based authentication**, **SQLAlchemy ORM** for database operations, and image processing via **Pillow** for profile picture uploads. The application is fully containerized — the frontend is served through **Nginx**, the backend runs on **Uvicorn**, and **PostgreSQL** handles data persistence.

## Tech Stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| **Frontend** | React 19, Vite, Material-UI 7, Redux Toolkit, React Query, Tailwind CSS |
| **Backend**  | FastAPI, SQLAlchemy 2.0, JWT (python-jose), bcrypt, Pillow              |
| **Database** | PostgreSQL 16                                                           |
| **DevOps**   | Docker, Docker Compose, Nginx                                           |

## Features

- **User Authentication** — Sign up, log in, and JWT-based session management
- **Task Management** — Create, read, update, and delete tasks with todo lists
- **User Profiles** — Update personal details, bio, location, and phone number
- **Profile Picture** — Upload, crop, resize, and store profile images (Base64)
- **Account Deletion** — Secure delete flow with password verification and 24-hour lockout after 3 failed attempts
- **Responsive UI** — Built with Material-UI components and Tailwind CSS utility classes

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

### Run the Application

```bash
docker compose up --build
```

This starts three services:

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost      |
| Backend API | http://localhost:8000 |
| PostgreSQL  | localhost:5432        |

To stop the services:

```bash
docker compose down
```

To also remove the database volume (resets all data):

```bash
docker compose down -v
```

## Project Structure

```
Task_Manager/
├── Backend/
│   ├── app.py               # FastAPI application (routes, auth, logic)
│   ├── database.py           # SQLAlchemy engine and session
│   ├── models.py             # ORM models (User, Task)
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Backend container build
│   └── .env.example          # Environment variable template
├── Frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer (axios)
│   │   ├── store/            # Redux slices
│   │   ├── App.jsx           # Root component
│   │   └── routes.jsx        # React Router configuration
│   ├── Dockerfile            # Multi-stage build (Node → Nginx)
│   ├── nginx.conf            # Nginx config with SPA fallback
│   └── package.json          # Frontend dependencies
├── docker-compose.yml        # Service orchestration
└── README.md
```

## Environment Variables

Key configuration values are set in `docker-compose.yml`:

| Variable                          | Description                       | Default Value                                                  |
| --------------------------------- | --------------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`                    | PostgreSQL connection string      | `postgresql://postgres:postgres@postgres:5432/taskmanager`     |
| `JWT_SECRET_KEY`                  | Secret key for signing JWT tokens | _(set in docker-compose.yml)_                                  |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time             | `10`                                                           |
| `CORS_ORIGINS`                    | Allowed CORS origins              | `http://localhost:5173,http://localhost:3000,http://localhost` |
| `VITE_API_URL`                    | Backend URL used by the frontend  | `http://localhost:8000`                                        |

## API Endpoints

| Method   | Endpoint                          | Description               | Auth Required |
| -------- | --------------------------------- | ------------------------- | :-----------: |
| `POST`   | `/signup`                         | Create a new user account |      No       |
| `POST`   | `/login`                          | Log in and get JWT token  |      No       |
| `GET`    | `/users/{userId}/tasks`           | List all tasks for a user |      Yes      |
| `POST`   | `/users/{userId}/tasks`           | Create/update tasks       |      Yes      |
| `GET`    | `/users/{userId}/tasks/{taskId}`  | Get a single task         |      Yes      |
| `POST`   | `/users/{userId}/tasks/{taskId}`  | Update a single task      |      Yes      |
| `DELETE` | `/users/{userId}/tasks/{taskId}`  | Delete a single task      |      Yes      |
| `GET`    | `/users/{userId}/profile`         | Get user profile          |      Yes      |
| `PUT`    | `/users/{userId}/profile`         | Update user profile       |      Yes      |
| `POST`   | `/users/{userId}/profile/picture` | Upload profile picture    |      Yes      |
| `DELETE` | `/users/{userId}/profile/picture` | Remove profile picture    |      Yes      |
| `DELETE` | `/users/{userId}`                 | Delete user account       |      Yes      |

## Development (Without Docker)

### Backend

```bash
cd Backend
python -m venv venv
.\venv\Scripts\activate      # Windows
pip install -r requirements.txt
python run.py
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

> **Note:** When running without Docker, make sure PostgreSQL is running locally and the `DATABASE_URL` environment variable is set accordingly.
