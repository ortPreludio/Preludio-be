import dotenv from "dotenv";
import conectarDB from "./src/config/db.js";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 3001;

// Arranque del servidor + conexión a DB
try {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("No se pudo conectar a la base de datos:", err);
  process.exit(1);
}
