const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} = require("../controllers/todos.controller");

const router = express.Router();

router.use(requireAuth);
router.get("/", listTodos);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

module.exports = router;
