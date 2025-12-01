import db from './database';
import { 
  createSkinType, 
  createProduct, 
  createIngredient, 
  createRule,
  createAnalysisLog,
  getAllSkinTypes
} from './models';

// Clear existing data
db.exec('DELETE FROM analysis_logs');
db.exec('DELETE FROM rules');
db.exec('DELETE FROM products');
db.exec('DELETE FROM ingredients');
db.exec('DELETE FROM skin_types');

// Insert skin types
const skinTypes = [
  { name: 'Oily', description: 'Skin that produces excess sebum' },
  { name: 'Dry', description: 'Skin that lacks moisture and oil' },
  { name: 'Normal', description: 'Balanced skin with adequate moisture and oil' },
  { name: 'Combination', description: 'Skin with both oily and dry areas' },
  { name: 'Acne-prone', description: 'Skin that is susceptible to breakouts and pimples' }
];

const skinTypeIds: number[] = [];
for (const skinType of skinTypes) {
  const id = createSkinType(skinType);
  skinTypeIds.push(id);
}

console.log('Inserted skin types');

// Insert ingredients
const ingredients = [
  { name: 'Salicylic Acid', effect: 'Exfoliates and unclogs pores' },
  { name: 'Tea Tree Oil', effect: 'Natural antibacterial agent' },
  { name: 'Hyaluronic Acid', effect: 'Intense hydration' },
  { name: 'Glycerin', effect: 'Moisture retention' },
  { name: 'Aloe Vera', effect: 'Soothing and calming' },
  { name: 'Chamomile', effect: 'Anti-inflammatory properties' },
  { name: 'Niacinamide', effect: 'Reduces sebum production' },
  { name: 'Ceramides', effect: 'Strengthens skin barrier' },
  { name: 'Benzoyl Peroxide', effect: 'Kills acne-causing bacteria' }
];

for (const ingredient of ingredients) {
  createIngredient(ingredient);
}

console.log('Inserted ingredients');

// Insert products
const products = [
  { 
    name: 'Oil Control Face Wash', 
    brand: 'ClearSkin', 
    skin_type_id: skinTypeIds[0], // Oily
    description: 'Controls excess oil and prevents breakouts',
    ingredients: 'Salicylic Acid, Tea Tree Oil'
  },
  { 
    name: 'Hydrating Face Wash', 
    brand: 'MoistureGlow', 
    skin_type_id: skinTypeIds[1], // Dry
    description: 'Gentle cleanser that hydrates while cleaning',
    ingredients: 'Hyaluronic Acid, Glycerin'
  },
  { 
    name: 'Balancing Face Wash', 
    brand: 'SkinBalance', 
    skin_type_id: skinTypeIds[2], // Normal
    description: 'Maintains skin\'s natural balance',
    ingredients: 'Aloe Vera, Chamomile'
  },
  { 
    name: 'Dual Action Cleanser', 
    brand: 'ComboCare', 
    skin_type_id: skinTypeIds[3], // Combination
    description: 'Targets both oily and dry areas',
    ingredients: 'Niacinamide, Ceramides'
  },
  { 
    name: 'Anti-Acne Face Wash', 
    brand: 'ClearSkin', 
    skin_type_id: skinTypeIds[4], // Acne-prone
    description: 'Treats and prevents acne breakouts',
    ingredients: 'Benzoyl Peroxide, Salicylic Acid'
  }
];

const productIds: number[] = [];
for (const product of products) {
  const id = createProduct(product);
  productIds.push(id);
}

console.log('Inserted products');

// Insert rules
const rules = [
  { skin_type_id: skinTypeIds[0], product_id: productIds[0], confidence_score: 0.95 }, // Oily -> Oil Control
  { skin_type_id: skinTypeIds[1], product_id: productIds[1], confidence_score: 0.95 }, // Dry -> Hydrating
  { skin_type_id: skinTypeIds[2], product_id: productIds[2], confidence_score: 0.95 }, // Normal -> Balancing
  { skin_type_id: skinTypeIds[3], product_id: productIds[3], confidence_score: 0.90 }, // Combination -> Dual Action
  { skin_type_id: skinTypeIds[4], product_id: productIds[4], confidence_score: 0.95 }  // Acne-prone -> Anti-Acne
];

for (const rule of rules) {
  createRule(rule);
}

console.log('Inserted rules');

// Insert sample analysis logs
const sampleLogs = [
  { user_id: null, skin_condition_detected: 'Oily', recommended_product_id: productIds[0] },
  { user_id: null, skin_condition_detected: 'Dry', recommended_product_id: productIds[1] },
  { user_id: null, skin_condition_detected: 'Normal', recommended_product_id: productIds[2] },
  { user_id: null, skin_condition_detected: 'Combination', recommended_product_id: productIds[3] },
  { user_id: null, skin_condition_detected: 'Acne-prone', recommended_product_id: productIds[4] }
];

for (const log of sampleLogs) {
  createAnalysisLog(log);
}

console.log('Inserted sample analysis logs');
console.log('Data injection completed successfully');