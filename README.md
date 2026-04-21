# Face Recognition Based Skincare Recommendation App

A Next.js application that provides personalized skincare product recommendations based on facial analysis using **CNN-based face recognition and detection** for skin analysis, with **rule-based product recommendation** system.

## Features

### User Features
- **Face Capture**: Upload photo or use camera to capture face
- **Skin Analysis**: Automatic detection of skin conditions (oily, dry, normal, acne-prone)
- **Product Recommendations**: Get top 3 personalized product recommendations
- **Analysis History**: All analyses are logged for reporting

### Admin Features
- **Product Management**: CRUD operations for skincare products
- **Auto Weight Mapping**: Automatic calculation of product weights based on ingredients
- **Analysis Logs**: View all user analyses with filtering options
- **Reports & Analytics**: 
  - Condition distribution statistics
  - Top recommended products
  - Export to Excel/PDF

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Face Detection**: CNN-based using MediaPipe/TensorFlow.js
- **Skin Classification**: CNN-based using trained skin classifier model
- **Product Recommendation**: Rule-based (keyword matching + dot product scoring)
- **Export**: XLSX (Excel), PDFKit (PDF)

---

## Algorithm

This section provides detailed documentation of the algorithms used in this application, suitable for academic thesis writing.

### Overview

The system employs a **hybrid approach** combining:
1. **Deep Learning (CNN)** for face detection and skin classification
2. **Rule-based system** for product recommendation

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐    ┌───────────────┐    ┌──────────────────────┐    │
│   │  Input   │───▶│ Face Detection│───▶│  Skin Classification │    │
│   │  Image   │    │    (CNN)      │    │        (CNN)         │    │
│   └──────────┘    └───────────────┘    └──────────────────────┘    │
│                                                    │                │
│                                                    ▼                │
│                                        ┌──────────────────────┐    │
│                                        │ Product Recommendation│    │
│                                        │    (Rule-based)       │    │
│                                        └──────────────────────┘    │
│                                                    │                │
│                                                    ▼                │
│                                        ┌──────────────────────┐    │
│                                        │   Top-3 Products      │    │
│                                        └──────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Algorithm 1: Face Detection (CNN-based)

#### 1.1 Description

Face detection uses **MediaPipe Face Detector** with TensorFlow.js runtime. This is a Convolutional Neural Network (CNN) model that detects face bounding boxes in images.

#### 1.2 Model Specification

| Parameter | Value |
|-----------|-------|
| Model | MediaPipe Face Detector |
| Runtime | TensorFlow.js (WebGL/CPU) |
| Model Type | Full |
| Max Faces | 1 |
| Confidence Threshold | 0.2 |

#### 1.3 Algorithm Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FACE DETECTION ALGORITHM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   START                                                          │
│     │                                                            │
│     ▼                                                            │
│   ┌─────────────────────┐                                        │
│   │  Load Input Image   │                                        │
│   │  (Video/Image/Canvas)│                                       │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │ Initialize TensorFlow│                                       │
│   │ Backend (WebGL/CPU)  │                                       │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │ Load MediaPipe Model │                                       │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │ estimateFaces(image) │                                       │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐    NO     ┌───────────────────┐       │
│   │ Face Detected?      │─────────▶│ Return: No Face    │       │
│   │ (confidence > 0.2)  │          │ faceDetected: false│       │
│   └──────────┬──────────┘          └───────────────────┘       │
│              │ YES                                              │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │ Extract Bounding Box │                                       │
│   │ (x, y, width, height)│                                       │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │ Return: Face Detected│                                       │
│   │ + Bounding Box       │                                       │
│   │ + Confidence Score   │                                       │
│   └─────────────────────┘                                        │
│                                                                  │
│   END                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.4 Pseudocode

```
ALGORITHM: FaceDetection
INPUT: Image I (HTMLVideoElement | HTMLImageElement | HTMLCanvasElement)
OUTPUT: FaceDetectionResult { boundingBox, confidence, faceDetected }

BEGIN
    1. Initialize TensorFlow.js backend
       TRY:
           tf.setBackend('webgl')
       CATCH:
           tf.setBackend('cpu')  // Fallback
       
    2. Wait for backend ready
       tf.ready()
    
    3. Load MediaPipe Face Detector model
       detector ← createDetector(MediaPipeFaceDetector, {
           runtime: 'tfjs',
           modelType: 'full',
           maxFaces: 1
       })
    
    4. Perform face detection
       faces[] ← detector.estimateFaces(I)
    
    5. Process results
       IF faces.length > 0 THEN
           face ← faces[0]
           boundingBox ← {
               x: face.box.xMin,
               y: face.box.yMin,
               width: face.box.width,
               height: face.box.height
           }
           confidence ← face.score OR 0.7 (if keypoints exist) OR 0.5
           RETURN { boundingBox, confidence, faceDetected: true }
       ELSE
           RETURN { boundingBox: null, confidence: 0, faceDetected: false }
       ENDIF
END
```

---

### Algorithm 2: Skin Classification (CNN-based)

#### 2.1 Description

Skin classification uses a **custom-trained Convolutional Neural Network (CNN)** model to classify facial skin conditions. The model outputs probability scores for 6 skin condition classes.

#### 2.2 Model Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CNN SKIN CLASSIFIER ARCHITECTURE              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Input Layer                                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Input: 128 × 128 × 3 (RGB Image)                        │   │
│   │  Normalization: [-1, 1] range                            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   Convolutional Block 1                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Conv2D: 32 filters, 3×3 kernel, ReLU activation        │   │
│   │  MaxPooling2D: 2×2 pool size                             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   Convolutional Block 2                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Conv2D: 64 filters, 3×3 kernel, ReLU activation        │   │
│   │  MaxPooling2D: 2×2 pool size                             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   Convolutional Block 3                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Conv2D: 128 filters, 3×3 kernel, ReLU activation       │   │
│   │  GlobalAveragePooling2D                                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   Fully Connected Layers                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Dense: 64 neurons, ReLU activation                     │   │
│   │  Dense: 6 neurons, Softmax activation (Output)          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   Output Layer                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  6 Classes: [acne, blackheads, clear_skin,              │   │
│   │              dark_spots, puffy_eyes, wrinkles]          │   │
│   │  Output: Softmax probabilities (sum = 1.0)              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3 Model Specification

| Parameter | Value |
|-----------|-------|
| Input Size | 128 × 128 × 3 (RGB) |
| Normalization | `pixel_value / 127.5 - 1` (range: [-1, 1]) |
| Output Classes | 6 (acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles) |
| Activation Function | ReLU (hidden), Softmax (output) |
| Model Format | TensorFlow.js (model.json + weight shards) |

#### 2.4 Mathematical Formulation

**Preprocessing:**
$$I_{normalized} = \frac{I_{RGB}}{127.5} - 1$$

Where $I_{RGB}$ is the input image with pixel values in range [0, 255], and $I_{normalized}$ is in range [-1, 1].

**Convolutional Layer:**
$$Z^{[l]} = W^{[l]} * A^{[l-1]} + b^{[l]}$$
$$A^{[l]} = ReLU(Z^{[l]}) = \max(0, Z^{[l]})$$

**Softmax Output:**
$$P(class_i) = \frac{e^{z_i}}{\sum_{j=1}^{6} e^{z_j}}$$

Where $z_i$ is the raw output (logit) for class $i$, and the sum of all probabilities equals 1.

#### 2.5 Algorithm Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 SKIN CLASSIFICATION ALGORITHM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   START                                                          │
│     │                                                            │
│     ▼                                                            │
│   ┌─────────────────────┐                                        │
│   │  Load Face Image     │                                       │
│   │  (ImageData)         │                                       │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Resize to 128×128  │                                        │
│   │  (Bilinear Interp.) │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Normalize Pixels   │                                        │
│   │  pixel/127.5 - 1    │                                        │
│   │  Range: [-1, 1]     │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Add Batch Dimension│                                        │
│   │  (1, 128, 128, 3)   │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  CNN Forward Pass   │                                        │
│   │  (TensorFlow.js)    │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Softmax Output     │                                        │
│   │  (6 probabilities)  │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Find argmax        │                                        │
│   │  (dominant class)   │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Return:            │                                        │
│   │  - Dominant Label   │                                        │
│   │  - All Probabilities│                                        │
│   │  - Confidence Score │                                        │
│   └─────────────────────┘                                        │
│                                                                  │
│   END                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.6 Pseudocode

```
ALGORITHM: SkinClassification
INPUT: ImageData I (from captured face region)
OUTPUT: CNNPrediction { label, probabilities, confidence }

CONSTANTS:
    LABELS ← ['acne', 'blackheads', 'clear_skin', 'dark_spots', 'puffy_eyes', 'wrinkles']
    IMG_SIZE ← 128

BEGIN
    1. Load CNN model (if not already loaded)
       IF model is null THEN
           model ← tf.loadLayersModel('/models/skin-classifier/tfjs/model.json')
       ENDIF
    
    2. Preprocess image using TensorFlow.js operations
       inputTensor ← tf.tidy(() => {
           pixels ← tf.browser.fromPixels(I)           // Convert to tensor
           resized ← tf.image.resizeBilinear(pixels, [128, 128])  // Resize
           normalized ← resized.div(127.5).sub(1)      // Normalize to [-1, 1]
           batched ← normalized.expandDims(0)          // Add batch dimension
           RETURN batched                              // Shape: [1, 128, 128, 3]
       })
    
    3. Perform inference
       prediction ← model.predict(inputTensor)
       probabilities ← prediction.data()               // Get probability array
    
    4. Find dominant class
       maxIndex ← argmax(probabilities)
       dominantLabel ← LABELS[maxIndex]
       confidence ← probabilities[maxIndex]
    
    5. Build probability map
       FOR i ← 0 TO 5 DO
           probabilityMap[LABELS[i]] ← probabilities[i]
       ENDFOR
    
    6. Cleanup tensors
       inputTensor.dispose()
       prediction.dispose()
    
    7. RETURN {
           label: dominantLabel,
           probabilities: probabilityMap,
           confidence: confidence
       }
END
```

#### 2.7 Score Conversion

The softmax probabilities are converted to percentage scores (0-100) for display:

```
ALGORITHM: ProbabilitiesToScores
INPUT: probabilities (object with 6 probability values)
OUTPUT: scores (object with 6 integer percentage values)

BEGIN
    FOR each condition IN [acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles] DO
        scores[condition] ← ROUND(probabilities[condition] × 100)
    ENDFOR
    RETURN scores
END
```

---

### Algorithm 3: Product Recommendation (Rule-based)

#### 3.1 Description

Product recommendation uses a **rule-based system** with:
1. **Ingredient-to-weight mapping** (keyword matching)
2. **Dot product scoring** between skin scores and product weights

#### 3.2 Ingredient Weight Mapping

Each ingredient in the database has pre-defined weights for different skin conditions:

| Ingredient Category | Example Ingredients | w_oily | w_dry | w_normal | w_acne |
|---------------------|---------------------|--------|-------|----------|--------|
| Oil Control | Salicylic Acid, Charcoal, Tea Tree, Witch Hazel | High | Low | Medium | High |
| Hydrating | Aloe Vera, Glycerin, Hyaluronic Acid, Ceramide | Low | High | Medium | Low |
| Balancing | Vitamin C, Niacinamide | Medium | Medium | High | Medium |
| Anti-Acne | Benzoyl Peroxide, Retinol, Sulfur | Medium | Low | Low | High |

#### 3.3 Product Weight Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│              PRODUCT WEIGHT CALCULATION ALGORITHM                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   START                                                          │
│     │                                                            │
│     ▼                                                            │
│   ┌─────────────────────┐                                        │
│   │  Get Product        │                                        │
│   │  Ingredient List    │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Initialize weights │                                        │
│   │  oily=0, dry=0,     │                                        │
│   │  normal=0, acne=0   │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  FOR each ingredient│◄────────────────────┐                 │
│   │  in product         │                      │                 │
│   └──────────┬──────────┘                      │                 │
│              │                                  │                 │
│              ▼                                  │                 │
│   ┌─────────────────────┐                      │                 │
│   │  Lookup ingredient  │                      │                 │
│   │  weights from DB    │                      │                 │
│   └──────────┬──────────┘                      │                 │
│              │                                  │                 │
│              ▼                                  │                 │
│   ┌─────────────────────┐                      │                 │
│   │  Accumulate weights │                      │                 │
│   │  oily += w_oily     │                      │                 │
│   │  dry += w_dry       │                      │                 │
│   │  normal += w_normal │                      │                 │
│   │  acne += w_acne     │──────────────────────┘                 │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Normalize weights  │                                        │
│   │  to [0, 1] range    │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Return normalized  │                                        │
│   │  product weights    │                                        │
│   └─────────────────────┘                                        │
│                                                                  │
│   END                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.4 Mathematical Formulation

**Weight Accumulation:**
$$W_p^{raw} = \sum_{i=1}^{n} W_i$$

Where:
- $W_p^{raw}$ = Raw product weight vector `[oily, dry, normal, acne]`
- $W_i$ = Weight vector of ingredient $i$
- $n$ = Number of ingredients in product

**Normalization:**
$$W_p = \frac{W_p^{raw}}{\max(W_p^{raw})}$$

Each component is normalized to range [0, 1] by dividing by the maximum weight value.

**Recommendation Score (Dot Product):**
$$Score(p) = S \cdot W_p = \sum_{j=1}^{4} S_j \times W_{p,j}$$

Where:
- $S$ = Skin score vector `[oily_score, dry_score, normal_score, acne_score]`
- $W_p$ = Product weight vector `[w_oily, w_dry, w_normal, w_acne]`
- Higher score indicates better match between skin condition and product

#### 3.5 Algorithm Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              PRODUCT RECOMMENDATION ALGORITHM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   START                                                          │
│     │                                                            │
│     ▼                                                            │
│   ┌─────────────────────┐                                        │
│   │  Input: Skin Scores │                                        │
│   │  S = [oily, dry,    │                                        │
│   │       normal, acne] │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Fetch all products │                                        │
│   │  from database      │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  FOR each product p │◄────────────────────┐                 │
│   └──────────┬──────────┘                      │                 │
│              │                                  │                 │
│              ▼                                  │                 │
│   ┌─────────────────────┐                      │                 │
│   │  Get product weights│                      │                 │
│   │  Wp = [w_oily,      │                      │                 │
│   │        w_dry,       │                      │                 │
│   │        w_normal,    │                      │                 │
│   │        w_acne]      │                      │                 │
│   └──────────┬──────────┘                      │                 │
│              │                                  │                 │
│              ▼                                  │                 │
│   ┌─────────────────────┐                      │                 │
│   │  Calculate score    │                      │                 │
│   │  score = S · Wp     │                      │                 │
│   │  (dot product)      │──────────────────────┘                 │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Sort products by   │                                        │
│   │  score (descending) │                                        │
│   └──────────┬──────────┘                                        │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                        │
│   │  Return Top-3       │                                        │
│   │  products           │                                        │
│   └─────────────────────┘                                        │
│                                                                  │
│   END                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.6 Pseudocode

```
ALGORITHM: ProductRecommendation
INPUT: SkinScores S = { oily, dry, normal, acne }
OUTPUT: Top3Products[] (array of 3 best-matching products)

BEGIN
    1. Convert skin scores to vector
       skinVector ← [S.oily, S.dry, S.normal, S.acne]
    
    2. Fetch all products from database
       products[] ← getAllProducts()
    
    3. Calculate recommendation score for each product
       scoredProducts ← []
       FOR each product p IN products DO
           // Get product weight vector
           productWeights ← [p.w_oily, p.w_dry, p.w_normal, p.w_acne]
           
           // Calculate dot product
           score ← 0
           FOR i ← 0 TO 3 DO
               score ← score + (skinVector[i] × productWeights[i])
           ENDFOR
           
           // Store product with score
           scoredProducts.append({ product: p, score: score })
       ENDFOR
    
    4. Sort by score in descending order
       scoredProducts.sortByDescending(item => item.score)
    
    5. Extract top 3 products
       top3 ← scoredProducts.slice(0, 3)
    
    6. RETURN top3
END
```

#### 3.7 Example Calculation

**Given:**
- Skin Scores: `S = [75, 20, 10, 60]` (oily=75%, dry=20%, normal=10%, acne=60%)
- Product A (Oil Control): `Wp = [0.9, 0.1, 0.3, 0.8]`
- Product B (Hydrating): `Wp = [0.2, 0.9, 0.5, 0.2]`

**Calculation:**
```
Score(A) = (75 × 0.9) + (20 × 0.1) + (10 × 0.3) + (60 × 0.8)
         = 67.5 + 2 + 3 + 48
         = 120.5

Score(B) = (75 × 0.2) + (20 × 0.9) + (10 × 0.5) + (60 × 0.2)
         = 15 + 18 + 5 + 12
         = 50
```

**Result:** Product A (score=120.5) is recommended over Product B (score=50) for this skin profile.

---

### Algorithm Summary Table

| Algorithm | Type | Purpose | Key Technology |
|-----------|------|---------|----------------|
| Face Detection | Deep Learning (CNN) | Detect face location in image | MediaPipe + TensorFlow.js |
| Skin Classification | Deep Learning (CNN) | Classify skin condition | Custom CNN Model |
| Product Recommendation | Rule-based | Match products to skin type | Dot Product Scoring |

---

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd face-recognition-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Initialize the database**
```bash
npm run init-db
```

This will create the database schema and seed initial product data.

4. **Set up environment variables** (optional)
```bash
cp env.example .env.local
```

Edit `.env.local` if you want to customize the admin password.

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
face-recognition-app/
├── data/
│   ├── database.db          # SQLite database
│   ├── database.ts          # Database connection
│   ├── schema.sql           # Database schema
│   ├── models.ts            # Data models and queries
│   ├── seed.ts              # Seed data
│   └── init.ts              # Database initialization
├── src/app/
│   ├── api/
│   │   ├── analysis/        # Analysis submission endpoint
│   │   ├── analysis-logs/   # Analysis logs retrieval
│   │   ├── products/        # Product CRUD endpoints
│   │   └── reports/         # Reports and export endpoints
│   ├── admin/
│   │   └── dashboard/       # Admin dashboard
│   ├── capture/             # User face capture page
│   └── page.tsx             # Home page
└── package.json
```

## Database Schema

### Products Table
- Auto-calculates weights (w_oily, w_dry, w_normal, w_acne) from ingredients
- Supports keyword-based ingredient mapping

### Analysis Logs Table
- Stores user information and skin scores
- Records recommended products
- Tracks dominant skin condition

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | Get all products |
| `/api/products` | POST | Create new product |
| `/api/products/:id` | PUT | Update product |
| `/api/products/:id` | DELETE | Delete product |
| `/api/analysis` | POST | Submit analysis and get recommendations |
| `/api/analysis-logs` | GET | Get analysis logs (with filters) |
| `/api/reports/summary` | GET | Get summary statistics |
| `/api/reports/export-xlsx` | GET | Export to Excel |
| `/api/reports/export-pdf` | GET | Export to PDF |

## Usage

### For Users

1. Navigate to home page
2. Click "Start Analysis"
3. Fill in your information (name, age, optional email/phone)
4. Capture or upload your face photo
5. Wait for analysis to complete
6. View your skin condition scores and top 3 product recommendations

### For Admins

1. Navigate to Admin Dashboard
2. **Products Tab**: Add, edit, or delete products
   - Enter ingredients (comma-separated)
   - Weights are automatically calculated
3. **Analysis Logs Tab**: View all user analyses
   - Filter by condition or date range
4. **Reports Tab**: View analytics and export data
   - See condition distribution
   - View top recommended products
   - Export to Excel or PDF

## Auto Weight Mapping

The system automatically calculates product weights based on ingredient keywords:

- **Oily/Acne**: Salicylic Acid, Charcoal, Tea Tree, Witch Hazel, Sulfur
- **Dry**: Aloe Vera, Glycerin, Hyaluronic Acid, Ceramide
- **Normal**: Vitamin C, Niacinamide
- **Acne**: Benzoyl Peroxide, Retinol, Salicylic Acid

## Skin Analysis Methods

### Face Detection & Recognition
- **CNN-based** (Deep Learning) using MediaPipe TensorFlow.js model
- Detects face bounding boxes and landmarks
- Runs entirely in browser (WebGL backend)
- Confidence threshold: 0.2

### Skin Classification
- **CNN-based** (Deep Learning) using custom trained TensorFlow.js model
- Architecture: Conv2D(32) → MaxPool → Conv2D(64) → MaxPool → Conv2D(128) → GlobalAvgPool → Dense(64) → Softmax(4)
- Model located at `public/models/skin-classifier/tfjs/`
- Input: 128×128 RGB image, normalized to [-1, 1]
- Output: Softmax probabilities for 4 classes (acne, normal, oily, dry)

**Limitations (Academic Disclosure):**
- Training dataset: ~135 images (small sample size)
- Class distribution: primarily acne/normal, limited oily/dry samples
- No clinical validation performed
- Results should not be used for medical diagnosis

### Product Recommendation
- **Rule-based** (keyword matching + dot product scoring)
- Uses ingredient-based weight mapping
- Returns top 3 matching products

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run init-db      # Initialize database
npm run lint         # Run ESLint
```

## Local Network Access

To access from other devices on the same network:

1. Find your local IP address
2. Run the dev server: `npm run dev`
3. Access from other devices: `http://YOUR_IP:3000`

## Notes

- This is a **local MVP** implementation
- No authentication system (admin password can be added via ENV)
- Images are processed client-side (not uploaded to server)
- SQLite database for simplicity
- **CNN-based face detection and skin classification** (ML models run in browser)
- **Rule-based product recommendation** (keyword matching + scoring)

## License

MIT