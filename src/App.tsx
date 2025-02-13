import React from 'react';
import { ShoppingBag, Palette, Zap, Share2, Database, Settings, ArrowRight, Check } from 'lucide-react';
import { useStore } from './lib/store';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

function App() {
  const { theme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  React.useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [searchParams]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      navigate(`/?section=${sectionId}`, { replace: true });
    }
  };

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
              <button
                onClick={() => {
                  scrollToSection('features');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
              >
                Começar Grátis
              </button>
              <button
                onClick={() => {
                  scrollToSection('features');
                }}
                className="border border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 px-8 py-3 rounded-lg font-semibold"
              >
                Ver Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Recursos Completos para seu Catálogo</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Todas as ferramentas que você precisa para criar um catálogo profissional e gerenciar seus produtos de forma eficiente
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <ShoppingBag className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Gestão Avançada de Produtos</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie produtos simples, com variações, kits/combos e até mesmo produtos fabricados. Suporte a múltiplas imagens e descrições ricas.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Palette className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Personalização Total</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Design totalmente personalizável com cores da sua marca, layouts flexíveis, fontes customizadas e estilos modernos para seus produtos.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Share2 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Compartilhamento Profissional</h3>
              <p className="text-gray-600 dark:text-gray-400">
                URL personalizada com seu domínio, integração com redes sociais e ferramentas de compartilhamento otimizadas para cada plataforma.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Database className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Integração ERP</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Em desenvolvimento: Integração com os principais sistemas de ERP do mercado. Lançamento previsto para Março/2024.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Inteligência Artificial</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Geração automática de descrições otimizadas para SEO, sugestões inteligentes de categorização e análise de dados.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <Settings className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Recursos Avançados</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Categorias ilimitadas, variações de produtos, controle de estoque, relatórios avançados e muito mais.
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
                  Até 100 produtos
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Até 10 categorias
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  3 imagens por produto
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
              <p className="text-4xl font-bold mb-6">R$ 47<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Até 1.000 produtos
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Até 50 categorias
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  5 imagens por produto
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
              <p className="text-4xl font-bold mb-6">R$ 97<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Até 10.000 produtos
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Até 200 categorias
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  10 imagens por produto
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Integração ERP (em breve)
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
            <h2 className="text-3xl font-bold mb-6">Integrações com ERPs</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
              Mantenha seu catálogo sempre atualizado com integrações nativas com os principais sistemas de gestão do mercado.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-blue-600">Em Desenvolvimento</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                    <span>Tiny ERP - Sem previsão</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-blue-600">Próximas Integrações</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                    <span>Bling - Sem previsão</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                    <span>Conta Azul - Sem previsão</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                    <span>Omie - Sem previsão</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Integrações em Desenvolvimento
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300">
                Nossas integrações com ERPs estão em desenvolvimento. Futuramente você poderá sincronizar seus produtos automaticamente com os principais sistemas do mercado.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;