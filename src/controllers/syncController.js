const { Op } = require("sequelize");
const { Task } = require("../models");

// Sync only for tasks. TaskLog support removed.
// GET /sync/tasks?userId=...&updated_after=...
async function getTasks(req, res, next) {
  try {
    const { userId, updated_after } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const since = updated_after
      ? new Date(isNaN(updated_after) ? updated_after : Number(updated_after))
      : null;
    const where = { userId };
    if (since) where.updatedAt = { [Op.gt]: since };
    const items = await Task.findAll({ where, order: [["updatedAt", "ASC"]] });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// POST /sync/tasks/:userId with body = Task[] ; returns Task[] to override locally
async function postTasks(req, res, next) {
  try {
    const { userId } = req.params;
    const items = req.body;
    if (!userId || !Array.isArray(items))
      return res
        .status(400)
        .json({ error: "userId path param and an array body are required" });

    // Index incoming
    const incomingMap = new Map();
    for (const t of items) {
      if (t?.id) incomingMap.set(t.id, t);
    }

    // Load server snapshot for this user
    const serverTasks = await Task.findAll({ where: { userId } });
    const serverMap = new Map(serverTasks.map((t) => [t.id, t]));

    // Apply incoming changes
    const applied = [];
    for (const t of items) {
      if (!t?.id) continue;
      t.userId = t.userId || userId;
      const incomingUpdatedAt = t.updatedAt
        ? new Date(t.updatedAt)
        : new Date();
      const existing = serverMap.get(t.id);
      if (!existing) {
        const created = await Task.create({
          ...t,
          updatedAt: incomingUpdatedAt,
        });
        serverMap.set(created.id, created);
        applied.push(created);
        continue;
      }
      if (incomingUpdatedAt > existing.updatedAt) {
        await existing.update(
          { ...t, updatedAt: incomingUpdatedAt },
          { silent: true }
        );
        applied.push(existing);
      }
    }

    // Build overrides: tasks not sent by client OR server has newer version
    const override = [];
    for (const [id, srv] of serverMap.entries()) {
      const incoming = incomingMap.get(id);
      if (!incoming) {
        override.push(srv);
        continue;
      }
      const incomingUpdatedAt = incoming.updatedAt
        ? new Date(incoming.updatedAt)
        : null;
      if (!incomingUpdatedAt || srv.updatedAt > incomingUpdatedAt) {
        override.push(srv);
      }
    }

    // Return only one list for the app to overwrite locally
    // Return only the array expected by the mobile client
    res.json(override);
  } catch (err) {
    next(err);
  }
}

// POST /sync/tasks/snapshot { userId, items: Task[] }
// Recebe a lista completa de tarefas do app. Para cada item:
//  - Cria se não existir
//  - Atualiza se incoming.updatedAt > existing.updatedAt
//  - Não altera se incoming está desatualizado
// Ao final, devolve os registros do servidor que devem sobrescrever o cliente:
//  - Os que o servidor considera mais recentes que os itens enviados pelo cliente (conflitos),
//  - E também quaisquer tarefas do servidor pertencentes ao userId que o cliente não enviou.
async function postTasksSnapshot(req, res, next) {
  try {
    const { userId, items } = req.body || {};
    if (!userId || !Array.isArray(items)) {
      return res.status(400).json({ error: "userId and items[] are required" });
    }

    // Index incoming by id para comparação rápida
    const incomingMap = new Map();
    for (const t of items) {
      if (t?.id) incomingMap.set(t.id, t);
    }

    // 1) Carrega todas as tarefas do servidor desse usuário
    const serverTasks = await Task.findAll({ where: { userId } });
    const serverMap = new Map(serverTasks.map((t) => [t.id, t]));

    // 2) Aplica itens incoming (create/update if newer)
    for (const t of items) {
      if (!t?.id) continue;
      t.userId = t.userId || userId;
      const incomingUpdatedAt = t.updatedAt
        ? new Date(t.updatedAt)
        : new Date();
      const existing = serverMap.get(t.id);
      if (!existing) {
        const created = await Task.create({
          ...t,
          updatedAt: incomingUpdatedAt,
        });
        serverMap.set(created.id, created);
        continue;
      }
      if (incomingUpdatedAt > existing.updatedAt) {
        await existing.update(
          { ...t, updatedAt: incomingUpdatedAt },
          { silent: true }
        );
      }
    }

    // 3) Calcula o que deve sobrescrever o cliente
    const toOverride = [];
    for (const [id, srv] of serverMap.entries()) {
      const incoming = incomingMap.get(id);
      if (!incoming) {
        // Cliente não enviou essa tarefa -> precisa baixar do servidor
        toOverride.push(srv);
        continue;
      }
      const incomingUpdatedAt = incoming.updatedAt
        ? new Date(incoming.updatedAt)
        : null;
      if (!incomingUpdatedAt || srv.updatedAt > incomingUpdatedAt) {
        // Servidor tem versão mais recente
        toOverride.push(srv);
      }
    }

    res.json({ override: toOverride });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTasks, postTasks, postTasksSnapshot };
