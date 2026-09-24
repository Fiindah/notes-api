const prisma = require("../lib/prisma");
const { isNonEmptyString } = require("../utils/validate");

async function listTodos(req, res, next) {
  try {
    const { status, category } = req.query;

    const where = {
      userId: req.userId,
      ...(category ? { categoryId: category } : {}),
      ...(status === "active" ? { isDone: false } : {}),
      ...(status === "done" ? { isDone: true } : {}),
    };

    const todos = await prisma.todo.findMany({
      where,
      include: { category: true },
      orderBy: [{ isDone: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    res.json(todos);
  } catch (err) {
    next(err);
  }
}

async function createTodo(req, res, next) {
  try {
    const { title, dueDate, categoryId } = req.body;
    if (!isNonEmptyString(title)) {
      return res.status(400).json({ message: "Judul tugas wajib diisi" });
    }

    const todo = await prisma.todo.create({
      data: {
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.userId,
        categoryId: categoryId || null,
      },
      include: { category: true },
    });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

async function updateTodo(req, res, next) {
  try {
    const { title, isDone, dueDate, categoryId } = req.body;
    const data = {};
    if (title !== undefined) {
      if (!isNonEmptyString(title)) {
        return res.status(400).json({ message: "Judul tugas wajib diisi" });
      }
      data.title = title.trim();
    }
    if (isDone !== undefined) data.isDone = Boolean(isDone);
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (categoryId !== undefined) data.categoryId = categoryId || null;

    const result = await prisma.todo.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (result.count === 0) return res.status(404).json({ message: "Tugas tidak ditemukan" });

    const todo = await prisma.todo.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    res.json(todo);
  } catch (err) {
    next(err);
  }
}

async function deleteTodo(req, res, next) {
  try {
    const result = await prisma.todo.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ message: "Tugas tidak ditemukan" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listTodos, createTodo, updateTodo, deleteTodo };
