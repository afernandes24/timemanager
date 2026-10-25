const express = require("express");
const {
  getTasks,
  getTodayTasks,
  addTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require("../controllers/taskController");
const validateId = require("./validateId");

const router = express.Router();
router.param("id", validateId);

router.get("/", getTasks);
router.get("/today", getTodayTasks);
router.post("/", addTask);
router.put("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.delete("/:id", deleteTask);

module.exports = router;
