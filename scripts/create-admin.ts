/**
 * Create admin user using better-auth API
 * This ensures password is hashed correctly by better-auth
 */

import { auth } from '../src/lib/auth';

async function createAdmin() {
    try {
        console.log('Creating admin user with better-auth...');

        // Get admin credentials from environment variables (REQUIRED)
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required. Set them in .env.local or Vercel environment variables.');
        }

        // Use better-auth's signUp method to create user with properly hashed password
        const result = await auth.api.signUpEmail({
            body: {
                email: adminEmail,
                password: adminPassword,
                name: 'Admin',
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log(`Email: ${adminEmail}`);
        console.log('Password: [set via ADMIN_PASSWORD env var]');
        if (result.user) {
            console.log('User ID:', result.user.id);
        }
    } catch (error: any) {
        if (error.message?.includes('already exists')) {
            console.log('⚠️  Admin user already exists');
        } else {
            console.error('❌ Error creating admin:', error.message);
        }
    }
}

createAdmin();
