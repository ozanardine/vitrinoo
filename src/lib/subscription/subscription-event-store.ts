/**
 * Sistema de Event Sourcing para assinaturas
 * 
 * Este módulo implementa o padrão Event Sourcing para rastrear
 * todas as mudanças de estado nas assinaturas, proporcionando:
 * 
 * - Auditoria completa de todas as transições
 * - Reconstrução do estado em qualquer ponto do tempo
 * - Análise retrospectiva de comportamento
 */
import { supabase } from '../supabase';
import { subscriptionLogger } from './subscription-logger';
import { SubscriptionStatus, SubscriptionEvent } from './subscription-lifecycle';

/**
 * Tipos de eventos relacionados à assinatura
 */
export interface SubscriptionEventData {
  id: string;
  storeId: string;
  subscriptionId: string;
  userId: string;
  eventType: SubscriptionEvent;
  timestamp: string;
  version: number;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Estado atual da assinatura baseado nos eventos
 */
export interface SubscriptionState {
  id: string;
  storeId: string;
  status: SubscriptionStatus;
  planType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
  version: number;
}

export class SubscriptionEventStore {
  /**
   * Registra um novo evento para uma assinatura
   * 
   * @param subscriptionId - ID da assinatura
   * @param eventType - Tipo do evento
   * @param data - Dados relacionados ao evento
   * @param metadata - Metadados adicionais
   * @returns ID do evento registrado
   */
  async appendEvent(
    subscriptionId: string,
    storeId: string, 
    userId: string,
    eventType: SubscriptionEvent,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Buscar a versão atual
      const { data: currentVersion, error: versionError } = await supabase
        .from('subscription_events')
        .select('version')
        .eq('subscription_id', subscriptionId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      const newVersion = (currentVersion?.version || 0) + 1;
      
      // Criar novo evento
      const event: Omit<SubscriptionEventData, 'id'> = {
        storeId,
        subscriptionId,
        userId,
        eventType,
        timestamp: new Date().toISOString(),
        version: newVersion,
        data,
        metadata
      };
      
      const { data: newEvent, error } = await supabase
        .from('subscription_events')
        .insert(event)
        .select('id')
        .single();
        
      if (error) {
        throw error;
      }
      
      // Atualizar snapshot da assinatura (projeção dos eventos)
      await this.updateProjection(subscriptionId);
      
      subscriptionLogger.info(`Evento ${eventType} registrado para assinatura ${subscriptionId}`, {
        eventId: newEvent.id,
        subscriptionId,
        eventType,
        version: newVersion
      });
      
      return newEvent.id;
    } catch (error) {
      subscriptionLogger.error('Erro ao registrar evento para assinatura', {
        subscriptionId,
        eventType,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Busca todos os eventos de uma assinatura
   * 
   * @param subscriptionId - ID da assinatura
   * @param fromVersion - Versão inicial (opcional)
   * @param toVersion - Versão final (opcional)
   * @returns Lista de eventos
   */
  async getEvents(
    subscriptionId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<SubscriptionEventData[]> {
    let query = supabase
      .from('subscription_events')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('version', { ascending: true });
      
    if (fromVersion !== undefined) {
      query = query.gte('version', fromVersion);
    }
    
    if (toVersion !== undefined) {
      query = query.lte('version', toVersion);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Reconstrói o estado da assinatura a partir dos eventos
   * 
   * @param subscriptionId - ID da assinatura
   * @param toVersion - Versão até a qual reconstruir (opcional)
   * @returns Estado reconstruído
   */
  async reconstructState(
    subscriptionId: string,
    toVersion?: number
  ): Promise<SubscriptionState | null> {
    const events = await this.getEvents(subscriptionId, 1, toVersion);
    
    if (events.length === 0) {
      return null;
    }
    
    // Evento inicial (criação)
    const firstEvent = events[0];
    
    // Estado inicial
    let state: SubscriptionState = {
      id: subscriptionId,
      storeId: firstEvent.storeId,
      status: 'inactive',
      planType: 'free',
      isActive: false,
      createdAt: firstEvent.timestamp,
      updatedAt: firstEvent.timestamp,
      metadata: {},
      version: 0
    };
    
    // Aplicar eventos sequencialmente
    for (const event of events) {
      state = this.applyEvent(state, event);
    }
    
    return state;
  }
  
  /**
   * Aplica um evento ao estado atual
   * 
   * @param state - Estado atual
   * @param event - Evento a ser aplicado
   * @returns Novo estado
   */
  private applyEvent(state: SubscriptionState, event: SubscriptionEventData): SubscriptionState {
    const { eventType, data, timestamp, version } = event;
    
    // Cria uma cópia do estado para modificação
    const newState = { ...state, updatedAt: timestamp, version };
    
    // Aplica alterações com base no tipo de evento
    switch (eventType) {
      case 'subscription_created':
        newState.status = data.status || 'trialing';
        newState.planType = data.planType || 'free';
        newState.isActive = ['active', 'trialing'].includes(data.status);
        newState.createdAt = timestamp;
        // Copiar dados específicos para metadados
        newState.metadata = {
          ...newState.metadata,
          planName: data.planName,
          price: data.price,
          currency: data.currency,
          interval: data.interval
        };
        break;
        
      case 'subscription_updated':
        // Atualizar apenas campos presentes no evento
        if (data.status) newState.status = data.status;
        if (data.planType) newState.planType = data.planType;
        if (data.isActive !== undefined) newState.isActive = data.isActive;
        // Mesclar metadados
        newState.metadata = { ...newState.metadata, ...data.metadata };
        break;
        
      case 'subscription_canceled':
        newState.status = 'canceled';
        newState.isActive = false;
        // Adicionar motivo do cancelamento
        newState.metadata = { 
          ...newState.metadata, 
          canceledAt: timestamp,
          cancelReason: data.reason || 'user_request' 
        };
        break;
        
      case 'payment_succeeded':
        if (newState.status === 'past_due' || newState.status === 'unpaid') {
          newState.status = 'active';
          newState.isActive = true;
        }
        // Adicionar informações do pagamento
        newState.metadata = { 
          ...newState.metadata, 
          lastPaymentAt: timestamp,
          paymentAmount: data.amount,
          nextPaymentAt: data.nextPaymentAt
        };
        break;
        
      case 'payment_failed':
        if (newState.status === 'active') {
          newState.status = 'past_due';
        } else if (newState.status === 'past_due') {
          // Se falhar novamente em past_due, mudar para unpaid
          if (data.attemptCount > 1) {
            newState.status = 'unpaid';
            newState.isActive = false;
          }
        }
        // Adicionar informações da falha
        newState.metadata = { 
          ...newState.metadata, 
          lastFailedPaymentAt: timestamp,
          paymentAttempts: (newState.metadata.paymentAttempts || 0) + 1,
          lastFailureReason: data.reason || 'unknown'
        };
        break;
        
      case 'trial_started':
        newState.status = 'trialing';
        newState.isActive = true;
        newState.metadata = { 
          ...newState.metadata, 
          trialStarted: timestamp,
          trialEndsAt: data.trialEndsAt 
        };
        break;
        
      case 'trial_ended':
        if (newState.status === 'trialing') {
          // Verificar se houve pagamento
          newState.status = data.paymentSucceeded ? 'active' : 'incomplete';
          newState.isActive = data.paymentSucceeded;
        }
        newState.metadata = { 
          ...newState.metadata, 
          trialEnded: timestamp
        };
        break;
        
      case 'plan_changed':
        newState.planType = data.newPlanType;
        // Armazenar histórico de planos
        const planHistory = newState.metadata.planHistory || [];
        planHistory.push({
          from: data.oldPlanType,
          to: data.newPlanType,
          changedAt: timestamp
        });
        newState.metadata = { 
          ...newState.metadata, 
          planHistory,
          planName: data.planName,
          price: data.price,
          currency: data.currency
        };
        break;
    }
    
    return newState;
  }
  
  /**
   * Atualiza a projeção (snapshot) da assinatura
   * 
   * @param subscriptionId - ID da assinatura
   */
  private async updateProjection(subscriptionId: string): Promise<void> {
    try {
      // Reconstruir o estado
      const state = await this.reconstructState(subscriptionId);
      
      if (!state) {
        return;
      }
      
      // Atualizar a tabela de projeção
      const { error } = await supabase
        .from('subscription_projections')
        .upsert({
          subscription_id: state.id,
          store_id: state.storeId,
          status: state.status,
          plan_type: state.planType,
          is_active: state.isActive,
          created_at: state.createdAt,
          updated_at: state.updatedAt,
          metadata: state.metadata,
          version: state.version
        }, {
          onConflict: 'subscription_id'
        });
        
      if (error) {
        throw error;
      }
    } catch (error) {
      subscriptionLogger.error('Erro ao atualizar projeção da assinatura', {
        subscriptionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Busca o snapshot mais recente da assinatura
   * 
   * @param subscriptionId - ID da assinatura
   * @returns Estado atual
   */
  async getSubscriptionSnapshot(subscriptionId: string): Promise<SubscriptionState | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_projections')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') { // Não encontrado
          return null;
        }
        throw error;
      }
      
      return {
        id: data.subscription_id,
        storeId: data.store_id,
        status: data.status as SubscriptionStatus,
        planType: data.plan_type,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        metadata: data.metadata || {},
        version: data.version
      };
    } catch (error) {
      subscriptionLogger.error('Erro ao buscar snapshot da assinatura', {
        subscriptionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}