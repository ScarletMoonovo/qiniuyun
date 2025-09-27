from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
app = Flask(__name__)

@app.route("/embed", methods=["POST"])
def embed_text():
    data = request.json
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "no text provided"}), 400
    vec = model.encode([text]).tolist()
    return jsonify({"vector": vec[0]})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)