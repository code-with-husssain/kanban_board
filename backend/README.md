# Kanban Board Backend API

Express.js REST API for the Kanban Board application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kanban
NODE_ENV=development
```

3. Start the server:
```bash
npm run dev  # Development mode with nodemon
npm start    # Production mode
```

## API Endpoints

### Boards
- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create a new board
  - Body: `{ name: string, description?: string }`
- `GET /api/boards/:id` - Get a single board
- `DELETE /api/boards/:id` - Delete a board and all its tasks

### Tasks
- `GET /api/tasks/:boardId` - Get all tasks for a board
- `POST /api/tasks` - Create a new task
  - Body: `{ title: string, description?: string, status?: 'todo'|'in-progress'|'done', priority?: 'low'|'medium'|'high', boardId: string }`
- `PUT /api/tasks/:id` - Update a task
  - Body: `{ title?: string, description?: string, status?: string, priority?: string }`
- `DELETE /api/tasks/:id` - Delete a task

## Models

### Board
```javascript
{
  name: String (required),
  description: String (optional),
  createdAt: Date
}
```

### Task
```javascript
{
  title: String (required),
  description: String (optional),
  status: 'todo' | 'in-progress' | 'done' (default: 'todo'),
  priority: 'low' | 'medium' | 'high' (default: 'medium'),
  boardId: ObjectId (required, ref: 'Board'),
  createdAt: Date,
  updatedAt: Date
}
```





