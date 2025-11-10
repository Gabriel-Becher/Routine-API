const { Task } = require("../models");
const { serializeTask, parseIncomingTs } = require("../utils/serialization");

function computeNextOccurrence(recurring, fromDate) {
  // recurring: 7 chars '0'/'1' starting Sunday (index 0)
  if (!recurring || recurring.length !== 7) return null;
  const start = new Date(fromDate);
  for (let i = 1; i <= 7; i++) {
    const d = new Date(start.getTime());
    d.setDate(start.getDate() + i);
    const dayIndex = d.getDay(); // 0..6 Sunday..Saturday
    if (recurring[dayIndex] === "1") {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  return null;
}

async function refreshRecurringCompletion(task) {
  if (!task) return task;
  if (task.recurring && task.completedAt) {
    const nextOccur = computeNextOccurrence(task.recurring, task.completedAt);
    if (nextOccur && Date.now() >= nextOccur.getTime()) {
      // reset completion
      await task.update({ completedAt: null });
    }
  }
  return task;
}

module.exports = {
  // Create task
  async create(req, res, next) {
    try {
      const { id, userId, title } = req.body;
      if (!id || !userId || !title)
        return res
          .status(400)
          .json({ error: "id, userId and title are required" });
      // Normalize possible epoch millis for date fields
      const body = { ...req.body };
      if (
        typeof body.day === "number" ||
        (typeof body.day === "string" && /^\d+$/.test(body.day))
      ) {
        body.day = parseIncomingTs(body.day);
      }
      if (
        typeof body.completedAt === "number" ||
        (typeof body.completedAt === "string" && /^\d+$/.test(body.completedAt))
      ) {
        body.completedAt = parseIncomingTs(body.completedAt);
      }
      const task = await Task.create(body);
      res.status(201).json(serializeTask(task));
    } catch (err) {
      next(err);
    }
  },

  // List tasks (optionally by userId). Excludes soft-deleted by default.
  async list(req, res, next) {
    try {
      const { userId } = req.query;
      const where = { deleted: false };
      if (userId) where.userId = userId;
      const tasks = await Task.findAll({ where });
      for (const t of tasks) {
        await refreshRecurringCompletion(t);
      }
      res.json(tasks.map(serializeTask));
    } catch (err) {
      next(err);
    }
  },

  // Get by id
  async get(req, res, next) {
    try {
      const { id } = req.params;
      let task = await Task.findByPk(id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      if (task.deleted)
        return res.status(404).json({ error: "Task not found" });
      task = await refreshRecurringCompletion(task);
      res.json(serializeTask(task));
    } catch (err) {
      next(err);
    }
  },

  // Update
  async update(req, res, next) {
    try {
      const { id } = req.params;
      let task = await Task.findByPk(id);
      if (!task || task.deleted)
        return res.status(404).json({ error: "Task not found" });
      const body = { ...req.body };
      if (
        typeof body.day === "number" ||
        (typeof body.day === "string" && /^\d+$/.test(body.day))
      ) {
        body.day = parseIncomingTs(body.day);
      }
      if (
        typeof body.completedAt === "number" ||
        (typeof body.completedAt === "string" && /^\d+$/.test(body.completedAt))
      ) {
        body.completedAt = parseIncomingTs(body.completedAt);
      }
      await task.update(body);
      task = await refreshRecurringCompletion(task);
      res.json(serializeTask(task));
    } catch (err) {
      next(err);
    }
  },

  // Soft delete
  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const task = await Task.findByPk(id);
      if (!task || task.deleted)
        return res.status(404).json({ error: "Task not found" });
      await task.update({ deleted: true });
      res.json(serializeTask(task));
    } catch (err) {
      next(err);
    }
  },
};
