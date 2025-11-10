// Helpers to serialize Sequelize models to JSON with epoch millis for dates

const toEpoch = (d) => (d ? new Date(d).getTime() : null);

function serializeTask(taskOrPlain) {
  const t = taskOrPlain?.get ? taskOrPlain.get({ plain: true }) : taskOrPlain;
  if (!t) return t;
  return {
    ...t,
    day: toEpoch(t.day),
    completedAt: toEpoch(t.completedAt),
    createdAt: toEpoch(t.createdAt),
    updatedAt: toEpoch(t.updatedAt),
  };
}

function parseIncomingTs(v) {
  if (v == null) return null;
  if (typeof v === "number") return new Date(v);
  const n = Number(v);
  if (!Number.isNaN(n) && String(n) === String(v)) return new Date(n);
  return new Date(v);
}

module.exports = { serializeTask, toEpoch, parseIncomingTs };
// Serialize user (createdAt/updatedAt) if present
function serializeUser(user) {
  const u = user?.get ? user.get({ plain: true }) : user;
  if (!u) return u;
  return {
    ...u,
    createdAt: toEpoch(u.createdAt),
    updatedAt: toEpoch(u.updatedAt),
  };
}

module.exports.serializeUser = serializeUser;
