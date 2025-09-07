const { pool } = require('../db/db');

// Función principal para obtener datos con paginación, búsqueda y ordenamiento
const getGeneralData = async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, search = '' } = req.query;

        // CORRECCIÓN 1: Parsear el parámetro sortBy
        let sortBy = [];
        if (req.query.sortBy) {
            try {
                // El front-end envía sortBy como una cadena JSON, debemos parsearla.
                sortBy = JSON.parse(req.query.sortBy);
            } catch (error) {
                console.error("Error al parsear el parámetro sortBy:", error);
            }
        }

        // Calcular OFFSET para la paginación
        const limit = parseInt(itemsPerPage);
        const offset = (parseInt(page) - 1) * limit;

        // Lógica de búsqueda avanzada con índice GIN
        let whereClause = '';
        const queryParams = [];
        let paramIndex = 1;

        if (search) {
            // CORRECCIÓN 2: Filtrar los términos de búsqueda vacíos.
            const searchTerms = search.split(/\s+/).filter(term => term);
            if (searchTerms.length > 0) {
                whereClause = `WHERE search_vector @@ to_tsquery('spanish', $${paramIndex})`;
                queryParams.push(searchTerms.map(t => `${t}:*`).join(' & '));
                paramIndex++;
            }
        }
        
        // Lógica de ordenamiento dinámico
        let orderByClause = 'ORDER BY nombres ASC'; // Ordenamiento por defecto
        if (sortBy.length) {
            const sortKey = sortBy[0].key;
            const sortOrder = sortBy[0].order === 'desc' ? 'DESC' : 'ASC';
            
            // Validar los campos de ordenamiento para evitar inyección SQL
            const validSortFields = ['id', 'nombres', 'apellidos', 'cedula', 'telefono'];
            if (validSortFields.includes(sortKey)) {
                orderByClause = `ORDER BY ${sortKey} ${sortOrder}`;
            }
        }

        // 1. Obtener el total de registros (para 'items-length')
        const countQuery = `SELECT COUNT(*) FROM general ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);

        // 2. Obtener los registros de la página actual
        const dataQuery = `
SELECT
    id,
    nombres,
    apellidos,
    cedula,
    telefono,
    completo
FROM
    general
${whereClause}
${orderByClause}
LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
`;
        
        queryParams.push(limit);
        queryParams.push(offset);

        const dataResult = await pool.query(dataQuery, queryParams);
        const items = dataResult.rows;

        // Desactivar el caché en el navegador
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Devolver la respuesta en el formato requerido por v-data-table-server
        res.json({ items, totalItems });
    } catch (err) {
        console.error('Error al obtener datos de la tabla general:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Función para crear un nuevo registro
const createGeneral = async (req, res) => {
    const { nombres, apellidos, cedula, telefono } = req.body;
    try {
        const insertQuery = `
            INSERT INTO general (nombres, apellidos, cedula, telefono, completo)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const completo = `${nombres} ${apellidos}`;
        const result = await pool.query(insertQuery, [nombres, apellidos, cedula, telefono, completo]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al insertar el registro:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    }
};

// Función para actualizar un registro
const updateGeneral = async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, cedula, telefono } = req.body;
    try {
        const updateQuery = `
            UPDATE general
            SET nombres = $1, apellidos = $2, cedula = $3, telefono = $4, completo = $5
            WHERE id = $6
            RETURNING *;
        `;
        const completo = `${nombres} ${apellidos}`;
        const result = await pool.query(updateQuery, [nombres, apellidos, cedula, telefono, completo, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar el registro:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    }
};

// Función para eliminar un registro
const deleteGeneral = async (req, res) => {
    const { id } = req.params;
    try {
        const deleteQuery = `
            DELETE FROM general WHERE id = $1 RETURNING *;
        `;
        const result = await pool.query(deleteQuery, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json({ message: 'Registro eliminado exitosamente', deletedRecord: result.rows[0] });
    } catch (err) {
        console.error('Error al eliminar el registro:', err);
        // Si hay una violación de clave foránea, informamos al usuario
        if (err.code === '23503') { 
            res.status(409).json({ error: 'No se puede eliminar este registro porque está vinculado a otra tabla.', details: err.detail });
        } else {
            res.status(500).json({ error: 'Error del servidor', details: err.detail });
        }
    }
};

module.exports = {
    getGeneralData,
    createGeneral,
    updateGeneral,
    deleteGeneral
};