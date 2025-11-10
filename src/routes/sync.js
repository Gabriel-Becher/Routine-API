const { Router } = require("express");
const ctrl = require("../controllers/syncController");

const router = Router();

// Task sync only
router.get("/tasks", ctrl.getTasks);
// Option B: userId in path and body is an array of tasks; response is array
router.post("/tasks/:userId", ctrl.postTasks);
// Keep snapshot for optional use
router.post("/tasks/snapshot", ctrl.postTasksSnapshot);

module.exports = router;
