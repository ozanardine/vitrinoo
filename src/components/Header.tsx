import React, { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Store, LogOut, User } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { useStore } from '../lib/store';
import { signOut } from '../lib/auth';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const scrollToSection = (sectionId: string) => {
    // Se estiver na página inicial, rola para a seção
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Se estiver em outra página, navega para a home e depois rola para a seção
      navigate('/?section=' + sectionId);
    }
  };

  return (
    <>
      <header className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Store className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold">Catálogo Digital</h1>
            </Link>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Recursos
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Preços
                </button>
                <button
                  onClick={() => scrollToSection('integrations')}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Integrações
                </button>
              </nav>
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-sm">{user.email}</span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Minha Conta
                        </Link>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sair</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => setShowAuthModal(true)}
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Entrar
                    </button>
                    <button 
                      onClick={() => setShowAuthModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Começar Grátis
                    </button>
                  </>
                )}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};