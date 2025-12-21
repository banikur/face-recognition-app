# Roadmap: CNN Face Recognition & Rule-Based Product Recommendation

## Overview

This roadmap outlines the implementation plan to upgrade the application from heuristic-based face detection to **CNN-based face recognition and detection**, while maintaining the **rule-based product recommendation system**.

---

## Current State

### ✅ Currently Implemented
- **Face Detection**: Heuristic-based (skin tone color detection)
- **Skin Classification**: Heuristic-based (brightness, redness, saturation analysis)
- **Product Recommendation**: Rule-based (keyword matching + dot product scoring)

### 🎯 Target State
- **Face Detection**: CNN-based using MediaPipe Face Detection or TensorFlow.js
- **Face Recognition**: CNN-based using trained models
- **Skin Classification**: CNN-based using trained skin classifier model
- **Product Recommendation**: Rule-based (maintained as-is)

---

## Phase 1: CNN Face Detection Implementation

### Goals
- Replace heuristic face detection with CNN-based detection
- Integrate MediaPipe Face Detection or TensorFlow.js face detection model
- Ensure real-time performance in browser

### Tasks

#### 1.1 Model Selection & Setup
- [ ] Choose face detection library:
  - Option A: MediaPipe Face Detection (lightweight, fast)
  - Option B: TensorFlow.js face detection models (more control)
- [ ] Install/verify dependencies:
  - `@mediapipe/face_detection` or `@tensorflow-models/face-detection`
  - `@tensorflow/tfjs` (already installed)
  - `@tensorflow/tfjs-backend-webgl` (already installed)

#### 1.2 Implementation
- [ ] Create face detection service in `src/lib/faceDetection.ts`
  - Load face detection model
  - Implement `detectFaces(imageData)` function
  - Return bounding boxes and confidence scores
- [ ] Update `src/lib/skinAnalyzer.ts`
  - Replace `detectFacePresence()` with CNN-based detection
  - Use detected face bounding box for skin analysis region
- [ ] Update `src/components/CameraPanel.tsx`
  - Integrate face detection in capture flow
  - Show face detection overlay/visualization

#### 1.3 Testing
- [ ] Test with various face angles
- [ ] Test with different lighting conditions
- [ ] Test with multiple faces (handle edge case)
- [ ] Verify performance (should be < 200ms per frame)

**Estimated Time**: 2-3 days

---

## Phase 2: CNN Skin Classification Integration

### Goals
- Use the existing trained CNN model (`public/models/skin-classifier/`)
- Replace heuristic skin analysis with CNN predictions
- Maintain compatibility with existing recommendation system

### Tasks

#### 2.1 Model Loading
- [ ] Load TensorFlow.js model from `public/models/skin-classifier/tfjs/`
- [ ] Verify model input/output format
- [ ] Implement model loading in `src/lib/skinAnalyzer.ts`
  - Create `loadSkinClassifier()` function
  - Handle model initialization on app start

#### 2.2 Integration
- [ ] Update `extractFeatures()` function
  - Preprocess image for CNN input (resize, normalize)
  - Run CNN inference
  - Convert model output to `SkinScores` format
- [ ] Maintain backward compatibility
  - Keep same output format (oily, dry, normal, acne scores)
  - Ensure scores are in [0, 100] range

#### 2.3 Fallback Mechanism
- [ ] Implement fallback to heuristic if model fails to load
- [ ] Add error handling for model inference failures
- [ ] Log model loading/inference errors

#### 2.4 Testing
- [ ] Test model loading on app initialization
- [ ] Test inference with various face images
- [ ] Compare CNN results with heuristic results
- [ ] Verify recommendation system still works correctly

**Estimated Time**: 2-3 days

---

## Phase 3: Face Recognition (Optional Enhancement)

### Goals
- Add face recognition capability (identify specific users)
- Store face embeddings for user identification
- Enable personalized history tracking

### Tasks

#### 3.1 Face Embedding Extraction
- [ ] Choose face recognition model:
  - Option A: TensorFlow.js face recognition model
  - Option B: MediaPipe face recognition model
- [ ] Implement face embedding extraction
  - Extract 128-dimensional face descriptor
  - Store embeddings in database

#### 3.2 Database Schema Update
- [ ] Add `face_embeddings` table or column
- [ ] Store embeddings as JSON or BLOB
- [ ] Add user identification logic

#### 3.3 Recognition Logic
- [ ] Implement face matching algorithm
  - Calculate cosine similarity between embeddings
  - Set similarity threshold (e.g., 0.6)
- [ ] Create user identification service

**Estimated Time**: 3-4 days (Optional, can be done later)

---

## Phase 4: Optimization & Polish

### Goals
- Optimize performance
- Improve user experience
- Add error handling and edge cases

### Tasks

#### 4.1 Performance Optimization
- [ ] Implement model caching
- [ ] Optimize image preprocessing
- [ ] Add request batching if needed
- [ ] Monitor memory usage

#### 4.2 User Experience
- [ ] Add loading indicators for model loading
- [ ] Show face detection visualization
- [ ] Add confidence scores display
- [ ] Improve error messages

#### 4.3 Edge Cases
- [ ] Handle no face detected scenario
- [ ] Handle multiple faces scenario
- [ ] Handle poor image quality
- [ ] Handle model loading failures

**Estimated Time**: 2-3 days

---

## Technical Architecture

### Face Detection Flow
```
User captures image
    ↓
Load face detection model (once, cached)
    ↓
Detect faces in image
    ↓
Extract face region (bounding box)
    ↓
Crop and preprocess face region
    ↓
Pass to skin classifier
```

### Skin Classification Flow
```
Face region image
    ↓
Preprocess (resize to 128x128, normalize)
    ↓
CNN inference (skin classifier model)
    ↓
Get predictions [acne, normal, oily, dry]
    ↓
Convert to SkinScores format
    ↓
Pass to recommendation system
```

### Product Recommendation Flow (Unchanged)
```
SkinScores [oily, dry, normal, acne]
    ↓
Get all products with weights
    ↓
Calculate dot product: score = S · Wp
    ↓
Sort by score descending
    ↓
Return top 3 products
```

---

## Dependencies

### Required (Already Installed)
- `@tensorflow/tfjs`: ^4.22.0
- `@tensorflow/tfjs-backend-webgl`: ^4.22.0

### To Add
- `@mediapipe/face_detection`: For face detection (if using MediaPipe)
- OR `@tensorflow-models/face-detection`: For TensorFlow.js face detection

### Model Files (Already Available)
- `public/models/skin-classifier/tfjs/`: Trained skin classification model
- `public/models/skin-classifier/labels.json`: Model labels

---

## Implementation Priority

### High Priority (Must Have)
1. ✅ Phase 1: CNN Face Detection
2. ✅ Phase 2: CNN Skin Classification

### Medium Priority (Should Have)
3. Phase 4: Optimization & Polish

### Low Priority (Nice to Have)
4. Phase 3: Face Recognition

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Face detection uses CNN model (not heuristic)
- [ ] Detection accuracy > 95% on test images
- [ ] Detection time < 200ms per frame
- [ ] Works on major browsers (Chrome, Firefox, Safari)

### Phase 2 Complete When:
- [ ] Skin classification uses CNN model
- [ ] Model loads successfully on app start
- [ ] Classification results are consistent
- [ ] Recommendation system works correctly with CNN scores

### Overall Success:
- [ ] Application uses CNN for face detection and skin classification
- [ ] Product recommendation remains rule-based (unchanged)
- [ ] Performance is acceptable (< 500ms total analysis time)
- [ ] User experience is smooth and intuitive

---

## Timeline Estimate

- **Phase 1**: 2-3 days
- **Phase 2**: 2-3 days
- **Phase 4**: 2-3 days
- **Total**: 6-9 days for core implementation

Phase 3 (Face Recognition) is optional and can be implemented later.

---

## Notes

- **Rule-based HANYA untuk Product Recommendation** - Face Detection dan Skin Classification menggunakan CNN (Deep Learning)
- **Rule-based product recommendation is maintained** - This is intentional and appropriate for this use case
- **CNN models are client-side** - All processing happens in the browser
- **Backward compatibility** - Heuristic methods can be kept as fallback
- **Model files are already trained** - No additional training needed for Phase 2

---

## Next Steps

1. Review and approve this roadmap
2. Start Phase 1: CNN Face Detection
3. Test and iterate
4. Proceed to Phase 2: CNN Skin Classification
5. Optimize and polish (Phase 4)

