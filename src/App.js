const express = require("express");
const cors = require("cors");

class App {
  static instance;

  constructor() {
    this.instance = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.instance.use(cors());
    this.instance.use(express.json());
  }

  routes() {
    this.instance.get("/", (req, res) => {
      res.send("Hello World!");
    });
  }
}

module.exports = new App().instance;
