const { pool } = require('../db/db');

// Función principal para obtener datos con paginación, búsqueda y ordenamiento
const getItaipuData = async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10, search = '' } = req.query;

        let sortBy = [];
        if (req.query.sortBy) {
            try {
                sortBy = JSON.parse(req.query.sortBy);
            } catch (error) {
                console.error("Error al parsear el parámetro sortBy:", error);
            }
        }

        const limit = parseInt(itemsPerPage);
        const offset = (parseInt(page) - 1) * limit;

        let whereClause = '';
        const queryParams = [];
        let paramIndex = 1;
        
        if (search) {
            const searchTerms = search.split(/\s+/).filter(term => term);
            if (searchTerms.length > 0) {
                whereClause = `WHERE g.search_vector @@ to_tsquery('spanish', $${paramIndex})`;
                queryParams.push(searchTerms.map(t => `${t}:*`).join(' & '));
                paramIndex++;
            }
        }
        
        let orderByClause = 'ORDER BY g.nombres ASC';
        if (sortBy.length) {
            const sortKey = sortBy[0].key;
            const sortOrder = sortBy[0].order === 'desc' ? 'DESC' : 'ASC';
            
            const validSortFields = {
                // Se corrigieron los nombres de los campos de la tabla `general`
                'cedula': 'g.cedula',
                'nombres': 'g.nombres',
                'apellidos': 'g.apellidos',
                'telefono': 'g.telefono',
                // Campos específicos de la tabla `itaipu`
                'ubicacion': 'i.ubicacion',
                'salario': 'i.salario'
            };
            if (validSortFields[sortKey]) {
                orderByClause = `ORDER BY ${validSortFields[sortKey]} ${sortOrder}`;
            }
        }

        const countQuery = `
            SELECT COUNT(*) 
            FROM itaipu AS i 
            JOIN general AS g ON i.cedula = g.cedula 
            ${whereClause} 
        `;
        const countResult = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);

        const dataQuery = `
            SELECT 
                i.id,
                i.ubicacion,
                i.salario,
                g.cedula,
                g.nombres,
                g.apellidos,
                g.telefono,
                g.completo AS nom_completo 
            FROM 
                itaipu AS i 
            JOIN 
                general AS g ON i.cedula = g.cedula 
            ${whereClause} 
            ${orderByClause} 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        
        queryParams.push(limit);
        queryParams.push(offset);

        const dataResult = await pool.query(dataQuery, queryParams);
        const items = dataResult.rows;

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.json({ items, totalItems });
    } catch (err) {
        console.error('Error al obtener los datos de Itaipu:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Función para crear un nuevo registro (en dos tablas)
const createItaipu = async (req, res) => {
    const { nombres, apellidos, cedula, telefono, ubicacion, salario } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const completo = `${nombres} ${apellidos}`;

        // Lógica idéntica a la de `abogados`: intenta insertar en `general` y si ya existe, no hace nada.
        const insertGeneralQuery = `
            INSERT INTO general (nombres, apellidos, cedula, telefono, completo)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (cedula) DO NOTHING 
            RETURNING *;
        `;
        const resultGeneral = await client.query(insertGeneralQuery, [nombres, apellidos, cedula, telefono, completo]);

        if (resultGeneral.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Ya existe un registro con esa cédula.' });
        }
        
        // Insertamos en la tabla itaipu
        const insertItaipuQuery = `
            INSERT INTO itaipu (cedula, ubicacion, salario)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const resultItaipu = await client.query(insertItaipuQuery, [cedula, ubicacion, salario]);
        
        await client.query('COMMIT');

        // Devolvemos el registro completo, uniendo la información de ambas tablas
        const combinedResult = {
            ...resultGeneral.rows[0],
            ...resultItaipu.rows[0]
        };

        res.status(201).json(combinedResult);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear el registro de Itaipu:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    } finally {
        client.release();
    }
};

// Función para actualizar un registro
const updateItaipu = async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, cedula, telefono, ubicacion, salario } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const oldCedulaQuery = 'SELECT cedula FROM itaipu WHERE id = $1';
        const oldCedulaResult = await client.query(oldCedulaQuery, [id]);
        if (oldCedulaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Registro de Itaipu no encontrado' });
        }
        const oldCedula = oldCedulaResult.rows[0].cedula;
        
        const completo = `${nombres} ${apellidos}`;

        if (cedula !== oldCedula) {
            const checkQuery = 'SELECT id FROM general WHERE cedula = $1';
            const checkResult = await client.query(checkQuery, [cedula]);
            if (checkResult.rowCount > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Ya existe otro registro con esa cédula.' });
            }
            
            const updateGeneralQuery = `
                UPDATE general
                SET nombres = $1, apellidos = $2, telefono = $3, completo = $4, cedula = $5
                WHERE cedula = $6
                RETURNING *;
            `;
            await client.query(updateGeneralQuery, [nombres, apellidos, telefono, completo, cedula, oldCedula]);

            const updateItaipuCedulaQuery = `
                UPDATE itaipu SET cedula = $1 WHERE id = $2;
            `;
            await client.query(updateItaipuCedulaQuery, [cedula, id]);
        } else {
            const updateGeneralQuery = `
                UPDATE general
                SET nombres = $1, apellidos = $2, telefono = $3, completo = $4
                WHERE cedula = $5
                RETURNING *;
            `;
            await client.query(updateGeneralQuery, [nombres, apellidos, telefono, completo, cedula]);
        }
        
        // Se actualizan los campos específicos de itaipu en una operación separada
        const updateItaipuQuery = `
            UPDATE itaipu
            SET ubicacion = $1, salario = $2
            WHERE id = $3
            RETURNING *;
        `;
        const resultItaipu = await client.query(updateItaipuQuery, [ubicacion, salario, id]);

        await client.query('COMMIT');
        
        if (resultItaipu.rowCount === 0) {
            return res.status(404).json({ error: 'Registro no encontrado en la tabla itaipu.' });
        }
        
        res.json({ message: 'Registro actualizado correctamente.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar el registro de Itaipu:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    } finally {
        client.release();
    }
};

// Función para eliminar un registro
const deleteItaipu = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const oldCedulaQuery = 'SELECT cedula FROM itaipu WHERE id = $1';
        const oldCedulaResult = await client.query(oldCedulaQuery, [id]);
        if (oldCedulaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Registro de Itaipu no encontrado' });
        }
        const oldCedula = oldCedulaResult.rows[0].cedula;
        
        // Lógica idéntica a la de `abogados`: eliminamos de `general` y la base de datos se encarga del resto.
        const deleteGeneralQuery = `
            DELETE FROM general WHERE cedula = $1 RETURNING *;
        `;
        const result = await client.query(deleteGeneralQuery, [oldCedula]);
        
        await client.query('COMMIT');
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro no encontrado en la base de datos.' });
        }
        res.json({ message: 'Registro eliminado exitosamente', deletedRecord: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar el registro de Itaipu:', err);
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
    getItaipuData,
    createItaipu,
    updateItaipu,
    deleteItaipu
};