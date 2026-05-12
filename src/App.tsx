import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Schedule from './pages/Schedule';
import Admin from './pages/Admin';
import MyAccount from './pages/MyAccount';
import Messages from './pages/Messages';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/agendar" element={<Schedule />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/minha-conta" element={<MyAccount />} />
          <Route path="/mensagens" element={<Messages />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
