import serverless from "serverless-http";
import conectarDB from "../../src/config/db.js";
import app from "../../src/app.js";

// Conectar a la base de datos fuera del handler para reusar la conexión
conectarDB();

// Configurar serverless-http para Netlify
export const handler = serverless(app, {
    request(request, event, context) {
        // Netlify pasa el body como string en event.body
        // Lo parseamos aquí antes de que llegue a Express
        if (event.body && typeof event.body === 'string') {
            try {
                request.body = JSON.parse(event.body);
            } catch (e) {
                console.error('Error parsing body:', e);
            }
        }
    }
});
