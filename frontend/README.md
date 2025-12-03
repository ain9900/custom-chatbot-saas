# Chatbot SaaS Frontend

A modern React + Vite frontend for the Chatbot SaaS platform.

## Features

- 🔐 JWT Authentication
- 📊 Dashboard with chatbot management
- 💬 Real-time chat interface
- 🎨 Modern UI with Tailwind CSS
- 🔄 Automatic token refresh

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional):
```env
VITE_API_URL=http://localhost:8000/api
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

To build for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Backend Configuration

Make sure your Django backend is running on `http://localhost:8000` and has CORS configured to allow requests from `http://localhost:3000`.

Add to your Django `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
INSTALLED_APPS = [
    # ... other apps
    "corsheaders",
]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    # ... other middleware
]
```

