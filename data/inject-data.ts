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
      w_oily: 0,
      w_dry: 0,
      w_normal: 0,
      w_acne: 0
    });
  }

  console.log('Inserted ingredients');

  // Insert products
  const products = [
    { 
      name: 'Oil Control Face Wash', 
      description: 'Controls excess oil and prevents breakouts'
    },
    { 
      name: 'Hydrating Face Wash', 
      description: 'Gentle cleanser that hydrates while cleaning'
    },
    { 
      name: 'Balancing Face Wash', 
      description: 'Maintains skin\'s natural balance'
    },
    { 
      name: 'Dual Action Cleanser', 
      description: 'Targets both oily and dry areas'
    },
    { 
      name: 'Anti-Acne Face Wash', 
      description: 'Treats and prevents acne breakouts'
    }
  ];

  const productIds: number[] = [];
  for (const product of products) {
    const id = await createProduct(product);
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
    await createRule(rule);
  }

  console.log('Inserted rules');

  // Insert sample analysis logs
  const sampleLogs = [
    { 
      user_name: 'Sample User 1',
      user_email: null,
      user_phone: null,
      user_age: 25,
      oily_score: 0.8,
      dry_score: 0.2,
      normal_score: 0.1,
      acne_score: 0.3,
      dominant_condition: 'Oily',
      recommended_product_ids: String(productIds[0])
    },
    { 
      user_name: 'Sample User 2',
      user_email: null,
      user_phone: null,
      user_age: 30,
      oily_score: 0.1,
      dry_score: 0.9,
      normal_score: 0.2,
      acne_score: 0.1,
      dominant_condition: 'Dry',
      recommended_product_ids: String(productIds[1])
    },
    { 
      user_name: 'Sample User 3',
      user_email: null,
      user_phone: null,
      user_age: 28,
      oily_score: 0.3,
      dry_score: 0.3,
      normal_score: 0.7,
      acne_score: 0.2,
      dominant_condition: 'Normal',
      recommended_product_ids: String(productIds[2])
    },
    { 
      user_name: 'Sample User 4',
      user_email: null,
      user_phone: null,
      user_age: 32,
      oily_score: 0.5,
      dry_score: 0.4,
      normal_score: 0.3,
      acne_score: 0.2,
      dominant_condition: 'Combination',
      recommended_product_ids: String(productIds[3])
    },
    { 
      user_name: 'Sample User 5',
      user_email: null,
      user_phone: null,
      user_age: 22,
      oily_score: 0.6,
      dry_score: 0.2,
      normal_score: 0.1,
      acne_score: 0.8,
      dominant_condition: 'Acne-prone',
      recommended_product_ids: String(productIds[4])
    }
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
