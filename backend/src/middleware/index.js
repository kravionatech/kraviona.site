import jwt from "jsonwebtoken";
export function auth(req, res, next) {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
}
export function admin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin access required" });
  next();
}
export function editor(req, res, next) {
  if (!["editor", "admin"].includes(req.user?.role))
    return res.status(403).json({ error: "Editor access required" });
  next();
}
export function errorHandler(err, req, res, next) {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
}
