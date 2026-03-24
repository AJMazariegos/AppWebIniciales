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
  // PARTE VISUAL (HTML - CSS - pokemonxyz)
  // ==========================================

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>Iniciar Sesión</h2>
      
      {/* mostar si existe error */}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      
      {/* dispara handleSubmit (ln29) al enviar el formulario */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* txtRegistroAcademico */}
        <input 
          type="text" 
          name="registro_academico" 
          placeholder="Registro Académico (ej. 202601234)" 
          onChange={handleChange} 
          required 
        />
        
        {/* txtContraseña */}
        <input 
          type="password" 
          name="password" 
          placeholder="Contraseña" 
          onChange={handleChange} 
          required 
        />
        
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Ingresar
        </button>
      </form>

      {/* botón para registrar - Cambio de pantalla (register) */}
      <button onClick={() => navigate('/register')} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#28a745', textDecoration: 'underline', cursor: 'pointer' }}>
        ¿No tienes cuenta? Regístrate aquí
      </button>
    </div>
  );
};

export default Login;