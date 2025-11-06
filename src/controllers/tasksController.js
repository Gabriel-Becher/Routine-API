const { Task } = require("../models");

module.exports = {
  // Create task
  async create(req, res, next) {
    try {
      const { id, userId, title } = req.body;
      if (!id || !userId || !title)
        return res
          .status(400)
          .json({ error: "id, userId and title are required" });
      const task = await Task.create(req.body);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  },

  // List tasks (optionally by userId)
  async list(req, res, next) {
    try {
      const { userId } = req.query;
      const where = userId ? { userId } : undefined;
      const tasks = await Task.findAll({ where });
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  },

  // Get by id
  async get(req, res, next) {
    try {
      const { id } = req.params;
      const task = await Task.findByPk(id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (err) {
      next(err);
    }
  },

  // Update
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const [count] = await Task.update(req.body, { where: { id } });
      if (!count) return res.status(404).json({ error: "Task not found" });
      const task = await Task.findByPk(id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  },

  // Delete
  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const count = await Task.destroy({ where: { id } });
      if (!count) return res.status(404).json({ error: "Task not found" });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
