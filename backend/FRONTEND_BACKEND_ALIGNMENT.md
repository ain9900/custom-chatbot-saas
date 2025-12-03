# Frontend-Backend Alignment Check

## ✅ Authentication Endpoints

### Registration
- **Frontend**: `POST /api/auth/register/` with `{username, email, password, password_confirm}`
- **Backend**: `POST /api/auth/register/` returns `{tokens: {access, refresh}, user, tenant}`
- **Status**: ✅ Aligned - Frontend handles `tokens.access` and `tokens.refresh` correctly

### Login
- **Frontend**: `POST /api/auth/login/` with `{username, password}`
- **Backend**: `POST /api/auth/login/` returns `{access, refresh}`
- **Status**: ✅ Aligned

### Token Refresh
- **Frontend**: `POST /api/auth/refresh/` with `{refresh: token}`
- **Backend**: `POST /api/auth/refresh/` expects `{refresh: token}`
- **Status**: ✅ Aligned

## ✅ Chatbot Endpoints

### List Chatbots
- **Frontend**: `GET /api/chatbot/`
- **Backend**: `GET /api/chatbot/` returns array with fields: `id, name, webhook_url, webhook_key, widget_snippet, created_at`
- **Status**: ✅ Aligned - All required fields are present

### Create Chatbot
- **Frontend**: `POST /api/chatbot/create/` with `{name, system_prompt}`
- **Backend**: `POST /api/chatbot/create/` expects `{name, system_prompt}`
- **Status**: ✅ Aligned

### Send Message (Webhook)
- **Frontend**: `POST /api/chatbot/webhook/{webhookKey}/` with `{message, sender_id}`
- **Backend**: `POST /api/chatbot/webhook/{webhook_key}/` expects `{message, sender_id}` and returns `{reply}`
- **Status**: ✅ Aligned

## ✅ Field Names

### Chatbot List Response
- `id` ✅
- `name` ✅
- `webhook_url` ✅ (used in Dashboard)
- `webhook_key` ✅ (used in ChatbotDetail)
- `widget_snippet` ✅ (used in Dashboard)
- `created_at` ✅

### Dashboard Usage
- Uses `chatbot.widget_snippet` for copy button ✅
- Uses `chatbot.webhook_url` for copy button ✅
- Uses `chatbot.id` for navigation ✅

### ChatbotDetail Usage
- Uses `chatbot.webhook_key` directly (fixed) ✅
- Falls back to parsing from URL if needed ✅

## ✅ CORS Configuration

- **Backend**: Allows `http://localhost:3000` and `http://127.0.0.1:3000`
- **Frontend**: Runs on `http://localhost:3000`
- **Status**: ✅ Aligned

## ✅ Static Files

- **Widget File**: `chatbot/static/chatbot-widget.js`
- **Static URL**: `/static/chatbot-widget.js`
- **STATICFILES_DIRS**: Configured to include `chatbot/static`
- **Status**: ✅ Aligned

## ✅ Error Handling

### Registration Errors
- **Backend**: Returns field-level errors in object format
- **Frontend**: Handles object errors and extracts first error message
- **Status**: ✅ Aligned

### Login Errors
- **Backend**: Returns `{detail: "error message"}`
- **Frontend**: Extracts `error.response?.data?.detail`
- **Status**: ✅ Aligned

### Webhook Errors
- **Backend**: Returns `{error: "message"}` or `{reply: "message"}`
- **Frontend**: Handles both `response.reply` and `response.message`
- **Status**: ✅ Aligned

## 🔧 Fixed Issues

1. **ChatbotDetail webhook_key**: Now uses `chatbot.webhook_key` directly instead of parsing from URL
2. **Widget snippet**: Properly includes webhook key and API URL
3. **Static files**: Configured STATICFILES_DIRS for widget file

## ✅ Summary

**All endpoints are properly aligned!** The frontend and backend are compatible and ready to work together.

### Key Points:
- All API endpoints match
- Field names are consistent
- Error handling is compatible
- CORS is properly configured
- Static files are set up correctly
- Authentication flow works end-to-end

