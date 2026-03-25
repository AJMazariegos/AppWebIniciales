import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  // cambio entre pantallas
  const navigate = useNavigate(); 

  // 'credencialesRegistro' guarda las credenciales ingresadas  
  // 'setCredencialesRegistro' actualiza - cambios
  const [credencialesRegistro, setCredencialesRegistro] = useState({
    registro_academico: '',
    nombres: '',
    apellidos: '',
    correo: '',
    password: ''
  });
  
  const [mensaje, setMensaje] = useState(''); // para mostar mensaje de exito
  const [error, setError] = useState(''); // en caso de tener que mostrar un mensaje de error

  // cada que se presiona una tecla se actualiza
  const handleChange = (e) => {
    // e.target.name - el nombre de la caja donde se escribe
    setCredencialesRegistro({
      ...credencialesRegistro,
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    try {
      // ID automatico de usuario
      const idUnico = `USR-${Date.now()}`;
      
      // juntamos el ID con los datos enviados por el usuario
      const datosParaEnviar = {
        id_usuario: idUnico,
        ...credencialesRegistro
      };

      // mandamos a axios al backend con los datos - await: espera respuesta del backend
      await axios.post('http://localhost:3000/api/register', datosParaEnviar);
      
      setMensaje('¡Registro exitoso! Redirigiendo al login...');
      setError('');
      
      // limpiar campos
      setCredencialesRegistro({
        registro_academico: '',
        nombres: '',
        apellidos: '',
        correo: '',
        password: ''
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el usuario');
      setMensaje('');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', background: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', fontFamily: 'sans-serif' }}>
      
      <h2 style={{ textAlign: 'center', color: '#fff', margin: '0 0 20px 0' }}>Registro de Usuario</h2>
      
      {mensaje && <p style={{ color: '#4ade80', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>{mensaje}</p>}
      
      {error && (
        <p style={{ color: '#ef4444', fontWeight: 'bold', textAlign: 'center', background: '#450a0a', padding: '10px', borderRadius: '5px', border: '1px solid #7f1d1d', marginBottom: '20px' }}>
          {error}
        </p>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* txtRegistroAcademico */}
        <input 
          type="text" 
          name="registro_academico" 
          value={credencialesRegistro.registro_academico} 
          placeholder="Registro Académico" 
          onChange={handleChange} 
          required 
          style={{ padding: '12px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
        />

        {/* txtNombres */}
        <input 
          type="text" 
          name="nombres" 
          value={credencialesRegistro.nombres} 
          placeholder="Nombres" 
          onChange={handleChange} 
          required 
          style={{ padding: '12px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
        />

        {/* txtApellidos */}
        <input 
          type="text" 
          name="apellidos" 
          value={credencialesRegistro.apellidos} 
          placeholder="Apellidos" 
          onChange={handleChange} 
          required 
          style={{ padding: '12px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
        />

        {/* txtEmail */}
        <input 
          type="email" 
          name="correo" 
          value={credencialesRegistro.correo} 
          placeholder="Correo Electrónico" 
          onChange={handleChange} 
          required 
          style={{ padding: '12px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
        />

        {/* txtContraseña */}
        <input 
          type="password" 
          name="password" 
          value={credencialesRegistro.password} 
          placeholder="Contraseña" 
          onChange={handleChange} 
          required 
          style={{ padding: '12px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
        />
        
        {/* btnRegistrar */}
        <button type="submit" style={{ padding: '12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em', marginTop: '10px' }}>
          Registrarse
        </button>
      </form>
      
      {/* botón para iniciar sesion - Cambio de pantalla (login) */}
      <button onClick={() => navigate('/')} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
        ¿Ya tienes cuenta? Inicia sesión aquí
      </button>
    </div>
  );
};

export default Register;