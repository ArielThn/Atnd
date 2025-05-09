import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaSignOutAlt,
  FaChartBar,
  FaHistory,
} from 'react-icons/fa';
import { SiVolkswagen } from 'react-icons/si';
import { jwtDecode } from 'jwt-decode';

function Sidebar({ onLogout, onChangeComponent }) {
  const [isOpen, setIsOpen] = useState(false); // Controle da expansão
  const [showText, setShowText] = useState(false); // Controle do texto

  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];

  const decoded = token ? jwtDecode(token) : null;  

  // Sincronizar visibilidade do texto com transição
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowText(true); // Mostra o texto após transição
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowText(false); // Esconde o texto instantaneamente
    }
  }, [isOpen]);

  // Fecha o dropdown ao sair da sidebar
  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <div
      className={`fixed z-10 top-0 left-0 min-h-screen bg-[#001e50] text-white flex flex-col items-center justify-between overflow-hidden transition-[width] duration-300 ease-in-out ${
        isOpen ? 'w-[200px]' : 'w-[120px]'
      }`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={handleMouseLeave} // Fechar sidebar e dropdown
    >
      {/* Logo */}
      <div className="flex flex-col items-center justify-center py-[30px] text-lg">
        <SiVolkswagen size={70} />
        {showText && decoded?.nome && (
          <span className="mt-2 text-base font-bold">{decoded.nome}</span>
        )}
      </div>
      {/* Navegação */}
      <nav className="flex flex-grow flex-col items-center w-full">
        <ul className="flex flex-col items-center gap-4 w-[80%]">
        <li
            onClick={() => onChangeComponent('grafico')}
            className="flex items-center justify-center w-full py-3 cursor-pointer text-white text-base font-medium transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
          >
            <FaHome className="mr-2 text-[28px]" />
            {showText && <span>Gráficos</span>}
          </li>
        
          <li
            onClick={() => onChangeComponent('registros')}
            className="flex items-center justify-center w-full py-3 cursor-pointer text-white text-base font-medium transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
          >
            <FaChartBar className="mr-2 text-[28px]" />
            {showText && <span>Registros</span>}
          </li>
          <li
            onClick={() => onChangeComponent('formulario')}
            className="flex items-center justify-center w-full py-3 cursor-pointer text-white text-base font-medium transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
          >
            <FaHistory className="mr-2 text-[28px]" />
            {showText && <span>Registrar Cliente</span>}
          </li>
        </ul>
      </nav>
      {/* Logout */}
      <div
        onClick={onLogout}
        className="flex items-center justify-center w-[80%] py-3 cursor-pointer text-white text-base font-medium transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
      >
        <FaSignOutAlt className="mr-2 text-[24px]" />
        {showText && <span>Logout</span>}
      </div>
    </div>
  );
}

export default Sidebar;
