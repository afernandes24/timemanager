// Sprawdzenie, czy parametr :id w adresie jest dodatnią liczbą całkowitą
module.exports = (req, res, next, id) => {
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return res.status(400).json({ message: "Nieprawidłowy identyfikator" });
  }
  next();
};
