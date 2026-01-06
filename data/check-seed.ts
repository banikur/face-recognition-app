// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

import { 
  getAllSkinTypes,
  getAllIngredients,
  getAllProducts,
  getAllRules,
  getAllAnalysisLogs
} from './models';

async function checkSeed() {
  console.log('🔍 Checking seed data in Supabase...\n');

  try {
    const skinTypes = await getAllSkinTypes();
    const ingredients = await getAllIngredients();
    const products = await getAllProducts();
    const rules = await getAllRules();
    const analysisLogs = await getAllAnalysisLogs();

    console.log('📊 Data Summary:');
    console.log(`   Skin Types: ${skinTypes.length}`);
    console.log(`   Ingredients: ${ingredients.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Rules: ${rules.length}`);
    console.log(`   Analysis Logs: ${analysisLogs.length}\n`);

    if (skinTypes.length > 0) {
      console.log('✅ Skin Types:');
      skinTypes.forEach(st => {
        console.log(`   - ${st.name} (ID: ${st.id})`);
      });
      console.log('');
    }

    if (ingredients.length > 0) {
      console.log('✅ Ingredients:');
      ingredients.slice(0, 5).forEach(ing => {
        console.log(`   - ${ing.name}`);
      });
      if (ingredients.length > 5) {
        console.log(`   ... and ${ingredients.length - 5} more`);
      }
      console.log('');
    }

    if (products.length > 0) {
      console.log('✅ Products:');
      products.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`);
      });
      console.log('');
    }

    if (rules.length > 0) {
      console.log('✅ Rules:');
      rules.forEach(r => {
        console.log(`   - Skin Type ${r.skin_type_id} → Product ${r.product_id} (confidence: ${r.confidence_score})`);
      });
      console.log('');
    }

    if (analysisLogs.length > 0) {
      console.log('✅ Analysis Logs:');
      analysisLogs.slice(0, 3).forEach(log => {
        console.log(`   - ${log.user_name} (${log.dominant_condition})`);
      });
      if (analysisLogs.length > 3) {
        console.log(`   ... and ${analysisLogs.length - 3} more`);
      }
      console.log('');
    }

    const expectedCounts = {
      skinTypes: 5,
      ingredients: 9,
      products: 5,
      rules: 5,
      analysisLogs: 5
    };

    const allSeeded = 
      skinTypes.length >= expectedCounts.skinTypes &&
      ingredients.length >= expectedCounts.ingredients &&
      products.length >= expectedCounts.products &&
      rules.length >= expectedCounts.rules &&
      analysisLogs.length >= expectedCounts.analysisLogs;

    if (allSeeded) {
      console.log('✅ All seed data is present!');
    } else {
      console.log('⚠️  Some data is missing. Run: npm run inject-data');
    }

  } catch (error) {
    console.error('❌ Error checking seed data:', error);
    if (error instanceof Error && error.message.includes('Could not find the table')) {
      console.error('\n💡 Solution: Run the migration SQL first!');
      console.error('   1. Open Supabase Dashboard → SQL Editor');
      console.error('   2. Run data/supabase-migration.sql');
      console.error('   3. Then run: npm run inject-data');
    }
    process.exit(1);
  }
}

checkSeed();
