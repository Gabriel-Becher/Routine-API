const express = require("express");
const cors = require("cors");
const usersRoutes = require("./routes/users");
const tasksRoutes = require("./routes/tasks");
const taskLogsRoutes = require("./routes/taskLogs");

class App {
  static instance;

  constructor() {
    this.instance = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    // Allow any origin and headers
    
    this.instance.use(express.json());
  }

  routes() {
    this.instance.get("/", (req, res) => {
      res.send("Routine API is up");
    });

    this.instance.use("/users", usersRoutes);
    this.instance.use("/tasks", tasksRoutes);
    this.instance.use("/task-logs", taskLogsRoutes);

    // Not found handler
    this.instance.use((req, res) => {
      res.status(404).json({ error: "Not found" });
    });

    // Error handler
    // eslint-disable-next-line no-unused-vars
    this.instance.use((err, req, res, _next) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
  }
}

module.exports = new App().instance;
