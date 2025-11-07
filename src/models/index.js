const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");

// Initialize Sequelize using a local SQLite file
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.resolve(__dirname, "..", "..", "database.sqlite"),
  logging: false,
});

// User model
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false, // UUID comes from the Android client
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

// Task model
const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false, // UUID from client
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    day: {
      type: DataTypes.DATE, // timestamp
      allowNull: true,
    },
    daytime: {
      type: DataTypes.INTEGER, // minutes since midnight
      allowNull: false,
    },
    notify: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurring: {
      type: DataTypes.STRING(7), // days of week flags
      allowNull: true,
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
  }
);

// TaskLog model
const TaskLog = sequelize.define(
  "TaskLog",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false, // UUID from client
    },
    taskId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: "tasks", key: "id" },
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    tableName: "task_logs",
    timestamps: true,
  }
);

// Associations
User.hasMany(Task, { foreignKey: "userId", as: "tasks", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(TaskLog, {
  foreignKey: "userId",
  as: "taskLogs",
  onDelete: "CASCADE",
});
TaskLog.belongsTo(User, { foreignKey: "userId", as: "user" });

Task.hasMany(TaskLog, {
  foreignKey: "taskId",
  as: "logs",
  onDelete: "CASCADE",
});
TaskLog.belongsTo(Task, { foreignKey: "taskId", as: "task" });

module.exports = { sequelize, Sequelize, User, Task, TaskLog };
