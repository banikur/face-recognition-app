"""
Skin Type Classification Model Training
Uses TensorFlow with GPU (CUDA) support

Usage: python scripts/train_model.py
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from pathlib import Path

# Check GPU
print("GPUs:", tf.config.list_physical_devices('GPU'))

# Config
IMG_SIZE = 128
BATCH_SIZE = 16
EPOCHS = 20
MODEL_PATH = "./public/models/skin-classifier"

# Labels
LABELS = ['acne', 'normal', 'oily', 'dry']
LABEL_MAP = {'acne': 0, 'redness': 0, 'normal': 1, 'bags': 1, 'oily': 2, 'dry': 3}

def collect_data():
    data = []
    base = Path("./data/training")
    
    # Source 1: Skin Defects
    for cat in ['acne', 'bags', 'redness']:
        cat_dir = base / "Source_1" / "files" / cat
        if not cat_dir.exists():
            continue
        for person_dir in cat_dir.iterdir():
            if not person_dir.is_dir():
                continue
            for img in person_dir.glob("*.jpg"):
                data.append((str(img), LABEL_MAP.get(cat, 1)))
            for img in person_dir.glob("*.jpeg"):
                data.append((str(img), LABEL_MAP.get(cat, 1)))
    
    # Source 2: Normal baseline
    src2 = base / "Source_2"
    if src2.exists():
        for person_dir in src2.iterdir():
            if not person_dir.is_dir():
                continue
            for img in person_dir.glob("*.jpg"):
                data.append((str(img), 1))
            for img in person_dir.glob("*.png"):
                data.append((str(img), 1))
    
    return data

def load_images(data):
    images, labels = [], []
    for i, (path, label) in enumerate(data):
        try:
            img = load_img(path, target_size=(IMG_SIZE, IMG_SIZE))
            arr = img_to_array(img) / 127.5 - 1  # Normalize to [-1, 1]
            images.append(arr)
            labels.append(label)
        except Exception as e:
            print(f"Failed: {path}")
        if (i + 1) % 30 == 0:
            print(f"  Loaded {i + 1}/{len(data)}")
    return np.array(images), np.array(labels)

def build_model():
    model = models.Sequential([
        layers.Conv2D(32, 3, activation='relu', padding='same', input_shape=(IMG_SIZE, IMG_SIZE, 3)),
        layers.MaxPooling2D(2),
        layers.Conv2D(64, 3, activation='relu', padding='same'),
        layers.MaxPooling2D(2),
        layers.Conv2D(128, 3, activation='relu', padding='same'),
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.5),
        layers.Dense(64, activation='relu'),
        layers.Dense(len(LABELS), activation='softmax')
    ])
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def main():
    print("=== Skin Classifier Training (GPU) ===\n")
    
    # Collect
    data = collect_data()
    print(f"Found {len(data)} images")
    for i, label in enumerate(LABELS):
        count = sum(1 for _, l in data if l == i)
        print(f"  {label}: {count}")
    
    # Shuffle
    np.random.shuffle(data)
    
    # Load
    print("\nLoading images...")
    X, y = load_images(data)
    print(f"Loaded {len(X)} images\n")
    
    # Split
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    
    # Build & train
    print("Building model...")
    model = build_model()
    model.summary()
    
    print("\nTraining...\n")
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        verbose=1
    )
    
    # Save as Keras format
    os.makedirs(MODEL_PATH, exist_ok=True)
    model.save(os.path.join(MODEL_PATH, "model.keras"))
    
    # Export as SavedModel for TFLite conversion
    model.export(os.path.join(MODEL_PATH, "saved_model"))
    
    # Also save as TFLite for web
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    with open(os.path.join(MODEL_PATH, "model.tflite"), "wb") as f:
        f.write(tflite_model)
    
    # Save labels
    with open(os.path.join(MODEL_PATH, "labels.json"), "w") as f:
        json.dump(LABELS, f)
    
    print(f"\nModel saved to {MODEL_PATH}")
    print("=== Complete ===")

if __name__ == "__main__":
    main()
