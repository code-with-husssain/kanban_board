const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/boards - Fetch all boards for the authenticated user (in their company)
router.get('/', protect, async (req, res, next) => {
  try {
    // Get current user to find their company
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user doesn't have a companyId, return empty array
    if (!currentUser.companyId) {
      return res.json([]);
    }

    // Get boards created by user in their company
    const ownedBoards = await Board.find({ 
      userId: req.user._id,
      companyId: currentUser.companyId
    });
    
    // Get boards assigned to this user in their company
    const assignedBoards = await Board.find({ 
      assignees: req.user.name,
      companyId: currentUser.companyId
    });
    
    // Get boards that have tasks assigned to this user in their company
    const boardsWithAssignedTasks = await Task.distinct('boardId', {
      assignee: req.user.name,
      companyId: currentUser.companyId
    });
    
    // Get unique board IDs (owned + assigned + with assigned tasks)
    const boardIds = [
      ...ownedBoards.map(b => b._id).filter(id => id),
      ...assignedBoards.map(b => b._id).filter(id => id),
      ...boardsWithAssignedTasks.filter(id => id)
    ];
    
    // Remove duplicates and fetch all boards in the company
    const uniqueBoardIds = [...new Set(boardIds.map(id => id ? id.toString() : null).filter(id => id))];
    const boards = await Board.find({
      _id: { $in: uniqueBoardIds },
      companyId: currentUser.companyId
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

    // Ensure assignees is an array
    const assigneesArray = Array.isArray(assignees) ? assignees : (assignees ? [assignees] : []);

    const board = new Board({
      name,
      description: description || '',
      userId: req.user._id,
      companyId: currentUser.companyId,
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
    
    // Ensure board has sections (migration for existing boards)
    if (!board.sections || board.sections.length === 0) {
      board.sections = [
        { id: 'todo', name: 'To Do', order: 0 },
        { id: 'in-progress', name: 'In Progress', order: 1 },
        { id: 'testing', name: 'Testing', order: 2 },
        { id: 'done', name: 'Done', order: 3 }
      ];
      await board.save();
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

// PUT /api/boards/:id - Update a board
router.put('/:id', protect, async (req, res, next) => {
  try {
    const boardId = req.params.id;
    
    // Find the board first
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Only the board creator can update the board
    if (!board.userId || !req.user._id || board.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to update this board. Only the board creator can update it.' });
    }
    
    const { name, description, assignees } = req.body;
    
    // Update board fields
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Board name is required' });
      }
      board.name = name.trim();
    }
    
    if (description !== undefined) {
      board.description = description ? description.trim() : '';
    }
    
    if (assignees !== undefined) {
      // Ensure assignees is an array
      board.assignees = Array.isArray(assignees) ? assignees : (assignees ? [assignees] : []);
    }
    
    const updatedBoard = await board.save();
    res.json(updatedBoard);
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

// POST /api/boards/:id/sections - Add a new section (Admin only)
router.post('/:id/sections', protect, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can manage sections' });
    }

    const boardId = req.params.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Section name is required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Ensure board has sections
    if (!board.sections || board.sections.length === 0) {
      board.sections = [
        { id: 'todo', name: 'To Do', order: 0 },
        { id: 'in-progress', name: 'In Progress', order: 1 },
        { id: 'testing', name: 'Testing', order: 2 },
        { id: 'done', name: 'Done', order: 3 }
      ];
    }

    // Generate unique ID for new section
    const maxOrder = Math.max(...board.sections.map(s => s.order), -1);
    const newSectionId = `custom-${Date.now()}`;
    const newSection = {
      id: newSectionId,
      name: name.trim(),
      order: maxOrder + 1
    };

    board.sections.push(newSection);
    await board.save();

    res.status(201).json(newSection);
  } catch (error) {
    next(error);
  }
});

// PUT /api/boards/:id/sections/:sectionId - Rename a section (Admin only)
router.put('/:id/sections/:sectionId', protect, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can manage sections' });
    }

    const boardId = req.params.id;
    const sectionId = req.params.sectionId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Section name is required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Ensure board has sections
    if (!board.sections || board.sections.length === 0) {
      return res.status(404).json({ error: 'Board has no sections' });
    }

    const section = board.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    section.name = name.trim();
    await board.save();

    res.json(section);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/boards/:id/sections/:sectionId - Delete a section (Admin only)
router.delete('/:id/sections/:sectionId', protect, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can manage sections' });
    }

    const boardId = req.params.id;
    const sectionId = req.params.sectionId;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Ensure board has sections
    if (!board.sections || board.sections.length === 0) {
      return res.status(404).json({ error: 'Board has no sections' });
    }

    const section = board.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Check if tasks exist with this status
    const taskCount = await Task.countDocuments({ 
      boardId: boardId,
      status: sectionId 
    });

    if (taskCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete section. There are ${taskCount} task(s) in this section. Please move or delete them first.` 
      });
    }

    // Remove section from board
    board.sections = board.sections.filter(s => s.id !== sectionId);
    await board.save();

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;



