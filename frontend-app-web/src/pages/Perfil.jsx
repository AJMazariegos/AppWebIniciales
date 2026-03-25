import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Perfil = () => {
  const navigate = useNavigate();
  // jalamos los datos de la memoria
  const usuarioActual = JSON.parse(localStorage.getItem('usuario'));

  // datos del backend
  const [cursosAprobados, setCursosAprobados] = useState([]); 
  const [totalCreditos, setTotalCreditos] = useState(0);
  const [error, setError] = useState('');

  // ruta protegida - doble patada al login
  useEffect(() => {
    if (!usuarioActual) {
      navigate('/');
      return;
    }


    // funcion para cargar los datos
    const cargarDatosDelPerfil = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/usuarios/${usuarioActual.id_usuario}/cursos-aprobados`);
        setCursosAprobados(res.data.cursos || []);
        setTotalCreditos(res.data.total_creditos || 0);
      } catch (err) {
        setError('Error al cargar la información del perfil.');
      }
    };

    cargarDatosDelPerfil();
  }, [navigate, usuarioActual]); 

  // ==========================================
  // PARTE VISUAL
  // ==========================================

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px', color: '#e0e0e0' }}>
      
      {/* Botón para regresar */}
      <button 
        onClick={() => navigate('/feed')} 
        style={{ marginBottom: '20px', padding: '8px 15px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        ⬅️ Regresar al Feed
      </button>

      {/* Info del Usuario - Banner */}
      <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '10px', border: '1px solid #333', textAlign: 'center', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#fff' }}>Perfil de Estudiante</h1>
        <h2 style={{ margin: '0 0 5px 0', color: '#3b82f6' }}>{usuarioActual?.nombres} {usuarioActual?.apellidos}</h2>
        <p style={{ margin: '0', color: '#aaa', fontSize: '1.1em' }}>
          <strong style={{ color: '#ccc' }}>Registro Académico:</strong> {usuarioActual?.registro_academico}
        </p>
      </div>

      {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0', color: '#fff' }}>Mis Cursos Aprobados</h3>
        
        <div style={{ background: '#22c55e', color: 'white', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.3)' }}>
          Total Créditos: {totalCreditos}
        </div>
      </div>

      {/* Espacio Cursos aprobados */}
      {cursosAprobados.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#aaa' }}>Aún no tienes cursos aprobados registrados</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cursosAprobados.map((curso, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', background: '#1e1e1e', padding: '15px', borderRadius: '8px', border: '1px solid #333', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              
              <div>
                <strong style={{ fontSize: '1.1em', color: '#ddd' }}>{curso.nombre_curso}</strong>
              </div>
              
              <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                {curso.creditos} créditos
              </div>
              
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Perfil;