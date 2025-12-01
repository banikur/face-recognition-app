import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/../../data/models';

export async function GET() {
  try {
    const products = getAllProducts();
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

    if (!name || !brand || !ingredients) {
      return NextResponse.json(
        { error: 'Missing required fields: name, brand, ingredients' },
        { status: 400 }
      );
    }

    const productId = createProduct({
      name,
      brand,
      description: description || '',
      ingredients,
      image_url: image_url || ''
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
