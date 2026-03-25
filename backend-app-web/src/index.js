const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

//RUTA DE PRUEBA
app.get('/api/test-db', async (req, res) => {
    try {
        //const [rows] = await db.query('SELECT * FROM curso');
        res.json({ mensaje: 'Hay Conexion'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error!!!' });
    }
});

//RUTA REGISTRO
app.post('/api/register', async (req, res) => {
    try {
        //se reciben los datos
        const { id_usuario, registro_academico, nombres, apellidos, correo, password } = req.body;

        //validación campos completos
        if (!id_usuario || !registro_academico || !nombres || !apellidos || !correo || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        //se encripta la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //insertamos en la db
        const query = `
            INSERT INTO usuario (id_usuario, registro_academico, nombres, apellidos, correo, password) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [id_usuario, registro_academico, nombres, apellidos, correo, hashedPassword]);
        res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar. Puede que el ID o correo ya existan.' });
    }
});

//RUTA LOGIN
app.post('/api/login', async (req, res) => {
    try {
        //recibimos datos
        const { registro_academico, password } = req.body;

        //validacion no vacios
        if (!registro_academico || !password) {
            return res.status(400).json({ error: 'Registro académico y contraseña son obligatorios' });
        }

        //buscamos por carnet
        const [users] = await db.query('SELECT * FROM usuario WHERE registro_academico = ?', [registro_academico]);
        
        //si devuelve 0 (vacio) es que no existe
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];

        //comparacion contraseñas (encriptada - común)
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        //generamos el token para el acceso
        const token = jwt.sign(
            { id_usuario: user.id_usuario, registro_academico: user.registro_academico },
            process.env.JWT_SECRET,
            { expiresIn: '4h' } //token de duración 4 horas
        );

        //se asigna token
        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token: token,
            usuario: {
                id_usuario: user.id_usuario,
                nombres: user.nombres,
                apellidos: user.apellidos,
                registro_academico: user.registro_academico
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
});

// ==========================================
// RUTA DE PUBLICACIONES (FEED)
// ==========================================

//obtenemos publicaciones (GET)
app.get('/api/publicaciones', async (req, res) => {
    try {
        //join para jalar todo de una
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
            ORDER BY p.fecha DESC; -- Ordenadas de la más reciente a la más antigua `;
        const [publicaciones] = await db.query(query);
        res.json(publicaciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las publicaciones' });
    }
});

//crear publicación (POST)
app.post('/api/publicaciones', async (req, res) => {
    try {
        const { id_publicacion, usuario_id_usuario, curso_id_curso, catedratico_id_catedratico, mensaje } = req.body;

        if (!id_publicacion || !usuario_id_usuario || !curso_id_curso || !catedratico_id_catedratico || !mensaje) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        //para la fecha de hoy
        const fecha_actual = new Date().toISOString().split('T')[0];

        const query = `
            INSERT INTO publicacion (id_publicacion, usuario_id_usuario, curso_id_curso, catedratico_id_catedratico, mensaje, fecha) 
            VALUES (?, ?, ?, ?, ?, ?) `;
        
        await db.query(query, [id_publicacion, usuario_id_usuario, curso_id_curso, catedratico_id_catedratico, mensaje, fecha_actual]);

        res.status(201).json({ mensaje: 'Publicación creada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la publicación' });
    }
});

// ==========================================
// RUTA DE COMENTARIOS
// ==========================================

//jalar los comentarios de una publicación (GET)
//api/publicaciones/(id_publicacion)/comentarios
app.get('/api/publicaciones/:id/comentarios', async (req, res) => {
    try {
        const { id } = req.params; //jalamos el ID de la URL
        
        //juntamos los comentarios con el usuario que los hizo
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
            ORDER BY c.fecha ASC; -- Los más antiguos primero `;
        
        const [comentarios] = await db.query(query, [id]);
        res.json(comentarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los comentarios' });
    }
});

//agregar un comentario (POST)
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

        res.status(201).json({ mensaje: 'Comentario agregado con exito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar el comentario' });
    }
});

// ==========================================
// RUTA CURSOS APROBADOS
// ==========================================

//obtener cursos aprobados del usuario (GET)
//api/usuarios/(id_usuario)/cursos-aprobados
app.get('/api/usuarios/:id/cursos-aprobados', async (req, res) => {
    try {
        const { id } = req.params;

        //jalamos lista de cursos
        const queryCursos = `
            SELECT ca.id_registro, c.id_curso, c.nombre_curso, c.creditos, ca.fecha_aprobacion 
            FROM curso_aprobado ca
            JOIN curso c ON ca.curso_id_curso = c.id_curso
            WHERE ca.usuario_id_usuario = ?
        `;
        const [cursosAprobados] = await db.query(queryCursos, [id]);

        //calculo de creditos totales
        const totalCreditos = cursosAprobados.reduce((suma, curso) => suma + curso.creditos, 0);

        res.json({
            cursos: cursosAprobados,
            total_creditos: totalCreditos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los cursos aprobados' });
    }
});

//agregar un curso aprobado (POST)
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

        res.status(201).json({ mensaje: 'Curso aprobado registrado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar curso aprobado' });
    }
});

// ==========================================
// RUTAS AUXILIARES (desplegables)
// ==========================================

//obtener los cursos
app.get('/api/cursos', async (req, res) => {
    try {
        const [cursos] = await db.query('SELECT * FROM curso');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cursos' });
    }
});

//obtener los catedráticos
app.get('/api/catedraticos', async (req, res) => {
    try {
        const [catedraticos] = await db.query('SELECT * FROM catedratico');
        res.json(catedraticos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener catedráticos' });
    }
});

//temporal consulta usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const [usuarios] = await db.query('SELECT * FROM usuario');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

//temporal consulta comentarios
app.get('/api/comentarios', async (req, res) => {
    try {
        const [usuarios] = await db.query('SELECT * FROM comentario');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener comentarios' });
    }
});

//iniciar el sv
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});