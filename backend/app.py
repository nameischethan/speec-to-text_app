from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/")
def home():
    return jsonify({"message": "Backend is running!"})


@app.route("/transcribe", methods=["POST"])
def transcribe():
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "no file uploaded"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    return jsonify({
        "status": "ok",
        "message": "received",
        "filename": file.filename,
        "path": file_path
    })


if __name__ == "__main__":
    app.run(debug=True)