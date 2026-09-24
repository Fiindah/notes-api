function notFoundHandler(req, res) {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({ message: "Data sudah ada (duplikat)" });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Data tidak ditemukan" });
  }

  res.status(err.status || 500).json({
    message: err.message || "Terjadi kesalahan pada server",
  });
}

module.exports = { notFoundHandler, errorHandler };
