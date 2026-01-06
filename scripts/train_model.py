"""
Skin Condition Classifier - Python Training Script

Trains a CNN model and exports to TensorFlow.js format for browser inference.

Requirements:
    pip install tensorflow tensorflowjs pillow

Usage:
    python scripts/train_model.py

Output:
    public/models/skin-classifier/tfjs/model.json (+ weight files)
    public/models/skin-classifier/labels.json
"""

import os
import json
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import tensorflowjs as tfjs

# =============================================================================
# CONFIGURATION
# =============================================================================

CONFIG = {
    'image_size': 128,
    'batch_size': 32,
    'epochs': 15,
    'learning_rate': 0.001,
    'validation_split': 0.2,
    'dataset_path': './data/training',
    'output_path': './public/models/skin-classifier',
}

LABELS = ['acne', 'blackheads', 'clear_skin', 'dark_spots', 'puffy_eyes', 'wrinkles']

# Folder name mapping (handles spaces and variations)
FOLDER_MAP = {
    'acne': 'acne',
    'blackheads': 'blackheads',
    'clear skin': 'clear_skin',
    'clear_skin': 'clear_skin',
    'dark spots': 'dark_spots',
    'dark_spots': 'dark_spots',
    'puffy eyes': 'puffy_eyes',
    'puffy_eyes': 'puffy_eyes',
    'wrinkles': 'wrinkles',
}

# =============================================================================
# DATA LOADING
# =============================================================================

def load_dataset():
    """Load images from folder structure into TensorFlow dataset."""
    
    # Create temporary directory structure with standardized names
    # TensorFlow's image_dataset_from_directory expects folder names = labels
    
    images = []
    labels_list = []
    
    for folder in os.listdir(CONFIG['dataset_path']):
        folder_path = os.path.join(CONFIG['dataset_path'], folder)
        if not os.path.isdir(folder_path):
            continue
        
        # Map folder name to label
        label = FOLDER_MAP.get(folder.lower())
        if label is None or label not in LABELS:
            continue
        
        label_idx = LABELS.index(label)
        
        for filename in os.listdir(folder_path):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                img_path = os.path.join(folder_path, filename)
                try:
                    img = keras.preprocessing.image.load_img(
                        img_path, 
                        target_size=(CONFIG['image_size'], CONFIG['image_size'])
                    )
                    img_array = keras.preprocessing.image.img_to_array(img)
                    img_array = (img_array / 127.5) - 1  # Normalize to [-1, 1]
                    images.append(img_array)
                    labels_list.append(label_idx)
                except Exception as e:
                    print(f"  Skip: {filename} ({e})")
    
    return tf.constant(images), tf.constant(labels_list)

# =============================================================================
# MODEL ARCHITECTURE
# =============================================================================

def build_model():
    """Build CNN model matching the TypeScript version."""
    
    model = keras.Sequential([
        # Input
        layers.Input(shape=(CONFIG['image_size'], CONFIG['image_size'], 3)),
        
        # Conv Block 1
        layers.Conv2D(32, 3, padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2),
        
        # Conv Block 2
        layers.Conv2D(64, 3, padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2),
        
        # Conv Block 3
        layers.Conv2D(128, 3, padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling2D(),
        
        # Dense
        layers.Dropout(0.5),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(len(LABELS), activation='softmax'),
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG['learning_rate']),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

# =============================================================================
# TRAINING
# =============================================================================

def train():
    print("=" * 50)
    print("  SKIN CONDITION CLASSIFIER - PYTHON TRAINING")
    print("=" * 50)
    print(f"\nLabels: {LABELS}")
    print(f"GPU Available: {len(tf.config.list_physical_devices('GPU')) > 0}\n")
    
    # Load data
    print("Loading dataset...")
    X, y = load_dataset()
    print(f"Total images: {len(X)}")
    
    # Show distribution
    for i, label in enumerate(LABELS):
        count = int(tf.reduce_sum(tf.cast(y == i, tf.int32)))
        print(f"  {label}: {count}")
    
    # Shuffle
    indices = tf.random.shuffle(tf.range(len(X)))
    X = tf.gather(X, indices)
    y = tf.gather(y, indices)
    
    # Split
    split_idx = int(len(X) * (1 - CONFIG['validation_split']))
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    print(f"\nTrain: {len(X_train)}, Validation: {len(X_val)}")
    
    # Build model
    print("\nBuilding model...")
    model = build_model()
    model.summary()
    
    # Train
    print("\n🚀 Training started...\n")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=CONFIG['epochs'],
        batch_size=CONFIG['batch_size'],
        verbose=1
    )
    
    # Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n✅ Final validation accuracy: {val_acc*100:.1f}%")
    
    # Save
    print("\n💾 Exporting to TensorFlow.js format...")
    tfjs_path = os.path.join(CONFIG['output_path'], 'tfjs')
    os.makedirs(tfjs_path, exist_ok=True)
    
    tfjs.converters.save_keras_model(model, tfjs_path)
    print(f"  Model saved to: {tfjs_path}")
    
    # Save labels
    labels_path = os.path.join(CONFIG['output_path'], 'labels.json')
    with open(labels_path, 'w') as f:
        json.dump(LABELS, f)
    print(f"  Labels saved to: {labels_path}")
    
    print("\n✅ Training complete!")
    print(f"   Ready for browser inference at: {CONFIG['output_path']}/tfjs/")

if __name__ == '__main__':
    train()
