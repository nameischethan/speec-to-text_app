from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from dotenv import load_dotenv
import os
import time
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from pydub import AudioSegment
from werkzeug.utils import secure_filename
import jwt
import bcrypt
from functools import wraps

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")

DB_NAME = "speech_to_text"
DB_USER = "chethansaiurumu"
DB_HOST = "localhost"

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://speech-to-text-app-two-henna.vercel.app",
]

app = Flask(__name__)
app.config["SECRET_KEY"] = JWT_SECRET or "dev-secret-key"

CORS(
    app,
    resources={r"/*": {"origins": ALLOWED_ORIGINS}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
    supports_credentials=True,
)

socketio = SocketIO(
    app,
    cors_allowed_origins=ALLOWED_ORIGINS,
    async_mode="threading",
    logger=True,
    engineio_logger=True,
)

UPLOAD_FOLDER = "uploads"
CONVERTED_FOLDER = "converted"
CHUNK_FOLDER = "chunks"

MAX_FILE_SIZE = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {"webm", "wav", "mp3", "m4a", "ogg"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)
os.makedirs(CHUNK_FOLDER, exist_ok=True)


def get_db_connection():
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        return psycopg2.connect(
            database_url,
            cursor_factory=RealDictCursor,
        )

    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        host=DB_HOST,
        cursor_factory=RealDictCursor,
    )

def generate_token(user_id):
    return jwt.encode({"user_id": user_id}, JWT_SECRET, algorithm="HS256")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"status": "error", "message": "Token missing"}), 401

        try:
            token = auth_header.replace("Bearer ", "")
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = data["user_id"]
        except Exception:
            return jsonify({"status": "error", "message": "Invalid token"}), 401

        return f(user_id, *args, **kwargs)

    return decorated


@app.route("/")
def home():
    return jsonify({"message": "Backend is running!"})


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, name, email, created_at;
            """,
            (name, email, password_hash),
        )

        user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        token = generate_token(user["id"])

        return jsonify({
            "status": "ok",
            "message": "User registered successfully",
            "user": user,
            "token": token,
        })

    except psycopg2.errors.UniqueViolation:
        return jsonify({"status": "error", "message": "Email already registered"}), 409

    except Exception as e:
        return jsonify({"status": "error", "message": "Registration failed", "details": str(e)}), 500


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, name, email, password_hash
        FROM users
        WHERE email = %s;
        """,
        (email,),
    )

    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    is_valid = bcrypt.checkpw(
        password.encode("utf-8"),
        user["password_hash"].encode("utf-8"),
    )

    if not is_valid:
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    token = generate_token(user["id"])

    return jsonify({
        "status": "ok",
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
    })


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def convert_to_wav_16k_mono(input_path, safe_filename):
    base_name = os.path.splitext(safe_filename)[0]
    output_filename = f"{base_name}_16k_mono.wav"
    output_path = os.path.join(CONVERTED_FOLDER, output_filename)

    audio = AudioSegment.from_file(input_path)
    audio = audio.set_frame_rate(16000).set_channels(1)
    audio.export(output_path, format="wav")

    duration_seconds = int(len(audio) / 1000)

    return output_path, output_filename, duration_seconds


def transcribe_with_deepgram(file_path):
    url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"

    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "audio/wav",
    }

    with open(file_path, "rb") as audio:
        response = requests.post(url, headers=headers, data=audio)

    if response.status_code != 200:
        return None, response.text

    data = response.json()
    transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]

    return transcript, None


def save_transcript(user_id, text, filename, duration_seconds, language="en"):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO transcripts (user_id, text, filename, duration_seconds, language)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, user_id, text, filename, duration_seconds, language, created_at;
        """,
        (user_id, text, filename, duration_seconds, language),
    )

    transcript = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return transcript


@app.route("/transcripts", methods=["GET"])
@token_required
def get_transcripts(user_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, user_id, text, filename, duration_seconds, language, created_at
        FROM transcripts
        WHERE user_id = %s
        ORDER BY created_at DESC;
        """,
        (user_id,),
    )

    transcripts = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify({"status": "ok", "transcripts": transcripts})


@app.route("/transcripts/<int:transcript_id>", methods=["GET"])
@token_required
def get_transcript(user_id, transcript_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, user_id, text, filename, duration_seconds, language, created_at
        FROM transcripts
        WHERE id = %s AND user_id = %s;
        """,
        (transcript_id, user_id),
    )

    transcript = cur.fetchone()
    cur.close()
    conn.close()

    if not transcript:
        return jsonify({"status": "error", "message": "Transcript not found"}), 404

    return jsonify({"status": "ok", "transcript": transcript})


@socketio.on("connect")
def handle_connect():
    print("Client connected")
    emit("server_message", {"message": "Connected to backend socket"})


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


@socketio.on("audio_chunk")
def handle_audio_chunk(data):
    try:
        audio_data = data.get("audio")
        chunk_index = data.get("index", 0)

        if not audio_data:
            emit("partial_transcript", {"text": "No audio chunk received"})
            return

        chunk_filename = f"chunk_{int(time.time())}_{chunk_index}.webm"
        chunk_path = os.path.join(CHUNK_FOLDER, chunk_filename)

        with open(chunk_path, "wb") as f:
            f.write(audio_data)

        emit("partial_transcript", {
            "text": f"Listening... received chunk {chunk_index}",
        })

    except Exception as e:
        emit("partial_transcript", {
            "text": f"Chunk error: {str(e)}",
        })


@app.route("/transcribe", methods=["POST"])
@token_required
def transcribe(user_id):
    if not DEEPGRAM_API_KEY:
        return jsonify({"status": "error", "message": "Deepgram API key is missing"}), 500

    file = request.files.get("file")

    if not file:
        return jsonify({"status": "error", "message": "No file uploaded. Please upload an audio file."}), 400

    if file.filename == "":
        return jsonify({"status": "error", "message": "Uploaded file has no filename."}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "status": "error",
            "message": "Unsupported file type.",
            "allowed_types": list(ALLOWED_EXTENSIONS),
        }), 400

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({"status": "error", "message": "File is too large. Maximum allowed size is 25MB."}), 413

    safe_filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    file.save(input_path)

    try:
        converted_path, converted_filename, duration_seconds = convert_to_wav_16k_mono(
            input_path,
            safe_filename,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": "Audio conversion failed.", "details": str(e)}), 500

    transcript_text, error = transcribe_with_deepgram(converted_path)

    if error:
        return jsonify({"status": "error", "message": "Deepgram transcription failed.", "details": error}), 500

    saved_transcript = save_transcript(
        user_id,
        transcript_text,
        safe_filename,
        duration_seconds,
    )

    return jsonify({
        "status": "ok",
        "message": "transcribed and saved",
        "original_filename": safe_filename,
        "converted_filename": converted_filename,
        "original_size_bytes": file_size,
        "duration_seconds": duration_seconds,
        "transcript": transcript_text,
        "saved": saved_transcript,
    })


if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5001,
        debug=True,
        allow_unsafe_werkzeug=True,
    )