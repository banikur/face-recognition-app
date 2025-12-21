"""
Convert Keras model to TensorFlow.js format

Usage: python scripts/convert_to_tfjs.py
"""

import os
import subprocess
import sys

MODEL_PATH = "./public/models/skin-classifier"
KERAS_MODEL = os.path.join(MODEL_PATH, "model.keras")
TFJS_OUTPUT = os.path.join(MODEL_PATH, "tfjs")

def main():
    print("Converting model to TensorFlow.js format...")
    
    # Install tensorflowjs if not present
    try:
        import tensorflowjs
    except ImportError:
        print("Installing tensorflowjs...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflowjs"])
    
    # Convert
    os.makedirs(TFJS_OUTPUT, exist_ok=True)
    
    subprocess.run([
        sys.executable, "-m", "tensorflowjs.converters.keras_h5_to_tfjs",
        KERAS_MODEL,
        TFJS_OUTPUT
    ], check=True)
    
    print(f"\nConverted to {TFJS_OUTPUT}")
    print("Files created:")
    for f in os.listdir(TFJS_OUTPUT):
        print(f"  - {f}")

if __name__ == "__main__":
    main()
