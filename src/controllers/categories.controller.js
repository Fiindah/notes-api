const prisma = require("../lib/prisma");
const { isNonEmptyString } = require("../utils/validate");

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!isNonEmptyString(name)) {
      return res.status(400).json({ message: "Nama kategori wajib diisi" });
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), userId: req.userId },
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!isNonEmptyString(name)) {
      return res.status(400).json({ message: "Nama kategori wajib diisi" });
    }

    const category = await prisma.category.updateMany({
      where: { id, userId: req.userId },
      data: { name: name.trim() },
    });
    if (category.count === 0) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }
    res.json({ id, name: name.trim() });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const result = await prisma.category.deleteMany({ where: { id, userId: req.userId } });
    if (result.count === 0) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
