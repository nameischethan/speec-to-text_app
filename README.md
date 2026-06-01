# speec-to-text_app

# 🎙️ Speech To Text App

A full-stack Speech-to-Text web application that allows users to record audio, transcribe speech into text, save transcription history, and download transcripts. The application features secure user authentication, cloud deployment, and a responsive user interface.

---

## 🚀 Live Demo

Frontend: https://speech-to-text-app-two-henna.vercel.app

Backend API: https://speech-to-text-app-8p3b.onrender.com

---

## ✨ Features

### Authentication

* User Registration
* User Login
* JWT Authentication
* Protected API Routes

### Audio Recording

* Record audio directly from the browser
* Microphone permission handling
* Audio upload support

### Speech Recognition

* Convert speech to text
* Fast transcription processing
* Download transcription results

### History Management

* Save transcription history
* View previous transcripts
* Secure user-specific records

### Deployment

* Frontend deployed on Vercel
* Backend deployed on Render
* Production-ready architecture

---

## 🛠️ Tech Stack

### Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS

### Backend

* Python
* Flask
* Flask-JWT-Extended
* Flask-CORS

### Database

* PostgreSQL

### Speech Processing

* OpenAI Whisper

### Deployment

* Vercel
* Render

---

## 📁 Project Structure

```text
speech-to-text_app
│
├── backend
│   ├── app.py
│   ├── uploads/
│   ├── converted/
│   ├── requirements.txt
│   └── runtime.txt
│
├── frontend
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── history/
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── RecorderPanel.tsx
│   │   ├── TranscriptPanel.tsx
│   │   └── Header.tsx
│   │
│   └── package.json
│
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/speech-to-text_app.git
cd speech-to-text_app
```

---

### 2. Backend Setup

```bash
cd backend

python -m venv venv

source venv/bin/activate
# Windows:
# venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file:

```env
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
DATABASE_URL=your_postgresql_connection_string
```

Run Backend:

```bash
python app.py
```

Backend runs on:

```text
http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

---

## 🔐 API Endpoints

### Register

```http
POST /register
```

### Login

```http
POST /login
```

### Upload & Transcribe

```http
POST /transcribe
```

### Get History

```http
GET /history
```

---

## 📊 Architecture

```text
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Next.js UI │
│   Vercel    │
└──────┬──────┘
       │ REST API
       ▼
┌─────────────┐
│ Flask API   │
│   Render    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
└─────────────┘
       │
       ▼
┌─────────────┐
│ Whisper STT │
└─────────────┘
```

---

## 📈 Future Improvements

* Real-time transcription
* Speaker diarization
* Auto punctuation
* AI summarization
* Translation support
* Mobile optimization
* Transcript sharing
* Dark/Light themes

---

## 📝 Changelog

### v1.0.0

* User authentication
* Audio recording
* Speech-to-text conversion
* Transcript history
* Transcript download
* PostgreSQL integration
* Render backend deployment
* Vercel frontend deployment

---

## 👨‍💻 Author

**Chethan Sai Urumu**

Built as a full-stack cloud-deployed Speech-to-Text application using Flask, PostgreSQL, Whisper, Next.js, and TypeScript.

---

## 📄 License

This project is licensed under the MIT License.
