const { Op } = require("sequelize");
const { Task } = require("../models");
const { serializeTask, parseIncomingTs } = require("../utils/serialization");

// POST /sync/tasks/:userId with body = Task[] ; returns Task[] to override locally
async function postTasks(req, res, next) {
  try {
    const { userId } = req.params;
    const incoming = Array.isArray(req.body) ? req.body : null;
    if (!userId)
      return res.status(400).json({ error: "userId param required" });
    if (!incoming)
      return res.status(400).json({ error: "Body must be an array of tasks" });

    // Normalize incoming tasks: ensure userId and convert date-like fields
    const byIdIncoming = new Map();
    for (const raw of incoming) {
      if (!raw || !raw.id) continue; // skip invalid entries quietly
      const t = { ...raw };
      t.userId = userId; // trust path param
      if (
        typeof t.day === "number" ||
        (typeof t.day === "string" && /^\d+$/.test(t.day))
      ) {
        t.day = parseIncomingTs(t.day);
      }
      if (
        typeof t.completedAt === "number" ||
        (typeof t.completedAt === "string" && /^\d+$/.test(t.completedAt))
      ) {
        t.completedAt = parseIncomingTs(t.completedAt);
      }
      const incUpdatedAtDate = parseIncomingTs(t.updatedAt);
      const incUpdatedAtMs = incUpdatedAtDate ? incUpdatedAtDate.getTime() : 0;
      t.__incUpdatedAtDate = incUpdatedAtDate; // keep for saving with silent
      t.__incUpdatedAtMs = incUpdatedAtMs; // keep for compare
      byIdIncoming.set(t.id, t);
    }

    // Load all server tasks for this user (include deleted = true to sync deletions)
    const serverTasks = await Task.findAll({ where: { userId } });
    const byIdServer = new Map(serverTasks.map((s) => [s.id, s]));

    const toReturn = [];

    // Upsert/resolve conflicts for every incoming task
    for (const [id, inc] of byIdIncoming.entries()) {
      const server = byIdServer.get(id);
      if (!server) {
        // Create new on server using incoming values and keep updatedAt from client
        const values = { ...inc };
        delete values.__incUpdatedAtDate;
        delete values.__incUpdatedAtMs;
        // If client didn't send updatedAt, set to now for consistency
        if (inc.__incUpdatedAtDate) values.updatedAt = inc.__incUpdatedAtDate;
        await Task.create(values, { silent: true });
        continue; // client already up-to-date for this task
      }

      const srvUpdatedAtMs = server.updatedAt
        ? new Date(server.updatedAt).getTime()
        : 0;
      const incUpdatedAtMs = inc.__incUpdatedAtMs || 0;

      if (incUpdatedAtMs > srvUpdatedAtMs) {
        // Client newer -> update server with incoming values, preserving client updatedAt
        const values = { ...inc };
        delete values.__incUpdatedAtDate;
        delete values.__incUpdatedAtMs;
        if (inc.__incUpdatedAtDate) values.updatedAt = inc.__incUpdatedAtDate;
        // Never change primary key
        delete values.id;
        // Ensure userId stays consistent
        values.userId = userId;
        server.set(values);
        await server.save({ silent: true });
      } else if (srvUpdatedAtMs > incUpdatedAtMs) {
        // Server newer -> add to return payload to override client
        toReturn.push(serializeTask(server));
      } else {
        // Equal timestamps: do nothing
      }
    }

    // Any server tasks that are missing on client must be returned
    for (const server of serverTasks) {
      if (!byIdIncoming.has(server.id)) {
        toReturn.push(serializeTask(server));
      }
    }

    // Deduplicate return list by id
    const seen = new Set();
    const uniqueReturn = [];
    for (const t of toReturn) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      uniqueReturn.push(t);
    }

    return res.json(uniqueReturn);
  } catch (err) {
    next(err);
  }
}

module.exports = { postTasks };
