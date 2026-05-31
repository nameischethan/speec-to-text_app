from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/")
def home():
    return jsonify({"message": "Backend is running!"})


def transcribe_with_deepgram(file_path):
    url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"

    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "audio/webm",
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
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "no file uploaded"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    transcript, error = transcribe_with_deepgram(file_path)

    if error:
        return jsonify({
            "status": "error",
            "message": "Deepgram transcription failed",
            "details": error
        }), 500

    return jsonify({
        "status": "ok",
        "message": "transcribed",
        "filename": file.filename,
        "transcript": transcript
    })


if __name__ == "__main__":
    app.run(debug=True)