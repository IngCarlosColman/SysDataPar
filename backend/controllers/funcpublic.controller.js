const { pool } = require('../db/db');

// Función principal para obtener datos con paginación, búsqueda y ordenamiento
const getFuncPublicData = async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, sortBy = [], search = '' } = req.query;

        const limit = parseInt(itemsPerPage);
        const offset = (parseInt(page) - 1) * limit;

        let whereClause = '';
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            const searchTerms = search.split(/\s+/).filter(term => term);
            if (searchTerms.length > 0) {
                whereClause = `WHERE g.search_vector @@ to_tsquery('spanish', $${paramIndex})`;
                queryParams.push(searchTerms.map(t => `${t}:*`).join(' & '));
                paramIndex++;
            }
        }
        
        let orderByClause = '';
        if (sortBy.length) {
            const sortKey = sortBy[0].key;
            const sortOrder = sortBy[0].order === 'desc' ? 'DESC' : 'ASC';
            const validSortFields = {
                'cedula': 'fp.cedula',
                'nombres': 'g.nombres',
                'apellidos': 'g.apellidos',
                'salario': 'fp.salario',
                'telefono': 'g.telefono'
            };
            if (validSortFields[sortKey]) {
                orderByClause = `ORDER BY ${validSortFields[sortKey]} ${sortOrder}`;
            }
        } else {
            orderByClause = `ORDER BY g.nombres ASC`;
        }

        const countQuery = `
            SELECT COUNT(*) 
            FROM funcpublic AS fp
            JOIN general AS g ON fp.cedula = g.cedula
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);

        const dataQuery = `
            SELECT
                fp.id,   
                fp.salario,
                fp.cedula,
                g.nombres,
                g.apellidos,
                g.telefono
            FROM
                funcpublic AS fp
            JOIN
                general AS g ON fp.cedula = g.cedula
            ${whereClause}
            ${orderByClause}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        queryParams.push(limit);
        queryParams.push(offset);
        const dataResult = await pool.query(dataQuery, queryParams);
        const items = dataResult.rows;

        res.json({ items, totalItems });
    } catch (err) {
        console.error('Error al obtener los datos de funcpublic:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Función para crear un nuevo registro (insertando en dos tablas)
const createFuncPublic = async (req, res) => {
    const { nombres, apellidos, cedula, telefono, salario } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const completo = `${nombres} ${apellidos}`;
        const insertGeneralQuery = `
            INSERT INTO general (nombres, apellidos, cedula, telefono, completo)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (cedula) DO NOTHING
            RETURNING *;
        `;
        const resultGeneral = await client.query(insertGeneralQuery, [nombres, apellidos, cedula, telefono, completo]);

        if (resultGeneral.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Ya existe un registro con esa cédula en la tabla general.' });
        }

        const insertFuncPublicQuery = `
            INSERT INTO funcpublic (cedula, salario)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await client.query(insertFuncPublicQuery, [cedula, salario]);
        
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear el registro de funcionario:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    } finally {
        client.release();
    }
};

// Función para actualizar un registro (en dos tablas)
const updateFuncPublic = async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, cedula, telefono, salario } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const oldCedulaQuery = 'SELECT cedula FROM funcpublic WHERE id = $1';
        const oldCedulaResult = await client.query(oldCedulaQuery, [id]);
        if (oldCedulaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Registro de funcionario no encontrado' });
        }
        const oldCedula = oldCedulaResult.rows[0].cedula;
        
        if (cedula !== oldCedula) {
            const checkQuery = 'SELECT id FROM general WHERE cedula = $1';
            const checkResult = await client.query(checkQuery, [cedula]);
            if (checkResult.rowCount > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Ya existe otro registro con esa cédula.' });
            }
        }

        const updateGeneralQuery = `
            UPDATE general
            SET nombres = $1, apellidos = $2, cedula = $3, telefono = $4, completo = $5
            WHERE cedula = $6
            RETURNING *;
        `;
        const completo = `${nombres} ${apellidos}`;
        await client.query(updateGeneralQuery, [nombres, apellidos, cedula, telefono, completo, oldCedula]);

        const updateFuncPublicQuery = `
            UPDATE funcpublic
            SET cedula = $1, salario = $2
            WHERE id = $3
            RETURNING *;
        `;
        await client.query(updateFuncPublicQuery, [cedula, salario, id]);

        await client.query('COMMIT');
        res.json({ message: 'Registro actualizado correctamente.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar el registro de funcionario:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    } finally {
        client.release();
    }
};

// Función para eliminar un registro
const deleteFuncPublic = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const oldCedulaQuery = 'SELECT cedula FROM funcpublic WHERE id = $1';
        const oldCedulaResult = await client.query(oldCedulaQuery, [id]);
        if (oldCedulaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Registro de funcionario no encontrado' });
        }
        const oldCedula = oldCedulaResult.rows[0].cedula;
        
        const deleteGeneralQuery = `
            DELETE FROM general WHERE cedula = $1 RETURNING *;
        `;
        const result = await client.query(deleteGeneralQuery, [oldCedula]);
        
        await client.query('COMMIT');
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro no encontrado en general' });
        }
        res.json({ message: 'Registro eliminado exitosamente', deletedRecord: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar el registro de funcionario:', err);
        if (err.code === '23503') {
            res.status(409).json({ error: 'No se puede eliminar este registro porque está vinculado a otra tabla.', details: err.detail });
        } else {
            res.status(500).json({ error: 'Error del servidor', details: err.detail });
        }
    } finally {
        client.release();
    }
};

module.exports = {
    getFuncPublicData,
    createFuncPublic,
    updateFuncPublic,
    deleteFuncPublic
};