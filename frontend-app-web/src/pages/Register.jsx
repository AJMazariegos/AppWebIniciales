import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  // cambio entre pantallas
  const navigate = useNavigate(); 

  // 'credencialesRegistro' guarda las credenciales ingresadas  
  // 'setCredencialesRegistro' actualiza - cambios
  const [credencialesRegistro, setCredencialesRegistro] = useState({
    id_usuario: '',
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

  // ejecuta al dar 'Registrar'
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    try {
      // mandamos a axios al backend con las credenciales - await: espera respuesta del backend
      await axios.post('http://localhost:3000/api/register', formData);
      
      // mostar mensaje de exito
      setMensaje('¡Registro exitoso! Redirigiendo al login...');
      setError('');
      
      // limpieza cajas
      setFormData({
        id_usuario: '',
        registro_academico: '',
        nombres: '',
        apellidos: '',
        correo: '',
        password: ''
      });

      // delay de la redirección (pruebas mensaje exito)
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      // en caso que el backend responda con error 
      setError(err.response?.data?.error || 'Error al registrar el usuario');
      setMensaje('');
    }
  };

  // ==========================================
  // PARTE VISUAL (HTML - CSS - pokemonxyz)
  // ==========================================

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>Registro de Usuario</h2>
      
      {/* mensajes que solo se muestran si no están vacios */}
      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      
      {/* dispara handleSubmit (ln33) al enviar el formulario */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* txtID_Usuario */}
        <input 
          type="text" 
          name="id_usuario" 
          value={credencialesRegistro.id_usuario} 
          placeholder="ID (ej. USR-105)" 
          onChange={handleChange} 
          required 
        />
        
        {/* txtRegistroAcademico */}
        <input 
          type="text" 
          name="registro_academico" 
          value={credencialesRegistro.registro_academico} 
          placeholder="Registro Académico" 
          onChange={handleChange} 
          required 
        />

        {/* txtNombres */}
        <input 
          type="text" 
          name="nombres" 
          value={credencialesRegistro.nombres} 
          placeholder="Nombres" 
          onChange={handleChange} 
          required 
        />

        {/* txtApellidos */}
        <input 
          type="text" 
          name="apellidos" 
          value={credencialesRegistro.apellidos} 
          placeholder="Apellidos" 
          onChange={handleChange} 
          required 
        />

        {/* txtEmail */}
        <input 
          type="email" 
          name="correo" 
          value={credencialesRegistro.correo} 
          placeholder="Correo Electrónico" 
          onChange={handleChange} 
          required 
        />

        {/* txtContraseña */}
        <input 
          type="password" 
          name="password" 
          value={credencialesRegistro.password} 
          placeholder="Contraseña" 
          onChange={handleChange} 
          required 
        />
        
        <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Registrarse
        </button>
      </form>
      
      {/* botón para regresar al login - Cambio de pantalla (login) */}
      <button onClick={() => navigate('/')} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>
        ¿Ya tienes cuenta? Inicia sesión aquí
      </button>
    </div>
  );
};

export default Register;