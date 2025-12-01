import { createProduct } from './models';

// Seed products with auto weight calculation
const products = [
  {
    name: 'Oil Control Face Wash',
    brand: 'ClearSkin',
    description: 'Controls excess oil and prevents breakouts',
    ingredients: 'Salicylic Acid, Tea Tree Oil, Charcoal',
    image_url: '/images/oil-control.jpg'
  },
  {
    name: 'Hydrating Face Wash',
    brand: 'MoistureGlow',
    description: 'Gentle cleanser that hydrates while cleaning',
    ingredients: 'Hyaluronic Acid, Glycerin, Aloe Vera, Ceramide',
    image_url: '/images/hydrating.jpg'
  },
  {
    name: 'Balancing Face Wash',
    brand: 'SkinBalance',
    description: 'Maintains skin\'s natural balance',
    ingredients: 'Aloe Vera, Vitamin C, Niacinamide',
    image_url: '/images/balancing.jpg'
  },
  {
    name: 'Anti-Acne Face Wash',
    brand: 'ClearSkin',
    description: 'Treats and prevents acne breakouts',
    ingredients: 'Benzoyl Peroxide, Salicylic Acid, Tea Tree Oil, Sulfur',
    image_url: '/images/anti-acne.jpg'
  },
  {
    name: 'Deep Cleansing Charcoal Wash',
    brand: 'PureDetox',
    description: 'Deep cleans pores and removes impurities',
    ingredients: 'Charcoal, Witch Hazel, Menthol',
    image_url: '/images/charcoal.jpg'
  },
  {
    name: 'Gentle Moisturizing Cleanser',
    brand: 'SoftTouch',
    description: 'Ultra-gentle formula for sensitive dry skin',
    ingredients: 'Glycerin, Ceramide, Hyaluronic Acid',
    image_url: '/images/gentle.jpg'
  },
  {
    name: 'Retinol Renewal Face Wash',
    brand: 'YouthRevive',
    description: 'Anti-aging cleanser with retinol',
    ingredients: 'Retinol, Niacinamide, Vitamin C',
    image_url: '/images/retinol.jpg'
  }
];

for (const product of products) {
  try {
    createProduct(product);
  } catch (error) {
    console.log(`Product ${product.name} already exists or error occurred`);
  }
}

console.log('Database seeded successfully with', products.length, 'products');