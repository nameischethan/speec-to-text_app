from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
from pydub import AudioSegment
from werkzeug.utils import secure_filename

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
CONVERTED_FOLDER = "converted"

MAX_FILE_SIZE = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {"webm", "wav", "mp3", "m4a", "ogg"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)


@app.route("/")
def home():
    return jsonify({"message": "Backend is running!"})


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def convert_to_wav_16k_mono(input_path, safe_filename):
    base_name = os.path.splitext(safe_filename)[0]
    output_filename = f"{base_name}_16k_mono.wav"
    output_path = os.path.join(CONVERTED_FOLDER, output_filename)

    audio = AudioSegment.from_file(input_path)
    audio = audio.set_frame_rate(16000).set_channels(1)
    audio.export(output_path, format="wav")

    return output_path, output_filename


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


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if not DEEPGRAM_API_KEY:
        return jsonify({
            "status": "error",
            "message": "Deepgram API key is missing"
        }), 500

    file = request.files.get("file")

    if not file:
        return jsonify({
            "status": "error",
            "message": "No file uploaded. Please upload an audio file."
        }), 400

    if file.filename == "":
        return jsonify({
            "status": "error",
            "message": "Uploaded file has no filename."
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "status": "error",
            "message": "Unsupported file type.",
            "allowed_types": list(ALLOWED_EXTENSIONS)
        }), 400

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({
            "status": "error",
            "message": "File is too large. Maximum allowed size is 25MB."
        }), 413

    safe_filename = secure_filename(file.filename)
    input_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    file.save(input_path)

    try:
        converted_path, converted_filename = convert_to_wav_16k_mono(
            input_path,
            safe_filename
        )
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Audio conversion failed.",
            "details": str(e)
        }), 500

    transcript, error = transcribe_with_deepgram(converted_path)

    if error:
        return jsonify({
            "status": "error",
            "message": "Deepgram transcription failed.",
            "details": error
        }), 500

    return jsonify({
        "status": "ok",
        "message": "transcribed",
        "original_filename": safe_filename,
        "converted_filename": converted_filename,
        "original_size_bytes": file_size,
        "converted_format": "wav",
        "sample_rate": "16000 Hz",
        "channels": "mono",
        "transcript": transcript
    })


if __name__ == "__main__":
    app.run(debug=True)