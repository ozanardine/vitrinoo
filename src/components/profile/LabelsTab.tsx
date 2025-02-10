import React, { useState, useEffect } from 'react';
import { Plus, Printer, Settings, Layout, Edit2, Trash2, AlertTriangle, Eye } from 'lucide-react';
import { Store } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { LabelDesigner } from '../labels/LabelDesigner';
import { LabelPreview } from '../labels/LabelPreview';
import { PrintDialog } from '../labels/PrintDialog';

interface LabelsTabProps {
  store: Store;
}

interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  width_mm: number;
  height_mm: number;
  paper_type: string;
  columns: number;
  rows: number;
}

interface CustomLabel {
  id: string;
  name: string;
  description: string;
  template_id: string;
  design: any;
  created_at: string;
}

export function LabelsTab({ store }: LabelsTabProps) {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [labels, setLabels] = useState<CustomLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDesigner, setShowDesigner] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<CustomLabel | null>(null);
  const [labelToDelete, setLabelToDelete] = useState<CustomLabel | null>(null);

  useEffect(() => {
    loadData();
  }, [store.id]);

  const loadData = async () => {
    try {
      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('label_templates')
        .select('*')
        .order('name');

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Load custom labels
      const { data: labelsData, error: labelsError } = await supabase
        .from('custom_labels')
        .select(`
          *,
          template:label_templates(*)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (labelsError) throw labelsError;
      setLabels(labelsData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (label: CustomLabel) => {
    try {
      const { error } = await supabase
        .from('custom_labels')
        .delete()
        .eq('id', label.id);

      if (error) throw error;
      
      setLabels(labels.filter(l => l.id !== label.id));
      setLabelToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir etiqueta:', err);
    }
  };

  if (store.subscription.plan_type !== 'plus') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Recurso Exclusivo Plus
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          O sistema de etiquetas está disponível apenas para assinantes do plano Plus.
          Faça upgrade do seu plano para acessar este recurso.
        </p>
        <button className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
          Fazer Upgrade
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Etiquetas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Crie e imprima etiquetas personalizadas para seus produtos
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedLabel(null);
            setShowDesigner(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Etiqueta</span>
        </button>
      </div>

      {labels.length === 0 ? (
        <div className="text-center py-12">
          <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhuma etiqueta criada ainda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labels.map((label) => (
            <div
              key={label.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{label.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {label.description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedLabel(label);
                        setShowPreview(true);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLabel(label);
                        setShowDesigner(true);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLabelToDelete(label)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => {
                      setSelectedLabel(label);
                      setShowPrintDialog(true);
                    }}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLabel(label);
                      setShowDesigner(true);
                    }}
                    className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configurar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDesigner && (
        <LabelDesigner
          store={store}
          templates={templates}
          label={selectedLabel}
          onClose={() => {
            setShowDesigner(false);
            setSelectedLabel(null);
            loadData();
          }}
        />
      )}

      {showPreview && selectedLabel && (
        <LabelPreview
          label={selectedLabel}
          onClose={() => {
            setShowPreview(false);
            setSelectedLabel(null);
          }}
          onPrint={() => {
            setShowPreview(false);
            setShowPrintDialog(true);
          }}
        />
      )}

      {showPrintDialog && selectedLabel && (
        <PrintDialog
          label={selectedLabel}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedLabel(null);
          }}
        />
      )}

      {labelToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir a etiqueta "{labelToDelete.name}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setLabelToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(labelToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}