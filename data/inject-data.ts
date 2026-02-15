// Load environment variables from .env.local FIRST, before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file - MUST be done before importing models (which imports supabaseClient)
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

// Now we can safely import models (which will import supabaseClient)
import { 
  createSkinType, 
  createProduct, 
  createIngredient, 
  createRule,
  createAnalysisLog
} from './models';

async function injectData() {
  console.log('Starting data injection...\n');

  // Insert skin types (6 CNN conditions)
  const skinTypes = [
    { name: 'acne', description: 'Skin with acne breakouts' },
    { name: 'blackheads', description: 'Skin with blackheads' },
    { name: 'clear_skin', description: 'Healthy clear skin' },
    { name: 'dark_spots', description: 'Skin with hyperpigmentation' },
    { name: 'puffy_eyes', description: 'Skin with puffy eyes area' },
    { name: 'wrinkles', description: 'Skin with fine lines and wrinkles' }
  ];

  const skinTypeIds: number[] = [];
  for (const skinType of skinTypes) {
    const id = await createSkinType(skinType);
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
    await createIngredient({
      ...ingredient,
      w_acne: 0,
      w_blackheads: 0,
      w_clear_skin: 0,
      w_dark_spots: 0,
      w_puffy_eyes: 0,
      w_wrinkles: 0
    });
  }

  console.log('Inserted ingredients');

  // Insert products (6 CNN categories)
  const products = [
    { name: 'Oil Control Face Wash', description: 'Controls oil and prevents breakouts' },
    { name: 'Hydrating Face Wash', description: 'Gentle cleanser that hydrates' },
    { name: 'Balancing Face Wash', description: 'Maintains skin balance' },
    { name: 'Anti-Acne Face Wash', description: 'Treats and prevents acne' },
    { name: 'Brightening Cleanser', description: 'Targets dark spots' },
    { name: 'Anti-Aging Face Wash', description: 'Reduces wrinkles' }
  ];

  const productIds: number[] = [];
  for (const product of products) {
    const id = await createProduct(product);
    productIds.push(id);
  }

  console.log('Inserted products');

  // Insert rules (map 6 conditions to products)
  const rules = [
    { skin_type_id: skinTypeIds[0], product_id: productIds[3], confidence_score: 0.95 }, // acne -> Anti-Acne
    { skin_type_id: skinTypeIds[1], product_id: productIds[0], confidence_score: 0.95 }, // blackheads -> Oil Control
    { skin_type_id: skinTypeIds[2], product_id: productIds[2], confidence_score: 0.95 }, // clear_skin -> Balancing
    { skin_type_id: skinTypeIds[3], product_id: productIds[4], confidence_score: 0.95 }, // dark_spots -> Brightening
    { skin_type_id: skinTypeIds[4], product_id: productIds[1], confidence_score: 0.95 }, // puffy_eyes -> Hydrating
    { skin_type_id: skinTypeIds[5], product_id: productIds[5], confidence_score: 0.95 }  // wrinkles -> Anti-Aging
  ];

  for (const rule of rules) {
    await createRule(rule);
  }

  console.log('Inserted rules');

  // Insert sample analysis logs (6 CNN scores)
  const sampleLogs = [
    { user_name: 'Sample User 1', user_email: null, user_phone: null, user_age: 25, acne_score: 0.8, blackheads_score: 0.2, clear_skin_score: 0.1, dark_spots_score: 0.1, puffy_eyes_score: 0.1, wrinkles_score: 0.1, dominant_condition: 'acne', recommended_product_ids: String(productIds[3]) },
    { user_name: 'Sample User 2', user_email: null, user_phone: null, user_age: 30, acne_score: 0.1, blackheads_score: 0.9, clear_skin_score: 0.2, dark_spots_score: 0.1, puffy_eyes_score: 0.1, wrinkles_score: 0.1, dominant_condition: 'blackheads', recommended_product_ids: String(productIds[0]) },
    { user_name: 'Sample User 3', user_email: null, user_phone: null, user_age: 28, acne_score: 0.2, blackheads_score: 0.2, clear_skin_score: 0.8, dark_spots_score: 0.1, puffy_eyes_score: 0.1, wrinkles_score: 0.2, dominant_condition: 'clear_skin', recommended_product_ids: String(productIds[2]) },
    { user_name: 'Sample User 4', user_email: null, user_phone: null, user_age: 32, acne_score: 0.2, blackheads_score: 0.1, clear_skin_score: 0.3, dark_spots_score: 0.7, puffy_eyes_score: 0.2, wrinkles_score: 0.3, dominant_condition: 'dark_spots', recommended_product_ids: String(productIds[4]) },
    { user_name: 'Sample User 5', user_email: null, user_phone: null, user_age: 22, acne_score: 0.6, blackheads_score: 0.5, clear_skin_score: 0.1, dark_spots_score: 0.1, puffy_eyes_score: 0.1, wrinkles_score: 0.1, dominant_condition: 'acne', recommended_product_ids: String(productIds[3]) }
  ];

  for (const log of sampleLogs) {
    await createAnalysisLog(log);
  }

  console.log('Inserted sample analysis logs');
  console.log('\n✅ Data injection completed successfully!');
}

// Run the injection
injectData().catch(error => {
  console.error('Error during data injection:', error);
  process.exit(1);
});
