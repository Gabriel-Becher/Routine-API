const { UUIDV4 } = require("sequelize");
const { User } = require("../models");

module.exports = {
  // Create user
  async create(req, res, next) {
    try {
      const { id, email, password, notificationtime } = req.body;
      if (!id || !email)
        return res.status(400).json({ error: "id and email are required" });

      const user = await User.create({
        id: UUIDV4().toString(),
        email,
        password,
        notificationtime,
      });
      res.status(201).json(user);
    } catch (err) {
      if (err?.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ error: "Email already exists" });
      }
      next(err);
    }
  },

  // List users
  async list(_req, res, next) {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  // Get by id
  async get(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  // Update
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const [count] = await User.update(req.body, { where: { id } });
      if (!count) return res.status(404).json({ error: "User not found" });
      const user = await User.findByPk(id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  // Delete
  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const count = await User.destroy({ where: { id } });
      if (!count) return res.status(404).json({ error: "User not found" });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
