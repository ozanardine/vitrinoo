import React, { useState } from 'react';
import { X, Printer, Settings } from 'lucide-react';

interface PrintDialogProps {
  label: any;
  onClose: () => void;
}

export function PrintDialog({ label, onClose }: PrintDialogProps) {
  const [copies, setCopies] = useState(1);
  const [startPosition, setStartPosition] = useState(1);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    try {
      setLoading(true);

      // Create print document
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Não foi possível abrir a janela de impressão');
      }

      // Generate print content
      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Imprimir Etiquetas</title>
            <style>
              @page {
                size: A4;
                margin: ${label.template.margin_top_mm}mm ${label.template.margin_right_mm}mm ${label.template.margin_bottom_mm}mm ${label.template.margin_left_mm}mm;
              }
              .label {
                width: ${label.template.width_mm}mm;
                height: ${label.template.height_mm}mm;
                position: relative;
                page-break-inside: avoid;
                float: left;
                margin-right: ${label.template.gap_horizontal_mm}mm;
                margin-bottom: ${label.template.gap_vertical_mm}mm;
              }
              /* Add more styles for fields */
            </style>
          </head>
          <body>
            ${Array(copies).fill(0).map(() => `
              <div class="label">
                ${label.design.fields.map((field: any) => `
                  <div style="
                    position: absolute;
                    left: ${field.x}px;
                    top: ${field.y}px;
                    width: ${field.width}px;
                    height: ${field.height}px;
                    transform: rotate(${field.rotation}deg);
                  ">
                    ${field.content}
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </body>
        </html>
      `;

      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();

      onClose();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Imprimir Etiquetas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Impressora</label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Impressora Padrão</option>
              {/* Printer list will be populated by the browser */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Número de Cópias</label>
            <input
              type="number"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value)))}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Posição Inicial</label>
            <input
              type="number"
              value={startPosition}
              onChange={(e) => setStartPosition(Math.max(1, parseInt(e.target.value)))}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="1"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Útil quando você já usou algumas etiquetas da folha
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Impressora</span>
          </button>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrint}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>{loading ? 'Imprimindo...' : 'Imprimir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}