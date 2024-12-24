import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaChartBar,
  FaHistory,
  FaSignOutAlt,
  FaCar,
  FaPlusCircle,
  FaCaretDown,
  FaCaretUp,
} from 'react-icons/fa';
import { SiVolkswagen } from 'react-icons/si';
import { jwtDecode } from 'jwt-decode';

function Sidebar({ onLogout, onChangeComponent }) {
  const [isOpen, setIsOpen] = useState(false); // Controle da expansão
  const [showText, setShowText] = useState(false); // Controle do texto
  const [dropdownOpen, setDropdownOpen] = useState(false); // Controle do dropdown

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
    setDropdownOpen(false); // Fecha o dropdown
  };

  return (
    <div
      className={`fixed top-0 left-0 min-h-screen bg-[#001e50] text-white flex flex-col items-center justify-between overflow-hidden transition-[width] duration-300 ease-in-out ${
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
            onClick={() => onChangeComponent('forms')}
            className="flex items-center justify-center w-full py-3 cursor-pointer text-white text-base font-medium transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
          >
            <FaHistory className="mr-2 text-[28px]" />
            {showText && <span>Registrar Cliente</span>}
          </li>
          {/* Dropdown */}
          <li className="flex flex-col w-full">
            <div
              className="flex items-center justify-center w-full py-3 cursor-pointer text-white text-base font-medium transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <FaCar className="mr-2 text-[28px]" />
              {showText && <span>Best Drive</span>}
              {showText && (
                <span className="ml-2">
                  {dropdownOpen ? <FaCaretUp /> : <FaCaretDown />}
                </span>
              )}
            </div>
            {dropdownOpen && (
              <ul className="flex flex-col gap-2">
                <li
                  onClick={() => onChangeComponent('saida')}
                  className="flex items-center justify-center w-full py-3 cursor-pointer text-white transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
                >
                  {showText && <span>Registrar Saída</span>}
                </li>
                <li
                  onClick={() => onChangeComponent('confirmacoes')}
                  className="flex items-center justify-center w-full py-3 cursor-pointer text-white transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
                >
                  {showText && <span>Confirmações</span>}
                </li>
              </ul>
            )}
          </li>
          <li
            onClick={() => onChangeComponent('adicionar-motivos')}
            className="flex items-center justify-center w-full py-3 cursor-pointer text-white text-base font-medium transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
          >
            <FaPlusCircle className="mr-2 text-[28px]" />
            {showText && <span>Adicionar Motivos</span>}
          </li>
          <li
            onClick={() => onChangeComponent('entrada')}
            className="flex items-center justify-center w-full py-3 cursor-pointer text-white text-base font-medium transition-colors duration-200 hover:bg-[#00509e] rounded-lg"
          >
            <FaHistory className="mr-2 text-[28px]" />
            {showText && <span>Registros de Entrada</span>}
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
