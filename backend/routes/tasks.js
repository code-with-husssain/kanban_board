const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Board = require('../models/Board');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/tasks/:boardId - Fetch all tasks for a board
router.get('/:boardId', protect, async (req, res, next) => {
  try {
    const { boardId } = req.params;
    
    // Get current user to find their company
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user doesn't have a companyId, return empty array
    if (!currentUser.companyId) {
      return res.json([]);
    }
    
    // Verify board exists and belongs to user's company
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if board belongs to user's company
    if (board.companyId && board.companyId.toString() !== currentUser.companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. This board belongs to a different company.' });
    }

    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    
    // Check if user owns the board, is assigned to it, OR has tasks assigned to them
    const isAssignedToBoard = board.assignees && board.assignees.includes(req.user.name);
    const hasAssignedTasks = await Task.findOne({
      boardId,
      assignee: req.user.name,
      companyId: currentUser.companyId
    });

    // Allow access if user is admin, owns the board, is assigned to it, OR has tasks assigned to them
    const isOwner = board.userId && req.user._id && board.userId.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner && !isAssignedToBoard && !hasAssignedTasks) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to this board.' });
    }

    // Admins see all tasks in the board, regular users only see tasks assigned to them
    const taskQuery = isAdmin 
      ? { boardId, companyId: currentUser.companyId } // Admin: all tasks in the board
      : { boardId, assignee: req.user.name, companyId: currentUser.companyId }; // Regular user: only tasks assigned to them
    
    const tasks = await Task.find(taskQuery).sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Create a task
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee, boardId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }

    // Get current user to find their company
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user doesn't have a companyId, create a default company
    if (!currentUser.companyId) {
      const Company = require('../models/Company');
      const defaultCompany = await Company.create({
        name: `${currentUser.name}'s Company`
      });
      currentUser.companyId = defaultCompany._id;
      await currentUser.save();
    }

    // Verify board exists and belongs to user's company
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if board belongs to user's company
    if (board.companyId && board.companyId.toString() !== currentUser.companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. This board belongs to a different company.' });
    }
    
    // Check if user is admin OR owns the board OR is assigned to the board
    const isAdmin = req.user.role === 'admin';
    const isOwner = board.userId && req.user._id && board.userId.toString() === req.user._id.toString();
    const isAssigned = board.assignees && board.assignees.includes(req.user.name);
    
    if (!isAdmin && !isOwner && !isAssigned) {
      return res.status(403).json({ error: 'You do not have permission to create tasks in this board' });
    }

    const task = new Task({
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || '',
      userId: req.user._id,
      boardId,
      companyId: currentUser.companyId
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignee } = req.body;

    // Check if user is admin
    const isAdmin = req.user.role === 'admin';

    // Verify task exists
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Admins can update any task, regular users can only update tasks assigned to them
    if (!isAdmin && existingTask.assignee !== req.user.name) {
      return res.status(403).json({ error: 'You do not have permission to update this task' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      if (!['todo', 'in-progress', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updateData.status = status;
    }
    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
      updateData.priority = priority;
    }
    if (assignee !== undefined) updateData.assignee = assignee;

    updateData.updatedAt = Date.now();

    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', protect, async (req, res, next) => {
  try {
    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    
    // Find the task
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Admins can delete any task, regular users can only delete tasks they created
    if (!isAdmin && task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to delete this task' });
    }
    
    // Delete the task
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;



