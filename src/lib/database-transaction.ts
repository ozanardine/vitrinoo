/**
 * Sistema para gerenciamento de transações no Supabase
 * 
 * OBS: Como o Supabase REST API não suporta transações explícitas,
 * esta implementação oferece garantias de "all or nothing" em nível de aplicação
 * para operações que afetam múltiplas tabelas.
 */

import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorCategory, ErrorCode } from './errors';

/**
 * Interface para uma operação em uma tabela
 */
interface TableOperation {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  data: any;
  conditions?: Record<string, any>;
  options?: Record<string, any>;
  undoOperation?: TableOperation;
}

/**
 * Interface para um registro de transação
 */
interface TransactionRecord {
  id: string;
  operations: TableOperation[];
  status: 'pending' | 'committed' | 'rolledback' | 'failed';
  createdAt: string;
  updatedAt: string;
  error?: any;
  completedOperations: number;
}

/**
 * Opções para a transação
 */
interface TransactionOptions {
  // Identificador único para a transação (opcional)
  id?: string;
  // Se verdadeiro, desfaz operações concluídas em caso de falha
  rollbackOnFailure?: boolean;
  // Função chamada após o commit da transação
  onCommit?: (transaction: TransactionRecord) => void;
  // Função chamada após o rollback da transação
  onRollback?: (transaction: TransactionRecord, error?: any) => void;
  // Função chamada a cada operação bem-sucedida
  onOperation?: (operation: TableOperation, index: number) => void;
}

/**
 * Executa uma operação individual no Supabase
 */
async function executeOperation(
  operation: TableOperation
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const { table, operation: op, data, conditions, options } = operation;
    let query;

    switch (op) {
      case 'insert':
        query = supabase.from(table).insert(data, options);
        break;
      case 'update':
        query = supabase.from(table).update(data, options);
        if (conditions) {
          Object.entries(conditions).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        break;
      case 'delete':
        query = supabase.from(table).delete(options);
        if (conditions) {
          Object.entries(conditions).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        break;
      case 'upsert':
        query = supabase.from(table).upsert(data, options);
        break;
      default:
        throw new Error(`Operação não suportada: ${op}`);
    }

    const { data: result, error } = options?.returning !== false 
      ? await query.select() 
      : await query;

    if (error) {
      return { success: false, error };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Classe para gerenciar uma transação
 */
export class DatabaseTransaction {
  private id: string;
  private operations: TableOperation[] = [];
  private status: 'pending' | 'committed' | 'rolledback' | 'failed' = 'pending';
  private createdAt: string;
  private updatedAt: string;
  private options: TransactionOptions;
  private completedOperations: number = 0;
  private results: any[] = [];
  private error?: any;

  /**
   * Cria uma nova transação
   */
  constructor(options: TransactionOptions = {}) {
    this.id = options.id || uuidv4();
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
    this.options = {
      rollbackOnFailure: true,
      ...options,
    };
  }

  /**
   * Adiciona uma operação de inserção à transação
   */
  insert(table: string, data: any, options: Record<string, any> = {}) {
    this.operations.push({
      table,
      operation: 'insert',
      data,
      options,
      // Operação para desfazer em caso de rollback
      undoOperation: {
        table,
        operation: 'delete',
        data: null,
        conditions: { id: data.id },
        options: { returning: false }
      }
    });
    return this;
  }

  /**
   * Adiciona uma operação de atualização à transação
   */
  update(
    table: string, 
    data: any, 
    conditions: Record<string, any>, 
    options: Record<string, any> = {}
  ) {
    // Para operações de update, precisamos armazenar o estado anterior
    // para poder reverter em caso de rollback
    this.operations.push({
      table,
      operation: 'update',
      data,
      conditions,
      options,
      // A operação de desfazer será definida durante a execução,
      // após recuperarmos os dados atuais
    });
    return this;
  }

  /**
   * Adiciona uma operação de exclusão à transação
   */
  delete(
    table: string, 
    conditions: Record<string, any>, 
    options: Record<string, any> = {}
  ) {
    // Para operações de delete, precisamos armazenar os dados
    // para poder reverter em caso de rollback
    this.operations.push({
      table,
      operation: 'delete',
      data: null,
      conditions,
      options,
      // A operação de desfazer será definida durante a execução,
      // após recuperarmos os dados atuais
    });
    return this;
  }

  /**
   * Adiciona uma operação de upsert à transação
   */
  upsert(
    table: string, 
    data: any, 
    options: Record<string, any> = {}
  ) {
    // Para operações de upsert, o rollback é mais complexo
    // pois podem ser tanto inserts quanto updates
    this.operations.push({
      table,
      operation: 'upsert',
      data,
      options,
      // A operação de desfazer será definida durante a execução
    });
    return this;
  }

  /**
   * Prepara as operações de rollback
   */
  private async prepareRollbackOperations(): Promise<boolean> {
    try {
      for (let i = 0; i < this.operations.length; i++) {
        const operation = this.operations[i];
        
        // Se já tem uma operação de rollback definida, pular
        if (operation.undoOperation) {
          continue;
        }
        
        // Para operações que precisam buscar dados atuais para o rollback
        if (operation.operation === 'update' || operation.operation === 'delete') {
          // Buscar dados atuais
          const { data: currentData, error } = await supabase
            .from(operation.table)
            .select('*')
            .match(operation.conditions || {});
            
          if (error) {
            console.error(`Erro ao preparar rollback para ${operation.table}:`, error);
            return false;
          }
          
          if (operation.operation === 'update') {
            // Para update, a operação de rollback é outro update com os dados anteriores
            operation.undoOperation = {
              table: operation.table,
              operation: 'update',
              data: currentData,
              conditions: operation.conditions,
              options: { returning: false }
            };
          } else if (operation.operation === 'delete') {
            // Para delete, a operação de rollback é um insert com os dados anteriores
            operation.undoOperation = {
              table: operation.table,
              operation: 'insert',
              data: currentData,
              options: { returning: false }
            };
          }
        } else if (operation.operation === 'upsert') {
          // Para upsert, verificar se o registro já existe
          const hasId = Array.isArray(operation.data) 
            ? operation.data.every(item => item.id)
            : operation.data.id;
            
          if (hasId) {
            // Se tem ID, buscar dados atuais
            const ids = Array.isArray(operation.data)
              ? operation.data.map(item => item.id)
              : [operation.data.id];
              
            const { data: currentData, error } = await supabase
              .from(operation.table)
              .select('*')
              .in('id', ids);
              
            if (error) {
              console.error(`Erro ao preparar rollback para ${operation.table}:`, error);
              return false;
            }
            
            // Se os dados existem, a operação de rollback é um update
            // Caso contrário, é um delete
            operation.undoOperation = currentData?.length > 0
              ? {
                  table: operation.table,
                  operation: 'update',
                  data: currentData,
                  conditions: { id: ids },
                  options: { returning: false }
                }
              : {
                  table: operation.table,
                  operation: 'delete',
                  data: null,
                  conditions: { id: ids },
                  options: { returning: false }
                };
          } else {
            // Se não tem ID, não temos como fazer rollback específico
            // Assumimos que será uma inserção e preparamos para excluir
            operation.undoOperation = {
              table: operation.table,
              operation: 'delete',
              data: null,
              // As condições serão preenchidas após a execução da operação
              options: { returning: false }
            };
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao preparar operações de rollback:', error);
      return false;
    }
  }

  /**
   * Executa o rollback da transação
   */
  private async rollback(failedAtIndex: number): Promise<boolean> {
    this.status = 'rolledback';
    this.updatedAt = new Date().toISOString();
    
    // Executar operações de rollback na ordem inversa
    for (let i = failedAtIndex - 1; i >= 0; i--) {
      const operation = this.operations[i];
      const undoOp = operation.undoOperation;
      
      if (!undoOp) {
        console.warn(`Sem operação de rollback para ${operation.table} (${operation.operation})`);
        continue;
      }
      
      try {
        const { success, error } = await executeOperation(undoOp);
        
        if (!success) {
          console.error(`Falha no rollback para ${operation.table}:`, error);
          // Continuar tentando outras operações de rollback
        }
      } catch (error) {
        console.error(`Erro no rollback para ${operation.table}:`, error);
        // Continuar tentando outras operações de rollback
      }
    }
    
    // Notificar sobre o rollback
    if (this.options.onRollback) {
      this.options.onRollback(this.toRecord(), this.error);
    }
    
    return true;
  }
  
  /**
   * Converte a transação para um registro
   */
  private toRecord(): TransactionRecord {
    return {
      id: this.id,
      operations: this.operations,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      error: this.error,
      completedOperations: this.completedOperations
    };
  }

  /**
   * Executa todas as operações da transação
   */
  async execute(): Promise<any[]> {
    if (this.status !== 'pending') {
      throw new AppError({
        code: ErrorCode.VALIDATION_INCORRECT_DATA,
        category: ErrorCategory.VALIDATION,
        message: `Transação já foi ${this.status}`,
      });
    }
    
    // Se não temos operações, apenas retornar um array vazio
    if (this.operations.length === 0) {
      this.status = 'committed';
      this.updatedAt = new Date().toISOString();
      return [];
    }
    
    // Preparar operações de rollback se necessário
    if (this.options.rollbackOnFailure) {
      await this.prepareRollbackOperations();
    }
    
    // Executar cada operação
    for (let i = 0; i < this.operations.length; i++) {
      const operation = this.operations[i];
      
      try {
        const { success, data, error } = await executeOperation(operation);
        
        if (!success) {
          this.error = error;
          if (this.options.rollbackOnFailure) {
            await this.rollback(i);
          }
          
          this.status = 'failed';
          this.updatedAt = new Date().toISOString();
          
          throw new AppError({
            code: ErrorCode.SERVER_DATABASE_ERROR,
            category: ErrorCategory.SERVER,
            message: `Falha na operação ${operation.operation} para ${operation.table}`,
            details: { error, operation },
            originalError: error,
          });
        }
        
        // Armazenar o resultado
        this.results.push(data);
        this.completedOperations++;
        
        // Atualizar condições de rollback para operações de upsert sem ID
        if (
          operation.operation === 'upsert' && 
          operation.undoOperation?.operation === 'delete' &&
          !operation.undoOperation.conditions
        ) {
          // Extrair IDs dos registros inseridos
          const ids = Array.isArray(data) 
            ? data.map(item => item.id)
            : [data.id];
            
          operation.undoOperation.conditions = { id: ids };
        }
        
        // Notificar sobre a operação bem-sucedida
        if (this.options.onOperation) {
          this.options.onOperation(operation, i);
        }
      } catch (error) {
        this.error = error;
        
        if (this.options.rollbackOnFailure && this.status !== 'rolledback') {
          await this.rollback(i);
        }
        
        this.status = 'failed';
        this.updatedAt = new Date().toISOString();
        
        throw error instanceof AppError ? error : new AppError({
          code: ErrorCode.SERVER_DATABASE_ERROR,
          category: ErrorCategory.SERVER,
          message: `Erro na operação ${operation.operation} para ${operation.table}`,
          details: { error, operation },
          originalError: error,
        });
      }
    }
    
    // Se chegamos aqui, todas as operações foram bem-sucedidas
    this.status = 'committed';
    this.updatedAt = new Date().toISOString();
    
    // Notificar sobre o commit bem-sucedido
    if (this.options.onCommit) {
      this.options.onCommit(this.toRecord());
    }
    
    return this.results;
  }
  
  /**
   * Shorthand para criar e executar uma transação em um único passo
   */
  static async execute(
    operations: (transaction: DatabaseTransaction) => void,
    options: TransactionOptions = {}
  ): Promise<any[]> {
    const transaction = new DatabaseTransaction(options);
    operations(transaction);
    return transaction.execute();
  }
}