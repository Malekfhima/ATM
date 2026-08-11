const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      // L'utilisateur a peut-être été supprimé après l'émission du jeton
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Non autorisé, utilisateur introuvable" });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ message: "Non autorisé, jeton invalide" });
    }
  }

  return res.status(401).json({ message: "Non autorisé, jeton manquant" });
};
