# Kanban Board Application

A full-stack Kanban board application built with Next.js (App Router), Express.js, and MongoDB. This modern task management tool allows you to organize your work with drag-and-drop functionality, dark mode support, and a beautiful UI.

## 🚀 Features

- **Modern Kanban UI**: Trello/Jira-style interface with drag-and-drop functionality
- **Multiple Boards**: Create and manage multiple Kanban boards
- **Task Management**: Create, update, delete, and move tasks between columns
- **Task Properties**: Each task includes title, description, status, priority, and timestamps
- **Dark/Light Mode**: Toggle between themes with smooth transitions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Powered by Framer Motion for delightful interactions
- **Toast Notifications**: User-friendly feedback with react-hot-toast
- **Loading States**: Skeleton loaders for better UX

## 📁 Project Structure

```
kanban-board/
├── backend/              # Express.js API server
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models (Board, Task)
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   └── server.js        # Entry point
├── frontend/            # Next.js application
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── lib/             # API client and utilities
│   ├── store/           # Zustand state management
│   └── public/          # Static assets
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (State management)
- **Axios** (HTTP client)
- **react-beautiful-dnd** (Drag and drop)
- **Framer Motion** (Animations)
- **react-hot-toast** (Notifications)
- **lucide-react** (Icons)

### Backend
- **Express.js**
- **MongoDB** with **Mongoose**
- **CORS** middleware
- **dotenv** (Environment variables)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kanban
NODE_ENV=development
```

For MongoDB Atlas, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kanban
```

5. Start the backend server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎯 Usage

1. **Create a Board**: Click "New Board" in the header to create your first board
2. **Select a Board**: Click on any board card to open it
3. **Create Tasks**: Click "Add Task" in the "To Do" column
4. **Move Tasks**: Drag and drop tasks between columns
5. **Edit Tasks**: Click on any task card to edit its details
5. **Toggle Theme**: Click the moon/sun icon in the header

## 📡 API Endpoints

### Boards
- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get a single board
- `DELETE /api/boards/:id` - Delete a board

### Tasks
- `GET /api/tasks/:boardId` - Get all tasks for a board
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## 🚢 Deployment

### Backend (Render/Heroku)

1. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: Server port (usually auto-set by platform)
   - `NODE_ENV`: `production`

2. Deploy to Render:
   - Connect your repository
   - Set build command: `npm install`
   - Set start command: `npm start`

### Frontend (Vercel)

1. Import your repository to Vercel
2. Set environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
3. Deploy

## 🔒 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kanban
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, please open an issue in the repository.

---

Built with ❤️ using Next.js, Express.js, and MongoDB





