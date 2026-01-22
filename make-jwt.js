import jwt from "jsonwebtoken";

const secret = "mGsJHKIe/jx1nhK8+I1oo0tM/stjthErM1rrrh7wiOzeS8s73gXCvY9/iMxrHZljMzVuDhPzfv4HSjD7bNXtkg=="; // paste Supabase JWT secret
const token = jwt.sign(
  { role: "service_role" },
  secret,
  { algorithm: "HS256", expiresIn: "1h" }
);

console.log("JWT:", token);
