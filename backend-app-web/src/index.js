const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Middlewares
app.use(cors()); // Permite que tu Frontend en React se comunique con este Backend
app.use(express.json()); // Permite recibir datos en formato JSON

// Ruta de prueba para verificar que la DB conecta
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM curso');
        res.json({ mensaje: '¡Conexión exitosa a la BD!', cursos: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error conectando a la base de datos' });
    }
});

// Ruta para REGISTRAR un nuevo usuario
app.post('/api/register', async (req, res) => {
    try {
        // 1. Recibimos los datos que envía el usuario desde el Frontend (o Postman)
        const { id_usuario, registro_academico, nombres, apellidos, correo, password } = req.body;

        // 2. Validamos que no vengan campos vacíos
        if (!id_usuario || !registro_academico || !nombres || !apellidos || !correo || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // 3. Encriptamos la contraseña (el número 10 es el "salto" de seguridad, es el estándar)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Guardamos en la base de datos
        const query = `
            INSERT INTO usuario (id_usuario, registro_academico, nombres, apellidos, correo, password) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        // Usamos la contraseña encriptada (hashedPassword) en lugar de la original
        await db.query(query, [id_usuario, registro_academico, nombres, apellidos, correo, hashedPassword]);

        // 5. Respondemos que todo salió bien
        res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });

    } catch (error) {
        console.error(error);
        // Si el id_usuario o correo ya existen, MySQL tirará un error que atrapamos aquí
        res.status(500).json({ error: 'Error al registrar el usuario. Puede que el ID o correo ya existan.' });
    }
});

// Ruta para INICIAR SESIÓN (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { registro_academico, password } = req.body;

        // Validar que manden los datos
        if (!registro_academico || !password) {
            return res.status(400).json({ error: 'Registro académico y contraseña son obligatorios' });
        }

        // 1. Buscar al usuario en la base de datos
        const [users] = await db.query('SELECT * FROM usuario WHERE registro_academico = ?', [registro_academico]);
        
        // Si el arreglo está vacío, el usuario no existe
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];

        // 2. Comparar la contraseña escrita con la encriptada en la base de datos
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 3. Crear el Token JWT (El "gafete" virtual)
        const token = jwt.sign(
            { id_usuario: user.id_usuario, registro_academico: user.registro_academico },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // El token durará 2 horas
        );

        // 4. Responder con éxito, entregando el token
        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token: token,
            usuario: {
                id_usuario: user.id_usuario,
                nombres: user.nombres,
                apellidos: user.apellidos
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
});

// ==========================================
// RUTAS DE PUBLICACIONES (FEED)
// ==========================================

// 1. Obtener todas las publicaciones (GET)
app.get('/api/publicaciones', async (req, res) => {
    try {
        // Hacemos un JOIN para que el Frontend reciba los nombres y no solo los IDs
        const query = `
            SELECT 
                p.id_publicacion, 
                p.mensaje, 
                p.fecha, 
                u.nombres AS estudiante, 
                u.apellidos AS estudiante_apellido,
                c.nombre_curso AS curso, 
                cat.nombres AS catedratico,
                cat.apellidos AS catedratico_apellido
            FROM publicacion p
            JOIN usuario u ON p.usuario_id_usuario = u.id_usuario
            JOIN curso c ON p.curso_id_curso = c.id_curso
            JOIN catedratico cat ON p.catedratico_id_catedratico = cat.id_catedratico
            ORDER BY p.fecha DESC; -- Ordenadas de la más reciente a la más antigua
        `;
        const [publicaciones] = await db.query(query);
        res.json(publicaciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las publicaciones' });
    }
});

// 2. Crear una nueva publicación (POST)
app.post('/api/publicaciones', async (req, res) => {
    try {
        const { id_publicacion, usuario_id_usuario, curso_id_curso, catedratico_id_catedratico, mensaje } = req.body;

        if (!id_publicacion || !usuario_id_usuario || !curso_id_curso || !catedratico_id_catedratico || !mensaje) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // Generamos la fecha actual en formato YYYY-MM-DD para MySQL
        const fecha_actual = new Date().toISOString().split('T')[0];

        const query = `
            INSERT INTO publicacion (id_publicacion, usuario_id_usuario, curso_id_curso, catedratico_id_catedratico, mensaje, fecha) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [id_publicacion, usuario_id_usuario, curso_id_curso, catedratico_id_catedratico, mensaje, fecha_actual]);

        res.status(201).json({ mensaje: 'Publicación creada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la publicación' });
    }
});

// ==========================================
// RUTAS DE COMENTARIOS
// ==========================================

// 1. Obtener los comentarios de una publicación específica (GET)
// Nota: Usamos :id en la ruta para capturar dinámicamente el ID de la publicación
app.get('/api/publicaciones/:id/comentarios', async (req, res) => {
    try {
        const { id } = req.params; // Extraemos el ID de la URL
        
        // Buscamos los comentarios y los unimos con el usuario para saber quién comentó
        const query = `
            SELECT 
                c.id_comentario, 
                c.mensaje, 
                c.fecha, 
                u.nombres AS autor, 
                u.apellidos AS autor_apellido
            FROM comentario c
            JOIN usuario u ON c.usuario_id_usuario = u.id_usuario
            WHERE c.publicacion_id_publicacion = ?
            ORDER BY c.fecha ASC; -- Los más antiguos primero, como en un chat normal
        `;
        
        const [comentarios] = await db.query(query, [id]);
        res.json(comentarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los comentarios' });
    }
});

// 2. Agregar un nuevo comentario a una publicación (POST)
app.post('/api/comentarios', async (req, res) => {
    try {
        const { id_comentario, publicacion_id_publicacion, usuario_id_usuario, mensaje } = req.body;

        if (!id_comentario || !publicacion_id_publicacion || !usuario_id_usuario || !mensaje) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const fecha_actual = new Date().toISOString().split('T')[0];

        const query = `
            INSERT INTO comentario (id_comentario, publicacion_id_publicacion, usuario_id_usuario, mensaje, fecha) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [id_comentario, publicacion_id_publicacion, usuario_id_usuario, mensaje, fecha_actual]);

        res.status(201).json({ mensaje: 'Comentario agregado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar el comentario' });
    }
});

// ==========================================
// RUTAS DEL PERFIL Y CURSOS APROBADOS
// ==========================================

// 1. Obtener los cursos aprobados de un usuario y su total de créditos (GET)
app.get('/api/usuarios/:id/cursos-aprobados', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtenemos la lista de cursos
        const queryCursos = `
            SELECT ca.id_registro, c.id_curso, c.nombre_curso, c.creditos, ca.fecha_aprobacion 
            FROM curso_aprobado ca
            JOIN curso c ON ca.curso_id_curso = c.id_curso
            WHERE ca.usuario_id_usuario = ?
        `;
        const [cursosAprobados] = await db.query(queryCursos, [id]);

        // Calculamos el total de créditos
        let totalCreditos = 0;
        cursosAprobados.forEach(curso => {
            totalCreditos += curso.creditos;
        });

        res.json({
            cursos: cursosAprobados,
            total_creditos: totalCreditos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los cursos aprobados' });
    }
});

// 2. Agregar un curso aprobado (POST)
app.post('/api/cursos-aprobados', async (req, res) => {
    try {
        const { id_registro, curso_id_curso, usuario_id_usuario, fecha_aprobacion } = req.body;

        if (!id_registro || !curso_id_curso || !usuario_id_usuario || !fecha_aprobacion) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const query = `
            INSERT INTO curso_aprobado (id_registro, curso_id_curso, usuario_id_usuario, fecha_aprobacion) 
            VALUES (?, ?, ?, ?)
        `;
        
        await db.query(query, [id_registro, curso_id_curso, usuario_id_usuario, fecha_aprobacion]);

        res.status(201).json({ mensaje: 'Curso aprobado registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar el curso aprobado' });
    }
});

// ==========================================
// RUTAS AUXILIARES (Para los menús desplegables en el Frontend)
// ==========================================

// Obtener todos los cursos
app.get('/api/cursos', async (req, res) => {
    try {
        const [cursos] = await db.query('SELECT * FROM curso');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cursos' });
    }
});

// Obtener todos los catedráticos
app.get('/api/catedraticos', async (req, res) => {
    try {
        const [catedraticos] = await db.query('SELECT * FROM catedratico');
        res.json(catedraticos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener catedráticos' });
    }
});

// Levantar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});