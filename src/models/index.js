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
      type: DataTypes.DATE, // data base da tarefa (para não recorrentes), opcional
      allowNull: true,
    },
    daytime: {
      type: DataTypes.INTEGER, // minutos desde 00:00 (0..1439)
      allowNull: false,
    },
    notify: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurring: {
      type: DataTypes.STRING(7), // flags de dias da semana, 7 chars '0'/'1' começando no Domingo
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE, // última conclusão; para recorrentes, considera concluída até a próxima ocorrência
      allowNull: true,
    },
    deleted: {
      type: DataTypes.BOOLEAN, // soft delete para sincronização
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
  }
);

// Associations
User.hasMany(Task, { foreignKey: "userId", as: "tasks", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = { sequelize, Sequelize, User, Task };
