const { TaskLog } = require("../models");

module.exports = {
  // Create task log
  async create(req, res, next) {
    try {
      const { id, taskId, userId, completed_at } = req.body;
      if (!id || !taskId || !userId || !completed_at) {
        return res
          .status(400)
          .json({ error: "id, taskId, userId and completed_at are required" });
      }
      const log = await TaskLog.create(req.body);
      res.status(201).json(log);
    } catch (err) {
      next(err);
    }
  },

  // List logs (optional by taskId or userId)
  async list(req, res, next) {
    try {
      const { taskId, userId } = req.query;
      const where = {};
      if (taskId) where.taskId = taskId;
      if (userId) where.userId = userId;
      const logs = await TaskLog.findAll({
        where: Object.keys(where).length ? where : undefined,
      });
      res.json(logs);
    } catch (err) {
      next(err);
    }
  },

  // Get by id
  async get(req, res, next) {
    try {
      const { id } = req.params;
      const log = await TaskLog.findByPk(id);
      if (!log) return res.status(404).json({ error: "TaskLog not found" });
      res.json(log);
    } catch (err) {
      next(err);
    }
  },

  // Update
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const [count] = await TaskLog.update(req.body, { where: { id } });
      if (!count) return res.status(404).json({ error: "TaskLog not found" });
      const log = await TaskLog.findByPk(id);
      res.json(log);
    } catch (err) {
      next(err);
    }
  },

  // Delete
  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const count = await TaskLog.destroy({ where: { id } });
      if (!count) return res.status(404).json({ error: "TaskLog not found" });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
