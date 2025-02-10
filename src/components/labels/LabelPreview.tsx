import React, { useState, useRef } from 'react';
import { X, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

interface LabelPreviewProps {
  label: any;
  onClose: () => void;
  onPrint: () => void;
}

export function LabelPreview({ label, onClose, onPrint }: LabelPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const previewRef = useRef<HTMLDivElement>(null);

  const template = label.template;
  const totalPages = Math.ceil((template.rows * template.columns) || 1);

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Visualizar Etiqueta</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-center mb-4 space-x-4">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={zoom <= 50}
            >
              -
            </button>
            <span className="py-2">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={zoom >= 200}
            >
              +
            </button>
          </div>

          <div
            ref={previewRef}
            className="bg-white shadow-inner rounded-lg p-8 mx-auto"
            style={{
              width: `${210 * (zoom / 100)}mm`,
              height: `${297 * (zoom / 100)}mm`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center'
            }}
          >
            {/* Preview content will be rendered here */}
            <div className="border border-gray-300 w-full h-full relative">
              {label.design.fields.map((field: any) => (
                <div
                  key={field.id}
                  className="absolute"
                  style={{
                    left: `${field.x}px`,
                    top: `${field.y}px`,
                    width: `${field.width}px`,
                    height: `${field.height}px`,
                    transform: `rotate(${field.rotation}deg)`
                  }}
                >
                  {/* Render field content based on type */}
                  {field.content}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onPrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
}