const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// GET /api/boards - Fetch all boards for the authenticated user
router.get('/', protect, async (req, res, next) => {
  try {
    // Get boards created by user
    const ownedBoards = await Board.find({ userId: req.user._id });
    
    // Get boards assigned to this user
    const assignedBoards = await Board.find({ assignees: req.user.name });
    
    // Get boards that have tasks assigned to this user
    const boardsWithAssignedTasks = await Task.distinct('boardId', {
      assignee: req.user.name
    });
    
    // Get unique board IDs (owned + assigned + with assigned tasks)
    const boardIds = [
      ...ownedBoards.map(b => b._id).filter(id => id),
      ...assignedBoards.map(b => b._id).filter(id => id),
      ...boardsWithAssignedTasks.filter(id => id)
    ];
    
    // Remove duplicates and fetch all boards
    const uniqueBoardIds = [...new Set(boardIds.map(id => id ? id.toString() : null).filter(id => id))];
    const boards = await Board.find({
      _id: { $in: uniqueBoardIds }
    }).sort({ createdAt: -1 });
    
    res.json(boards);
  } catch (error) {
    next(error);
  }
});

// POST /api/boards - Create a new board (Admin only)
router.post('/', protect, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create boards' });
    }

    const { name, description, assignees } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Board name is required' });
    }

    // Ensure assignees is an array
    const assigneesArray = Array.isArray(assignees) ? assignees : (assignees ? [assignees] : []);

    const board = new Board({
      name,
      description: description || '',
      userId: req.user._id,
      assignees: assigneesArray
    });

    const savedBoard = await board.save();
    res.status(201).json(savedBoard);
  } catch (error) {
    next(error);
  }
});

// GET /api/boards/:id - Get a single board
router.get('/:id', protect, async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Check if user owns the board, is assigned to it, OR has tasks assigned to them
    const isAssignedToBoard = board.assignees && board.assignees.includes(req.user.name);
    const hasAssignedTasks = await Task.findOne({
      boardId: req.params.id,
      assignee: req.user.name
    });
    
    // Allow access if user owns the board, is assigned to it, OR has tasks assigned to them
    const isOwner = board.userId && req.user._id && board.userId.toString() === req.user._id.toString();
    if (!isOwner && !isAssignedToBoard && !hasAssignedTasks) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to this board.' });
    }
    
    res.json(board);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/boards/:id - Delete a board and its tasks
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const boardId = req.params.id;
    
    // Find the board first
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Only the board creator can delete the board (not assigned users)
    if (!board.userId || !req.user._id || board.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to delete this board. Only the board creator can delete it.' });
    }
    
    // Delete all tasks associated with this board (regardless of who created them)
    await Task.deleteMany({ boardId });
    
    // Delete the board
    await Board.findByIdAndDelete(boardId);
    
    res.json({ message: 'Board and associated tasks deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;



