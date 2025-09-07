// docs/controllers/docentesController.js
const { pool } = require('../db/db');

// 1. FUNCIÓN PARA OBTENER DATOS (GET)
// Diseñada para v-data-table-server, con paginación, búsqueda y ordenamiento
const getDocentesData = async (req, res) => {
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
        
        let orderByClause = '';
        if (sortBy.length) {
            const sortKey = sortBy[0].key;
            const sortOrder = sortBy[0].order === 'desc' ? 'DESC' : 'ASC';
            
            const validSortFields = {
                'cedula': 'd.cedula',
                'nombres': 'g.nombres',
                'apellidos': 'g.apellidos',
                'salario': 'f.salario',
                'telefono': 'g.telefono'
            };

            if (validSortFields[sortKey]) {
                orderByClause = `ORDER BY ${validSortFields[sortKey]} ${sortOrder}`;
            }
        } else {
            orderByClause = `ORDER BY g.completo ASC`;
        }

        const countQuery = `
            SELECT COUNT(*) 
            FROM docentes AS d
            JOIN general AS g ON d.cedula = g.cedula
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);

        const dataQuery = `
            SELECT
                d.id,
                d.cedula,
                COALESCE(g.nombres, g.completo) AS nombres,
                COALESCE(g.apellidos, '') AS apellidos,
                f.salario,
                g.telefono,
                g.completo
            FROM
                docentes AS d
            JOIN
                general AS g ON d.cedula = g.cedula
            LEFT JOIN
                funcpublic AS f ON d.cedula = f.cedula
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
        console.error('Error al obtener datos de docentes:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// 2. FUNCIÓN PARA CREAR UN NUEVO REGISTRO (POST)
const createDocente = async (req, res) => {
    const { cedula, nombres, apellidos, salario, telefono } = req.body;
    
    if (!cedula || !nombres || !apellidos || !salario) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insertar en la tabla 'general'
        const completo = `${nombres} ${apellidos}`.trim();
        const generalQuery = 'INSERT INTO general (cedula, nombres, apellidos, completo, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id;';
        const generalResult = await client.query(generalQuery, [cedula, nombres, apellidos, completo, telefono]);

        // Insertar en la tabla 'funcpublic'
        const funcpublicQuery = 'INSERT INTO funcpublic (cedula, salario) VALUES ($1, $2) RETURNING id;';
        const funcpublicResult = await client.query(funcpublicQuery, [cedula, salario]);

        // Insertar en la tabla 'docentes'
        const docentesQuery = 'INSERT INTO docentes (cedula) VALUES ($1) RETURNING *;';
        const docentesResult = await client.query(docentesQuery, [cedula]);
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Docente creado correctamente.', newRecord: docentesResult.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear el registro de docente:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    } finally {
        client.release();
    }
};

// 3. FUNCIÓN PARA ACTUALIZAR REGISTROS (PUT)
const updateDocente = async (req, res) => {
    // El ID se obtiene del parámetro de la URL
    const { id } = req.params;
    const { nombres, apellidos, salario, telefono } = req.body;
    
    // Validar datos de entrada
    if (!nombres || !apellidos || !salario) {
        return res.status(400).json({ error: 'Nombres, apellidos y salario son requeridos.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Paso 1: Encontrar la cédula usando el ID de la tabla 'docentes'
        const cedulaQuery = 'SELECT cedula FROM docentes WHERE id = $1;';
        const cedulaResult = await client.query(cedulaQuery, [id]);
        if (cedulaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Registro de docente no encontrado.' });
        }
        const cedula = cedulaResult.rows[0].cedula;

        // Paso 2: Actualizar la tabla 'general'
        const updateGeneralQuery = `
            UPDATE general
            SET nombres = $1, apellidos = $2, completo = $3, telefono = $4
            WHERE cedula = $5
            RETURNING *;
        `;
        const completo = `${nombres} ${apellidos}`.trim();
        const resultGeneral = await client.query(updateGeneralQuery, [nombres, apellidos, completo, telefono, cedula]);

        // Paso 3: Actualizar la tabla 'funcpublic'
        const updateFuncPublicQuery = `
            UPDATE funcpublic
            SET salario = $1
            WHERE cedula = $2
            RETURNING *;
        `;
        const resultFuncPublic = await client.query(updateFuncPublicQuery, [salario, cedula]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Registro de docente actualizado correctamente.', updatedRecord: resultGeneral.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar el registro de docente:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    } finally {
        client.release();
    }
};

// 4. FUNCIÓN PARA ELIMINAR REGISTROS (DELETE)
const deleteDocente = async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener la cédula para eliminar los registros relacionados
        const cedulaQuery = 'SELECT cedula FROM docentes WHERE id = $1;';
        const cedulaResult = await client.query(cedulaQuery, [id]);
        if (cedulaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Registro de docente no encontrado.' });
        }
        const cedula = cedulaResult.rows[0].cedula;

        // Eliminar de las tres tablas en una transacción para mantener la consistencia
        const deleteDocentesQuery = 'DELETE FROM docentes WHERE id = $1 RETURNING *;';
        const deletedDocente = await client.query(deleteDocentesQuery, [id]);
        
        const deleteFuncPublicQuery = 'DELETE FROM funcpublic WHERE cedula = $1;';
        await client.query(deleteFuncPublicQuery, [cedula]);
        
        const deleteGeneralQuery = 'DELETE FROM general WHERE cedula = $1;';
        await client.query(deleteGeneralQuery, [cedula]);
        
        await client.query('COMMIT');
        res.json({ message: 'Registro de docente y sus datos relacionados eliminados exitosamente.', deletedRecord: deletedDocente.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar el registro de docente:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.detail });
    } finally {
        client.release();
    }
};


module.exports = {
    getDocentesData,
    createDocente,
    updateDocente,
    deleteDocente,
};