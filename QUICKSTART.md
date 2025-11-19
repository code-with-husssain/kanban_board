# Quick Start Guide

Get your Kanban Board application up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account

## Step 1: Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

Backend will run on `http://localhost:5000`

## Step 2: Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URL (default: http://localhost:5000/api)
npm run dev
```

Frontend will run on `http://localhost:3000`

## Step 3: Start Using

1. Open `http://localhost:3000` in your browser
2. Click "New Board" to create your first board
3. Click on the board to open it
4. Click "Add Task" to create tasks
5. Drag and drop tasks between columns!

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod` (local) or check Atlas connection string
- Verify the `MONGODB_URI` in `backend/.env` is correct

### CORS Errors
- Ensure `NEXT_PUBLIC_API_URL` in `frontend/.env.local` matches your backend URL
- Check that backend CORS is enabled (already configured)

### Port Already in Use
- Change `PORT` in `backend/.env` to a different port
- Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` accordingly

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out the API endpoints in `backend/README.md`
- Customize the UI in `frontend/components/`

Happy organizing! 🎉





