import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct, getAllBrands, getAllIngredients } from '@/../../data/models';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brand, description, ingredients, image_url } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Find or create brand_id
    let brand_id: number | null = null;
    if (brand) {
      const brands = await getAllBrands();
      const existingBrand = brands.find(b => b.name.toLowerCase() === brand.toLowerCase());
      if (existingBrand) {
        brand_id = existingBrand.id;
      }
      // If brand doesn't exist, we could create it here, but for now we'll leave it null
    }

    // Parse ingredient_ids from ingredient names
    let ingredient_ids: number[] = [];
    if (ingredients) {
      const allIngredients = await getAllIngredients();
      const ingredientNames = typeof ingredients === 'string' 
        ? ingredients.split(',').map(i => i.trim())
        : Array.isArray(ingredients) ? ingredients : [];
      
      ingredient_ids = ingredientNames
        .map(name => {
          const ing = allIngredients.find(i => i.name.toLowerCase() === name.toLowerCase());
          return ing?.id;
        })
        .filter((id): id is number => id !== undefined);
    }

    const productId = await createProduct({
      name,
      brand_id,
      description: description || null,
      image_url: image_url || null,
      ingredient_ids: ingredient_ids.length > 0 ? ingredient_ids : undefined
    });

    return NextResponse.json(
      { id: productId, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
