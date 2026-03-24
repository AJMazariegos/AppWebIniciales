import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
//import Perfil from './pages/Perfil'; //aun no se usa

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* con "/" indicamos que es la primera */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/feed" element={<Feed />} />
        {/* aun no se usa */}
        {/* <Route path="/perfil" element={<Perfil />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;