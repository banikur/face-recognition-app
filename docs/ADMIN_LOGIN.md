# Admin Login Credentials

For accessing the admin dashboard:

- **URL**: http://localhost:3000/login  
- **Email**: Set via `ADMIN_EMAIL` environment variable (default: `admin@skinlab.com`)
- **Password**: Set via `ADMIN_PASSWORD` environment variable

**Setup**:
1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` or Vercel environment variables
2. Run `npm run create-admin` to create the admin user

**Security Note**: 
- Never commit `.env.local` to git
- Use strong passwords in production
- Change default credentials before deployment
