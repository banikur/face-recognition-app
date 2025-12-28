/**
 * Create admin user using better-auth API
 * This ensures password is hashed correctly by better-auth
 */

import { auth } from '../src/lib/auth';

async function createAdmin() {
    try {
        console.log('Creating admin user with better-auth...');

        // Use better-auth's signUp method to create user with properly hashed password
        const result = await auth.api.signUpEmail({
            body: {
                email: 'admin@skinlab.com',
                password: 'admin123',
                name: 'Admin',
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@skinlab.com');
        console.log('Password: admin123');
        console.log('User ID:', result.user.id);
    } catch (error: any) {
        if (error.message?.includes('already exists')) {
            console.log('⚠️  Admin user already exists');
        } else {
            console.error('❌ Error creating admin:', error.message);
        }
    }
}

createAdmin();
