const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Board = require('../models/Board');
const User = require('../models/User');
const TaskActivity = require('../models/TaskActivity');
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
    const isOwner = board.userId && req.user._id && board.userId.toString() === req.user._id.toString();
    const hasAssignedTasks = await Task.findOne({
      boardId,
      assignee: req.user.name,
      companyId: currentUser.companyId
    });

    // Allow access if user is admin, owns the board, is assigned to it, OR has tasks assigned to them
    if (!isAdmin && !isOwner && !isAssignedToBoard && !hasAssignedTasks) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to this board.' });
    }

    // Show all tasks in the board to all users (not just assigned tasks)
    const taskQuery = { boardId, companyId: currentUser.companyId };
    
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

    // Validate status against board sections
    const taskStatus = status || board.sections[0].id; // Default to first section if no status provided
    const validStatuses = board.sections.map(s => s.id);
    if (!validStatuses.includes(taskStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const task = new Task({
      title,
      description: description || '',
      status: taskStatus,
      priority: priority || 'medium',
      assignee: assignee || '',
      userId: req.user._id,
      boardId,
      companyId: currentUser.companyId
    });

    const savedTask = await task.save();
    
    // Log activity: task created
    await TaskActivity.create({
      taskId: savedTask._id,
      userId: req.user._id,
      userName: req.user.name,
      action: 'created',
      field: 'all',
      oldValue: '',
      newValue: title
    });
    
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

    // Get current user to find their company
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has access to the board
    const board = await Board.findById(existingTask.boardId);
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

    // Check if board belongs to user's company
    if (board.companyId && board.companyId.toString() !== currentUser.companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. This board belongs to a different company.' });
    }

    // Check if user has access to the board
    const isAssignedToBoard = board.assignees && board.assignees.includes(req.user.name);
    const isBoardOwner = board.userId && req.user._id && board.userId.toString() === req.user._id.toString();
    const hasBoardAccess = isAdmin || isBoardOwner || isAssignedToBoard;

    // Check if user can edit this task
    const isTaskCreator = existingTask.userId && req.user._id && existingTask.userId.toString() === req.user._id.toString();
    const isTaskAssignee = existingTask.assignee === req.user.name;
    const canEditTask = isAdmin || isTaskCreator || isTaskAssignee;

    const updateData = {};
    const activities = [];
    
    // Check what fields are being updated
    const updatingTitle = title !== undefined && title !== existingTask.title;
    const updatingDescription = description !== undefined && description !== existingTask.description;
    const updatingStatus = status !== undefined && status !== existingTask.status;
    const updatingPriority = priority !== undefined && priority !== existingTask.priority;
    const updatingAssignee = assignee !== undefined && assignee !== existingTask.assignee;

    // Status updates (drag and drop) are allowed for anyone with board access
    // Other field updates require task creator/assignee or admin
    if (updatingTitle || updatingDescription || updatingPriority || updatingAssignee) {
      if (!canEditTask) {
        return res.status(403).json({ error: 'You do not have permission to update this task' });
      }
    }

    // Status updates require board access
    if (updatingStatus && !hasBoardAccess) {
      return res.status(403).json({ error: 'You do not have permission to move tasks in this board' });
    }
    
    if (updatingTitle) {
      updateData.title = title;
      activities.push({
        taskId: id,
        userId: req.user._id,
        userName: req.user.name,
        action: 'updated',
        field: 'title',
        oldValue: existingTask.title || '',
        newValue: title
      });
    }
    
    if (updatingDescription) {
      updateData.description = description;
      activities.push({
        taskId: id,
        userId: req.user._id,
        userName: req.user.name,
        action: 'updated',
        field: 'description',
        oldValue: existingTask.description || '',
        newValue: description || ''
      });
    }
    
    if (updatingStatus) {
      // Validate status against board sections
      const validStatuses = board.sections.map(s => s.id);
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      
      updateData.status = status;
      
      // Get section names for activity log
      const oldSection = board.sections.find(s => s.id === existingTask.status);
      const newSection = board.sections.find(s => s.id === status);
      activities.push({
        taskId: id,
        userId: req.user._id,
        userName: req.user.name,
        action: 'moved',
        field: 'status',
        oldValue: oldSection ? oldSection.name : existingTask.status,
        newValue: newSection ? newSection.name : status
      });
    }
    
    if (updatingPriority) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
      updateData.priority = priority;
      const priorityLabels = { 'low': 'Low', 'medium': 'Medium', 'high': 'High' };
      activities.push({
        taskId: id,
        userId: req.user._id,
        userName: req.user.name,
        action: 'updated',
        field: 'priority',
        oldValue: priorityLabels[existingTask.priority] || existingTask.priority,
        newValue: priorityLabels[priority] || priority
      });
    }
    
    if (updatingAssignee) {
      updateData.assignee = assignee;
      activities.push({
        taskId: id,
        userId: req.user._id,
        userName: req.user.name,
        action: 'updated',
        field: 'assignee',
        oldValue: existingTask.assignee || 'Unassigned',
        newValue: assignee || 'Unassigned'
      });
    }

    if (Object.keys(updateData).length === 0) {
      return res.json(existingTask);
    }

    updateData.updatedAt = Date.now();

    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log all activities
    if (activities.length > 0) {
      await TaskActivity.insertMany(activities);
    }

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
    
    // Log activity: task deleted
    await TaskActivity.create({
      taskId: task._id,
      userId: req.user._id,
      userName: req.user.name,
      action: 'deleted',
      field: 'all',
      oldValue: task.title,
      newValue: ''
    });
    
    // Delete the task
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id/activity - Get activity history for a task
router.get('/:id/activity', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify task exists and user has access
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get current user to find their company
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    
    // Check if user has access to this task
    const board = await Board.findById(task.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    
    // Check if board belongs to user's company
    if (board.companyId && board.companyId.toString() !== currentUser.companyId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if user owns the board, is assigned to it, OR has tasks assigned to them
    const isAssignedToBoard = board.assignees && board.assignees.includes(req.user.name);
    const isOwner = board.userId && req.user._id && board.userId.toString() === req.user._id.toString();
    const isTaskAssignee = task.assignee === req.user.name;
    
    if (!isAdmin && !isOwner && !isAssignedToBoard && !isTaskAssignee && task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Fetch activities for this task, sorted by most recent first
    const activities = await TaskActivity.find({ taskId: id })
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 activities
    
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

module.exports = router;



