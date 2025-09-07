const { pool } = require('../db/db');

// Nueva función para obtener al usuario autenticado
const getAuthenticatedUser = async (req, res) => {
    // El middleware authenticateJWT ya ha verificado el token y
    // ha guardado el payload del JWT en req.user
    const userId = req.user.id; 

    try {
        const result = await pool.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [userId]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // Devolvemos solo la información necesaria
        res.json(user);
    } catch (err) {
        console.error('Error al obtener el usuario:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, created_at FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener los usuarios:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { getAuthenticatedUser, getAllUsers };