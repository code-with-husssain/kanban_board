# Admin Setup Guide

## How to Set Up Admin Users

Only users with the `admin` role can create boards. Here's how to set up an admin user:

### Step 1: Register a User

1. Go to the login page
2. Click "Sign up" to create a new account
3. Enter your name, email, and password
4. Complete registration

### Step 2: Set User as Admin

After registration, you need to set the user's role to `admin` in the database.

#### Option 1: Using npm script (Recommended)

From the `backend` directory:

```bash
cd backend
npm run set-admin <email>
```

Example:
```bash
npm run set-admin admin@example.com
```

#### Option 2: Using Node directly

```bash
cd backend
node scripts/setAdmin.js <email>
```

Example:
```bash
node scripts/setAdmin.js admin@example.com
```

#### Option 3: Using MongoDB directly

Connect to your MongoDB database and run:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Step 3: List All Users

To see all users and their roles:

```bash
cd backend
npm run list-users
```

Or:
```bash
node scripts/listUsers.js
```

### Step 4: Login as Admin

1. Go to the login page
2. Enter the email and password you used during registration
3. You should now see the "New Board" button (only visible to admins)
4. You can create boards and assign them to users

## Admin Features

- ✅ Can create boards
- ✅ Can assign boards to multiple users
- ✅ Can delete boards they created
- ✅ Can see all boards they created or are assigned to

## Regular User Features

- ❌ Cannot create boards
- ✅ Can see boards assigned to them
- ✅ Can see and manage tasks assigned to them
- ✅ Can update tasks assigned to them

## Troubleshooting

**Q: I don't see the "New Board" button**
- Make sure you've set your user role to `admin`
- Check by running `npm run list-users` in the backend directory
- Logout and login again after setting admin role

**Q: How do I know which users are admins?**
- Run `npm run list-users` to see all users and their roles

**Q: Can I have multiple admins?**
- Yes! You can set multiple users as admin using the same script

