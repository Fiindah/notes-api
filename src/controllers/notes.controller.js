const prisma = require("../lib/prisma");
const { isNonEmptyString } = require("../utils/validate");

async function listNotes(req, res, next) {
  try {
    const { category, q } = req.query;

    const where = {
      userId: req.userId,
      ...(category ? { categoryId: category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const notes = await prisma.note.findMany({
      where,
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json(notes);
  } catch (err) {
    next(err);
  }
}

async function getNote(req, res, next) {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { category: true },
    });
    if (!note) return res.status(404).json({ message: "Catatan tidak ditemukan" });
    res.json(note);
  } catch (err) {
    next(err);
  }
}

async function createNote(req, res, next) {
  try {
    const { title, body, categoryId } = req.body;
    if (!isNonEmptyString(title)) {
      return res.status(400).json({ message: "Judul catatan wajib diisi" });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        body: body || "",
        userId: req.userId,
        categoryId: categoryId || null,
      },
      include: { category: true },
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

async function updateNote(req, res, next) {
  try {
    const { title, body, categoryId } = req.body;
    const data = {};
    if (title !== undefined) {
      if (!isNonEmptyString(title)) {
        return res.status(400).json({ message: "Judul catatan wajib diisi" });
      }
      data.title = title.trim();
    }
    if (body !== undefined) data.body = body;
    if (categoryId !== undefined) data.categoryId = categoryId || null;

    const result = await prisma.note.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (result.count === 0) return res.status(404).json({ message: "Catatan tidak ditemukan" });

    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    res.json(note);
  } catch (err) {
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    const result = await prisma.note.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ message: "Catatan tidak ditemukan" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotes, getNote, createNote, updateNote, deleteNote };
