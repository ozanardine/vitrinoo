import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, Move, Type, Barcode, QrCode, Image, DollarSign, Settings } from 'lucide-react';
import { Store } from '../../lib/types';
import { supabase } from '../../lib/supabase';

interface LabelDesignerProps {
  store: Store;
  templates: any[];
  label?: any;
  onClose: () => void;
}

interface CustomTemplate {
  name: string;
  width_mm: number;
  height_mm: number;
  margin_top_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  margin_right_mm: number;
  paper_type: 'A4' | 'Térmica';
  columns: number;
  rows: number;
  gap_horizontal_mm: number;
  gap_vertical_mm: number;
}

export function LabelDesigner({ 
  store, 
  templates, 
  label, 
  onClose 
}: LabelDesignerProps) {
  const [name, setName] = useState(label?.name || '');
  const [description, setDescription] = useState(label?.description || '');
  const [templateId, setTemplateId] = useState(label?.template_id || '');
  const [customTemplate, setCustomTemplate] = useState<CustomTemplate | null>(null);
  const [showCustomTemplate, setShowCustomTemplate] = useState(false);
  const [design, setDesign] = useState(label?.design || { fields: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [draggingField, setDraggingField] = useState<any>(null);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Constantes para conversão
  const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591px
  const PX_TO_MM = 1 / MM_TO_PX;

  useEffect(() => {
    if (canvasRef.current) {
      const template = templates.find(t => t.id === templateId) || customTemplate;
      if (template) {
        const canvasWidth = canvasRef.current.offsetWidth - 48; // 48px for padding
        const templateWidth = template.width_mm * MM_TO_PX;
        setScale(canvasWidth / templateWidth);
      }
    }
  }, [templateId, customTemplate]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!name) throw new Error('Nome da etiqueta é obrigatório');
      if (!templateId && !customTemplate) throw new Error('Selecione ou crie um modelo de etiqueta');

      const labelData: any = {
        store_id: store.id,
        name,
        description,
        design
      };

      if (customTemplate) {
        const { data: templateData, error: templateError } = await supabase
          .from('label_templates')
          .insert([customTemplate])
          .select()
          .single();

        if (templateError) throw templateError;
        labelData.template_id = templateData.id;
      } else {
        labelData.template_id = templateId;
      }

      if (label) {
        const { error: updateError } = await supabase
          .from('custom_labels')
          .update(labelData)
          .eq('id', label.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('custom_labels')
          .insert([labelData]);

        if (insertError) throw insertError;
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addField = (type: string) => {
    const template = templates.find(t => t.id === templateId) || customTemplate;
    if (!template) return;

    // Define default sizes in millimeters
    const defaultSizes = {
      text: { width: 30, height: 8 },
      price: { width: 20, height: 8 },
      barcode: { width: 40, height: 15 },
      qrcode: { width: 20, height: 20 },
      image: { width: 20, height: 20 }
    };

    const { width: defaultWidth, height: defaultHeight } = defaultSizes[type as keyof typeof defaultSizes];

    const newField = {
      id: Math.random().toString(36).substring(7),
      type,
      content: '',
      x: 0,
      y: 0,
      width: defaultWidth,
      height: defaultHeight,
      fontSize: 3, // 3mm default font size
      fontFamily: 'Arial',
      align: 'left',
      rotation: 0
    };

    setDesign({
      ...design,
      fields: [...design.fields, newField]
    });
    setSelectedField(newField);
  };

  const updateField = (fieldId: string, updates: any) => {
    const template = templates.find(t => t.id === templateId) || customTemplate;
    if (!template) return;

    // Convert pixel values to millimeters for boundary checking
    let finalUpdates = { ...updates };
    
    if ('x' in updates || 'y' in updates || 'width' in updates || 'height' in updates) {
      const field = design.fields.find((f: any) => f.id === fieldId);
      if (!field) return;

      const currentX = 'x' in updates ? updates.x * PX_TO_MM / scale : field.x;
      const currentY = 'y' in updates ? updates.y * PX_TO_MM / scale : field.y;
      const currentWidth = 'width' in updates ? updates.width * PX_TO_MM / scale : field.width;
      const currentHeight = 'height' in updates ? updates.height * PX_TO_MM / scale : field.height;

      // Ensure field stays within label boundaries
      finalUpdates = {
        ...updates,
        x: Math.max(0, Math.min(currentX, template.width_mm - currentWidth)),
        y: Math.max(0, Math.min(currentY, template.height_mm - currentHeight)),
        width: Math.min(currentWidth, template.width_mm - currentX),
        height: Math.min(currentHeight, template.height_mm - currentY)
      };
    }

    const updatedFields = design.fields.map((field: any) =>
      field.id === fieldId ? { ...field, ...finalUpdates } : field
    );

    setDesign({
      ...design,
      fields: updatedFields
    });

    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...finalUpdates });
    }
  };

  const handleDragStart = (e: React.DragEvent, field: any) => {
    setDraggingField(field);
    e.dataTransfer.setData('text/plain', '');

    // Create ghost element
    const ghost = document.createElement('div');
    ghost.style.width = `${field.width * MM_TO_PX * scale}px`;
    ghost.style.height = `${field.height * MM_TO_PX * scale}px`;
    ghost.style.border = '2px solid #3b82f6';
    ghost.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    ghost.style.position = 'absolute';
    ghost.style.left = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingField || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Update ghost element position
    const ghost = document.querySelector('.drag-ghost');
    if (ghost) {
      ghost.setAttribute('style', `
        transform: translate(${x}px, ${y}px);
        width: ${draggingField.width * MM_TO_PX * scale}px;
        height: ${draggingField.height * MM_TO_PX * scale}px;
      `);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!draggingField || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    updateField(draggingField.id, {
      x: x * PX_TO_MM,
      y: y * PX_TO_MM
    });

    setDraggingField(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {label ? 'Editar Etiqueta' : 'Nova Etiqueta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Modelo</label>
              <select
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  setCustomTemplate(null);
                  setShowCustomTemplate(false);
                }}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 mb-2"
              >
                <option value="">Selecione um modelo</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCustomTemplate(!showCustomTemplate)}
                className="w-full flex items-center justify-center space-x-2 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
              >
                <Settings className="w-4 h-4" />
                <span>Modelo Personalizado</span>
              </button>
            </div>

            {showCustomTemplate && (
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Modelo</label>
                  <input
                    type="text"
                    value={customTemplate?.name || ''}
                    onChange={(e) => setCustomTemplate({
                      ...customTemplate || {
                        width_mm: 100,
                        height_mm: 50,
                        margin_top_mm: 0,
                        margin_bottom_mm: 0,
                        margin_left_mm: 0,
                        margin_right_mm: 0,
                        paper_type: 'A4',
                        columns: 1,
                        rows: 1,
                        gap_horizontal_mm: 0,
                        gap_vertical_mm: 0
                      },
                      name: e.target.value
                    })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Largura (mm)</label>
                    <input
                      type="number"
                      value={customTemplate?.width_mm || ''}
                      onChange={(e) => setCustomTemplate({
                        ...customTemplate!,
                        width_mm: parseFloat(e.target.value)
                      })}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      min="1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Altura (mm)</label>
                    <input
                      type="number"
                      value={customTemplate?.height_mm || ''}
                      onChange={(e) => setCustomTemplate({
                        ...customTemplate!,
                        height_mm: parseFloat(e.target.value)
                      })}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      min="1"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Papel</label>
                  <select
                    value={customTemplate?.paper_type || 'A4'}
                    onChange={(e) => setCustomTemplate({
                      ...customTemplate!,
                      paper_type: e.target.value as 'A4' | 'Térmica'
                    })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="A4">Folha A4</option>
                    <option value="Térmica">Etiqueta Térmica</option>
                  </select>
                </div>

                {customTemplate?.paper_type === 'A4' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Colunas</label>
                        <input
                          type="number"
                          value={customTemplate?.columns || ''}
                          onChange={(e) => setCustomTemplate({
                            ...customTemplate!,
                            columns: parseInt(e.target.value)
                          })}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Linhas</label>
                        <input
                          type="number"
                          value={customTemplate?.rows || ''}
                          onChange={(e) => setCustomTemplate({
                            ...customTemplate!,
                            rows: parseInt(e.target.value)
                          })}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Espaço H. (mm)</label>
                        <input
                          type="number"
                          value={customTemplate?.gap_horizontal_mm || ''}
                          onChange={(e) => setCustomTemplate({
                            ...customTemplate!,
                            gap_horizontal_mm: parseFloat(e.target.value)
                          })}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Espaço V. (mm)</label>
                        <input
                          type="number"
                          value={customTemplate?.gap_vertical_mm || ''}
                          onChange={(e) => setCustomTemplate({
                            ...customTemplate!,
                            gap_vertical_mm: parseFloat(e.target.value)
                          })}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Margem Sup. (mm)</label>
                        <input
                          type="number"
                          value={customTemplate?.margin_top_mm || ''}
                          onChange={(e) => setCustomTemplate({
                            ...customTemplate!,
                            margin_top_mm: parseFloat(e.target.value)
                          })}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Margem Inf. (mm)</label>
                        <input
                          type="number"
                          value={customTemplate?.margin_bottom_mm || ''}
                          onChange={(e) => setCustomTemplate({
                            ...customTemplate!,
                            margin_bottom_mm: parseFloat(e.target.value)
                          })}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Margem Esq. (mm)</label>
                        <input
                          type="number"
                          value={customTemplate?.margin_left_mm || ''}
                          onChange={(e) => setCustomTemplate({
                            ...customTemplate!,
                            margin_left_mm: parseFloat(e.target.value)
                          })}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Margem Dir. (mm)</label>
                        <input
                          type="number"
                          value={customTemplate?.margin_right_mm || ''}
                          onChange={(e) => setCustomTemplate({
                            ...customTemplate!,
                            margin_right_mm: parseFloat(e.target.value)
                          })}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium mb-2">Adicionar Campos</h3>
              <div className="space-y-2">
                <button
                  onClick={() => addField('text')}
                  className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Type className="w-4 h-4" />
                  <span>Texto</span>
                </button>
                <button
                  onClick={() => addField('price')}
                  className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Preço</span>
                </button>
                <button
                  onClick={() => addField('barcode')}
                  className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Barcode className="w-4 h-4" />
                  <span>Código de Barras</span>
                </button>
                <button
                  onClick={() => addField('qrcode')}
                  className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR Code</span>
                </button>
                <button
                  onClick={() => addField('image')}
                  className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Image className="w-4 h-4" />
                  <span>Imagem</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto bg-gray-100 dark:bg-gray-900">
            <div
              ref={canvasRef}
              className="bg-white border rounded-lg shadow-inner p-4 mx-auto relative"
              style={{
                width: '100%',
                maxWidth: '800px',
                height: '600px',
                backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
              onDragOver={handleDragOver}
            >
              {(templateId || customTemplate) && (
                <div
                  className="absolute border-2 border-blue-200 dark:border-blue-800"
                  style={{
                    width: `${((customTemplate?.width_mm || templates.find(t => t.id === templateId)?.width_mm || 0) * MM_TO_PX * scale)}px`,
                    height: `${((customTemplate?.height_mm || templates.find(t => t.id === templateId)?.height_mm || 0) * MM_TO_PX * scale)}px`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {design.fields.map((field: any) => (
                    <div
                      key={field.id}
                      className={`absolute cursor-move border-2 ${
                        selectedField?.id === field.id ? 'border-blue-500' : 'border-transparent'
                      }`}
                      style={{
                        left: `${field.x * MM_TO_PX * scale}px`,
                        top: `${field.y * MM_TO_PX * scale}px`,
                        width: `${field.width * MM_TO_PX * scale}px`,
                        height: `${field.height * MM_TO_PX * scale}px`,
                        transform: `rotate(${field.rotation}deg)`
                      }}
                      onClick={() => setSelectedField(field)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, field)}
                      onDragEnd={handleDragEnd}
                    >
                      {field.type === 'text' && (
                        <div className="w-full h-full flex items-center">
                          <span style={{ 
                            fontSize: `${field.fontSize * MM_TO_PX * scale}px`, 
                            fontFamily: field.fontFamily,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {field.content || 'Texto'}
                          </span>
                        </div>
                      )}
                      {field.type === 'price' && (
                        <div className="w-full h-full flex items-center">
                          <span style={{ 
                            fontSize: `${field.fontSize * MM_TO_PX * scale}px`, 
                            fontFamily: field.fontFamily,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            R$ {field.content || '0,00'}
                          </span>
                        </div>
                      )}
                      {field.type === 'barcode' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Barcode className="w-full h-full" />
                        </div>
                      )}
                      {field.type === 'qrcode' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <QrCode className="w-full h-full" />
                        </div>
                      )}
                      {field.type === 'image' && (
                        <div className="w-full h-full flex items-center justify-center border border-dashed border-gray-300">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedField && (
            <div className="w-64 border-l border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Propriedades</h3>
                <button
                  onClick={() => {
                    const newFields = design.fields.filter((f: any) => f.id !== selectedField.id);
                    setDesign({ ...design, fields: newFields });
                    setSelectedField(null);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedField.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Texto</label>
                      <input
                        type="text"
                        value={selectedField.content}
                        onChange={(e) =>
                          updateField(selectedField.id, { content: e.target.value })
                        }
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tamanho da Fonte (mm)</label>
                      <input
                        type="number"
                        value={selectedField.fontSize}
                        onChange={(e) =>
                          updateField(selectedField.id, { fontSize: parseFloat(e.target.value) })
                        }
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        min="1"
                        step="0.1"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Posição X (mm)</label>
                  <input
                    type="number"
                    value={selectedField.x}
                    onChange={(e) =>
                      updateField(selectedField.id, { x: parseFloat(e.target.value) })
                    }
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Posição Y (mm)</label>
                  <input
                    type="number"
                    value={selectedField.y}
                    onChange={(e) =>
                      updateField(selectedField.id, { y: parseFloat(e.target.value) })
                    }
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Largura (mm)</label>
                  <input
                    type="number"
                    value={selectedField.width}
                    onChange={(e) =>
                      updateField(selectedField.id, { width: parseFloat(e.target.value) })
                    }
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    min="1"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Altura (mm)</label>
                  <input
                     type="number"
                    value={selectedField.height}
                    onChange={(e) =>
                      updateField(selectedField.id, { height: parseFloat(e.target.value) })
                    }
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    min="1"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Rotação (graus)</label>
                  <input
                    type="number"
                    value={selectedField.rotation}
                    onChange={(e) =>
                      updateField(selectedField.id, { rotation: parseFloat(e.target.value) })
                    }
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    min="-360"
                    max="360"
                    step="1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Salvar Etiqueta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}