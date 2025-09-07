// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDbMiddleware } = require('./db/db');
const { refreshToken } = require('./controllers/auth.controller');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const generalRoutes = require('./routes/general.routes');
const funcpublicRoutes = require('./routes/funcpublic.routes');
const itaipuRoutes = require('./routes/itaipu.routes');
const abogadosRoutes = require('./routes/abogados.routes');
// --- Importa las nuevas rutas de docentes ---
const docentesRoutes = require('./routes/docentes.routes');

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000', // ajustá según tu front-end
  credentials: true // necesario para enviar cookies
}));
app.use(express.json());
app.use(cookieParser());
app.use(connectDbMiddleware);

// Rutas API
app.get('/', (req, res) => {
  res.send('¡Servidor del backend en funcionamiento!');
});

app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', generalRoutes);
app.use('/api', funcpublicRoutes);
app.use('/api', itaipuRoutes);
app.use('/api', abogadosRoutes);
// --- Agrega las nuevas rutas a tu aplicación ---
app.use('/api', docentesRoutes);

// Endpoint de refresh token
app.post('/api/refresh', refreshToken);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en el puerto ${PORT}`);
});

// Cierre limpio del servidor
process.on('SIGINT', () => {
  console.log('Servidor cerrado.');
  process.exit(0);
});