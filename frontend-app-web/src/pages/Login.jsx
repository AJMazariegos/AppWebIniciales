import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  // cambio entre pantallas
  const navigate = useNavigate(); 

  // 'credenciales' guarda las credenciales ingresadas
  // 'setCredenciales' actualiza - cambios
  const [credenciales, setCredenciales] = useState({
    registro_academico: '',
    password: ''
  });

  // en caso de tener que mostrar un mensaje de error
  const [error, setError] = useState('');

  // cada que se presiona una tecla se actualiza
  const handleChange = (e) => {
    // e.target.name - el nombre de la caja donde se escribe
    setCredenciales({
      ...credenciales,
      [e.target.name]: e.target.value 
    });
  };

  // ejecuta al dar 'Ingresar'
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // mandamos a axios al backend con las credenciales - await: espera respuesta del backend
      const response = await axios.post('http://localhost:3000/api/login', credenciales);
      
      // guardamos un token y los datos del usuario en el navegador
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

      setError('');
      navigate('/feed'); // cambio a la pantalla del feed

    } catch (err) {
      // en caso que el backend responda con error
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  // ==========================================
  // PARTE VISUAL
  // ==========================================

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#1e1e1e', border: '1px solid #333', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', fontFamily: 'sans-serif' }}>
      
      {/* titulo */}
      <h2 style={{ textAlign: 'center', color: '#fff', margin: '0 0 20px 0' }}>Iniciar Sesión</h2>
      
      {/* error*/}
      {error && (
        <p style={{ color: '#ef4444', fontWeight: 'bold', textAlign: 'center', background: '#450a0a', padding: '10px', borderRadius: '5px', border: '1px solid #7f1d1d', marginBottom: '20px' }}>
          {error}
        </p>
      )}
      
      {/* dispara handleSubmit (ln29) al enviar el formulario */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* txtRegistroAcademico */}
        <input 
          type="text" 
          name="registro_academico" 
          placeholder="Registro Académico (ej. 202601234)" 
          onChange={handleChange} 
          required 
          style={{ padding: '12px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
        />
        
        {/* txtContraseña */}
        <input 
          type="password" 
          name="password" 
          placeholder="Contraseña" 
          onChange={handleChange} 
          required 
          style={{ padding: '12px', background: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '5px' }}
        />
        
        {/* btnIngresar */}
        <button type="submit" style={{ padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em' }}>
          Ingresar
        </button>
      </form>

      {/* botón para registrar - Cambio de pantalla (register) */}
      <button onClick={() => navigate('/register')} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#4ade80', textDecoration: 'underline', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
        ¿No tienes cuenta? Regístrate aquí
      </button>
    </div>
  );
};

export default Login;