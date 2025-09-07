const { pool } = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_ROUNDS = 10;

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, password_hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      console.error('Error: El email ya está registrado.', err);
      return res.status(409).json({ error: 'El email ya está registrado. Por favor, utiliza otro.' });
    }

    console.error('Error al registrar el usuario:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas.' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(400).json({ error: 'Credenciales inválidas.' });

    const accessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ token: accessToken });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const refreshToken = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No se proporcionó refresh token.' });

  try {
    const payload = jwt.verify(token, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ token: newAccessToken });
  } catch (err) {
    console.error('Error al refrescar el token:', err);
    res.status(403).json({ error: 'Refresh token inválido o expirado.' });
  }
};

module.exports = {
  register,
  login,
  refreshToken
};