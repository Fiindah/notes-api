const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { isNonEmptyString, isValidEmail } = require("../utils/validate");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshExpiryDate,
} = require("../utils/jwt");

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken({ sub: user.id });
  const refreshToken = signRefreshToken({ sub: user.id });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!isNonEmptyString(name, 2)) {
      return res.status(400).json({ message: "Nama minimal 2 karakter" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Format email tidak valid" });
    }
    if (!isNonEmptyString(password, 6)) {
      return res.status(400).json({ message: "Kata sandi minimal 6 karakter" });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), password: hashed },
    });

    const tokens = await issueTokenPair(user);
    res.status(201).json({ user: publicUser(user), ...tokens });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "Email atau kata sandi tidak valid" });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: "Email atau kata sandi salah" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Email atau kata sandi salah" });
    }

    const tokens = await issueTokenPair(user);
    res.json({ user: publicUser(user), ...tokens });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!isNonEmptyString(refreshToken)) {
      return res.status(400).json({ message: "refreshToken wajib diisi" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Refresh token tidak valid atau kedaluwarsa" });
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token tidak dikenali atau sudah kedaluwarsa" });
    }

    const accessToken = signAccessToken({ sub: payload.sub });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (isNonEmptyString(refreshToken)) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, publicUser };
