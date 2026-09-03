import React, { useState } from 'react';
import axios from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
      // Do NOT store token in localStorage. Backend sets httpOnly cookie 'token'.
      const { role } = response.data.user;
      if (role === 'super_admin') window.location.href = '/admin';
      else if (role === 'owner') window.location.href = '/owner';
      else if (role === 'cashier') window.location.href = '/pos';
      else window.location.href = '/pos';
      
    } catch (err) {
      setError('Email ou senha incorretos.');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login Genesis</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input 
          type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        <input 
          type="password" placeholder="Senha" className="w-full p-2 mb-4 border rounded"
          value={password} onChange={(e) => setPassword(e.target.value)} required
        />
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
