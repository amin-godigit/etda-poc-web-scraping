from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import warnings

warnings.filterwarnings("ignore", category=UserWarning,
                        module="huggingface_hub")

app = Flask(__name__)

model_name = "airesearch/wangchanberta-base-att-spm-uncased"
try:
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=False)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name, num_labels=2)
    model.eval()
except Exception as e:
    print(f"Failed to load model/tokenizer: {str(e)}")
    exit(1)


@app.route("/classify", methods=["POST"])
def classify():
    try:
        data = request.get_json()
        product_names = data["product_names"]
        category_name = data["category_name"]
        probabilities = []

        for product_name in product_names:
            input_text = f"Product: {product_name} Category: {category_name}"
            inputs = tokenizer(input_text, return_tensors="pt",
                               truncation=True, padding=True, max_length=128)
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1).tolist()[0]
                probabilities.append(probs[1])

        return jsonify({"probabilities": probabilities})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
