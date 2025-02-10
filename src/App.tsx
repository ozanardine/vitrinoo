import React, { useEffect } from 'react';
import { ShoppingBag, Palette, Zap, Share2, Database, Settings } from 'lucide-react';
import { useStore } from './lib/store';

function App() {
  const { theme } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Crie Seu Catálogo Digital Profissional
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Compartilhe seus produtos com o mundo através de um catálogo bonito e personalizável. 
              Integre com seu sistema ERP e gerencie tudo em um só lugar.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold">
                Começar Grátis
              </button>
              <button className="border border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 px-8 py-3 rounded-lg font-semibold">
                Ver Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Tudo que você precisa para mostrar seus produtos</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <ShoppingBag className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Gestão Fácil de Produtos</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Adicione, edite e organize seus produtos com nossa interface intuitiva.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Palette className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Design Personalizável</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Combine com sua marca usando cores personalizadas, logo e layout do catálogo.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Share2 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Compartilhamento Fácil</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Compartilhe seu catálogo com uma URL personalizada que combina com sua marca.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Database className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Integração ERP</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sincronize seus produtos automaticamente com seu sistema ERP.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Atualizações em Tempo Real</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Mantenha seu catálogo atualizado com sincronização automática.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Settings className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Configurações Avançadas</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Controle todos os aspectos do seu catálogo com configurações detalhadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Escolha o plano perfeito para seu negócio</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Grátis</h3>
              <p className="text-4xl font-bold mb-6">R$ 0<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Até 50 produtos
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Personalização básica
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Link compartilhável
                </li>
              </ul>
              <button className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg">
                Começar Grátis
              </button>
            </div>

            {/* Basic Plan */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border-2 border-blue-500 relative">
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-4">Básico</h3>
              <p className="text-4xl font-bold mb-6">R$ 147<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Até 500 produtos
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Personalização avançada
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Domínio personalizado
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Suporte prioritário
                </li>
              </ul>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Começar Básico
              </button>
            </div>

            {/* Plus Plan */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Plus</h3>
              <p className="text-4xl font-bold mb-6">R$ 497<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Produtos ilimitados
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Integração ERP
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Acesso à API
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Suporte premium
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Análises avançadas
                </li>
              </ul>
              <button className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg">
                Começar Plus
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integrations" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Integração Perfeita com ERP</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
              Conecte seu sistema ERP existente e mantenha seu catálogo atualizado automaticamente.
              Começando com integração Tiny ERP, com mais sistemas em breve.
            </p>
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
              alt="Diagrama de Integração"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default App;