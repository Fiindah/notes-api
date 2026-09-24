const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { isNonEmptyString } = require("../utils/validate");
const { publicUser } = require("./auth.controller");

async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "Pengguna tidak ditemukan" });

    const [noteCount, todoDoneCount, categoryCount] = await Promise.all([
      prisma.note.count({ where: { userId: req.userId } }),
      prisma.todo.count({ where: { userId: req.userId, isDone: true } }),
      prisma.category.count({ where: { userId: req.userId } }),
    ]);

    res.json({
      ...publicUser(user),
      stats: { notes: noteCount, todosDone: todoDoneCount, categories: categoryCount },
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, avatarUrl } = req.body;
    const data = {};

    if (name !== undefined) {
      if (!isNonEmptyString(name, 2)) {
        return res.status(400).json({ message: "Nama minimal 2 karakter" });
      }
      data.name = name.trim();
    }
    if (avatarUrl !== undefined) {
      data.avatarUrl = avatarUrl || null;
    }

    const user = await prisma.user.update({ where: { id: req.userId }, data });
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!isNonEmptyString(oldPassword) || !isNonEmptyString(newPassword, 6)) {
      return res.status(400).json({ message: "Kata sandi baru minimal 6 karakter" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Kata sandi lama salah" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    await prisma.user.delete({ where: { id: req.userId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
