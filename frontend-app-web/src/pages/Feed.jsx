import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Feed = () => {
  const navigate = useNavigate();
  const usuarioActual = JSON.parse(localStorage.getItem('usuario'));

  const [publicaciones, setPublicaciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [catedraticos, setCatedraticos] = useState([]);
  const [error, setError] = useState('');

  const [nuevaPublicacion, setNuevaPublicacion] = useState({
    mensaje: '',
    curso_id: '',
    catedratico_id: ''
  });

  const [publicacionActiva, setPublicacionActiva] = useState(null); 
  const [comentarios, setComentarios] = useState([]); 
  const [nuevoComentario, setNuevoComentario] = useState('');

  useEffect(() => {
    if (!usuarioActual) {
      navigate('/');
      return;
    }
    
    const cargarDatos = async () => {
      try {
        const resPubs = await axios.get('http://localhost:3000/api/publicaciones');
        setPublicaciones(resPubs.data);
        const resCursos = await axios.get('http://localhost:3000/api/cursos');
        setCursos(resCursos.data);
        const resCatedraticos = await axios.get('http://localhost:3000/api/catedraticos');
        setCatedraticos(resCatedraticos.data);
      } catch (err) {
        setError('Error al cargar los datos');
      }
    };
    cargarDatos();
  }, [navigate, usuarioActual]);

  const handleChange = (e) => {
    setNuevaPublicacion({ ...nuevaPublicacion, [e.target.name]: e.target.value });
  };

  const crearPublicacion = async (e) => {
    e.preventDefault();
    if (!nuevaPublicacion.mensaje || !nuevaPublicacion.curso_id || !nuevaPublicacion.catedratico_id) return;

    try {
      // generación de ID único
      const idUnico = `PUB-${Date.now()}`;
      
      await axios.post('http://localhost:3000/api/publicaciones', {
        id_publicacion: idUnico,
        usuario_id_usuario: usuarioActual.id_usuario,
        curso_id_curso: nuevaPublicacion.curso_id,
        catedratico_id_catedratico: nuevaPublicacion.catedratico_id,
        mensaje: nuevaPublicacion.mensaje
      });
      
      setNuevaPublicacion({ mensaje: '', curso_id: '', catedratico_id: '' });
      const resPubs = await axios.get('http://localhost:3000/api/publicaciones');
      setPublicaciones(resPubs.data);
    } catch (err) {
      alert('Error al crear la publicación');
    }
  };

  const toggleComentarios = async (id_publicacion) => {
    if (publicacionActiva === id_publicacion) {
      setPublicacionActiva(null);
      setComentarios([]);
    } else {
      setPublicacionActiva(id_publicacion);
      try {
        const res = await axios.get(`http://localhost:3000/api/publicaciones/${id_publicacion}/comentarios`);
        setComentarios(res.data);
      } catch (error) {
        console.error("Error al cargar comentarios", error);
      }
    }
  };

  const publicarComentario = async (id_publicacion) => {
    if (!nuevoComentario) return;

    try {
      // generación de ID único
      const idUnico = `COM-${Date.now()}`;
      
      await axios.post('http://localhost:3000/api/comentarios', {
        id_comentario: idUnico,
        publicacion_id_publicacion: id_publicacion,
        usuario_id_usuario: usuarioActual.id_usuario,
        mensaje: nuevoComentario
      });

      setNuevoComentario(''); 
      const res = await axios.get(`http://localhost:3000/api/publicaciones/${id_publicacion}/comentarios`);
      setComentarios(res.data);
    } catch (error) {
      alert("Error al publicar el comentario");
    }
  };

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        <h2>¡Hola, {usuarioActual?.nombres}! 👋</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/perfil')} style={{ padding: '8px 15px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Mi Perfil
          </button>
          <button onClick={cerrarSesion} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Formulario para Crear Publicación */}
      <div style={{ background: '#f4f4f9', padding: '15px', borderRadius: '8px', marginTop: '20px', border: '1px solid #ddd' }}>
        <h3>¿Qué quieres compartir?</h3>
        <form onSubmit={crearPublicacion} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea name="mensaje" placeholder="Escribe tu duda o comentario..." value={nuevaPublicacion.mensaje} onChange={handleChange} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '60px' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <select name="curso_id" value={nuevaPublicacion.curso_id} onChange={handleChange} style={{ flex: 1, padding: '8px' }}>
              <option value="">-- Curso --</option>
              {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso}</option>)}
            </select>
            <select name="catedratico_id" value={nuevaPublicacion.catedratico_id} onChange={handleChange} style={{ flex: 1, padding: '8px' }}>
              <option value="">-- Catedrático --</option>
              {catedraticos.map(cat => <option key={cat.id_catedratico} value={cat.id_catedratico}>{cat.nombres} {cat.apellidos}</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Publicar</button>
        </form>
      </div>

      <h3 style={{ marginTop: '30px' }}>Últimas Publicaciones</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Lista de Publicaciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {publicaciones.map((pub) => (
          <div key={pub.id_publicacion} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
              <strong>{pub.estudiante} {pub.estudiante_apellido}</strong>
              <span style={{ fontSize: '0.8em', color: '#666' }}>{pub.fecha.split('T')[0]}</span>
            </div>
            
            <p style={{ margin: '0 0 10px 0', fontSize: '1.1em' }}>{pub.mensaje}</p>
            
            <div style={{ fontSize: '0.9em', color: '#555', background: '#e9ecef', padding: '10px', borderRadius: '5px' }}>
              <p style={{ margin: '0 0 5px 0' }}>📚 <strong>Curso:</strong> {pub.curso}</p>
              <p style={{ margin: '0' }}>🥸 <strong>Catedrático:</strong> {pub.catedratico} {pub.catedratico_apellido}</p>
            </div>

            <button 
              onClick={() => toggleComentarios(pub.id_publicacion)} 
              style={{ marginTop: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', padding: '0' }}
            >
              💬 {publicacionActiva === pub.id_publicacion ? 'Ocultar Comentarios' : 'Ver Comentarios'}
            </button>

            {publicacionActiva === pub.id_publicacion && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #007bff' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Comentarios</h4>
                
                {comentarios.length === 0 ? (
                  <p style={{ fontSize: '0.9em', color: '#666' }}>No hay comentarios aún. ¡Sé el primero!</p>
                ) : (
                  comentarios.map(c => (
                    <div key={c.id_comentario} style={{ marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid #ddd' }}>
                      <strong>{c.autor} {c.autor_apellido}</strong> <span style={{ fontSize: '0.7em', color: '#888' }}>({c.fecha.split('T')[0]})</span>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.95em' }}>{c.mensaje}</p>
                    </div>
                  ))
                )}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <input 
                    type="text" 
                    value={nuevoComentario} 
                    onChange={(e) => setNuevoComentario(e.target.value)} 
                    placeholder="Escribe un comentario..." 
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <button onClick={() => publicarComentario(pub.id_publicacion)} style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default Feed;