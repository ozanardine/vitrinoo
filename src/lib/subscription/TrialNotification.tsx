import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, X } from 'lucide-react';
import { useSubscription } from '../hooks/use-subscription';
import { useNavigate } from 'react-router-dom';

interface TrialNotificationProps {
  storeId: string;
}

/**
 * Componente para exibir alertas sobre o período de teste
 */
export const TrialNotification: React.FC<TrialNotificationProps> = ({ storeId }) => {
  const [visible, setVisible] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const { subscription, isTrialSubscription, getTrialDaysRemaining } = useSubscription(storeId);
  const navigate = useNavigate();

  useEffect(() => {
    // Mostrar apenas se estiver em trial e não tiver sido fechado recentemente
    if (subscription && isTrialSubscription()) {
      const days = getTrialDaysRemaining();
      
      // Mostra notificação se estiver nos últimos 3 dias ou no primeiro acesso
      const shouldShow = days <= 3 || !localStorage.getItem('trial_notification_shown');
      
      if (shouldShow) {
        setDaysRemaining(days);
        setVisible(true);
        localStorage.setItem('trial_notification_shown', 'true');
      }
    }
  }, [subscription, isTrialSubscription, getTrialDaysRemaining]);

  // Se não tiver dias para mostrar ou não estiver visível, não renderizar
  if (!visible || daysRemaining < 0) {
    return null;
  }

  const handleDismiss = () => {
    setVisible(false);
    // Salvar que o usuário viu a notificação hoje
    localStorage.setItem('trial_notification_dismissed_date', new Date().toISOString().split('T')[0]);
  };

  const navigateToPricing = () => {
    navigate('/profile?tab=plans');
  };

  return (
    <div className={`fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border ${
      daysRemaining <= 1 
        ? 'border-red-300 dark:border-red-700' 
        : 'border-yellow-300 dark:border-yellow-700'
    } z-50 transition-all duration-300 transform`}>
      <div className="p-4">
        <div className="flex items-start">
          {daysRemaining <= 1 ? (
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          ) : (
            <Clock className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
          )}
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {daysRemaining === 0 
                ? 'Seu período de teste termina hoje!' 
                : daysRemaining === 1 
                  ? 'Seu período de teste termina amanhã!' 
                  : `Restam ${daysRemaining} dias no seu período de teste`}
            </h3>
            
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {daysRemaining <= 1 
                ? 'Escolha um plano para continuar usando todos os recursos.'
                : 'Aproveite os recursos premium do plano Enterprise. Escolha um plano antes do fim do período para continuar.'}
            </p>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={navigateToPricing}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  daysRemaining <= 1
                    ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-800/50'
                }`}
              >
                Ver planos
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Lembrar depois
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleDismiss} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};