import { useStoreCustomization } from '../StoreCustomizationContext';
import { RangeInput } from '../forms/RangeInput';
import '@fontsource/roboto';
import '@fontsource/open-sans';
import '@fontsource/lato';
import '@fontsource/montserrat';
import '@fontsource/playfair-display';
import '@fontsource/merriweather';
import '@fontsource/source-code-pro';
import '@fontsource/fira-mono';

const FONT_OPTIONS = {
  sans: [
    { value: 'roboto', label: 'Roboto', family: 'Roboto' },
    { value: 'open-sans', label: 'Open Sans', family: 'Open Sans' },
    { value: 'lato', label: 'Lato', family: 'Lato' },
    { value: 'montserrat', label: 'Montserrat', family: 'Montserrat' }
  ],
  serif: [
    { value: 'playfair', label: 'Playfair Display', family: 'Playfair Display' },
    { value: 'merriweather', label: 'Merriweather', family: 'Merriweather' }
  ],
  mono: [
    { value: 'source-code-pro', label: 'Source Code Pro', family: 'Source Code Pro' },
    { value: 'fira-mono', label: 'Fira Mono', family: 'Fira Mono' }
  ]
};

export function TypographySettings() {
  const { previewData, updatePreview, stagePendingChanges } = useStoreCustomization();

  // Função para obter a família da fonte
  const getFontFamily = (font: string) => {
    for (const category of Object.values(FONT_OPTIONS)) {
      const foundFont = category.find(f => f.value === font);
      if (foundFont) return foundFont.family;
    }
    return 'system-ui';
  };

  // Handler para mudança de tamanhos
  const handleSizeChange = (key: 'logoSize' | 'titleSize' | 'descriptionSize', value: string) => {
    const updates = { [key]: value };
    
    // Atualiza preview
    updatePreview(updates, 'typography');
    
    // Aplica mudanças
    stagePendingChanges(updates, 'typography');
  };

  // Handler para mudança de fontes
  const handleFontChange = (key: 'titleFont' | 'bodyFont', value: string) => {
    const updates = { [key]: value };
    
    // Atualiza preview
    updatePreview(updates, 'typography');
    
    // Aplica mudanças
    stagePendingChanges(updates, 'typography');
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-medium">Tipografia</h3>

      {/* Font Sizes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RangeInput
          label="Tamanho da Logo"
          value={previewData.logoSize.replace('px', '')}
          onChange={(value) => handleSizeChange('logoSize', value)}
          min="80"
          max="300"
          step="10"
          unit="px"
          description="Tamanho em pixels (80-300px)"
        />

        <RangeInput
          label="Tamanho do Título"
          value={previewData.titleSize.replace('px', '')}
          onChange={(value) => handleSizeChange('titleSize', value)}
          min="24"
          max="72"
          step="2"
          unit="px"
          description="Tamanho em pixels (24-72px)"
        />

        <RangeInput
          label="Tamanho da Descrição"
          value={previewData.descriptionSize.replace('px', '')}
          onChange={(value) => handleSizeChange('descriptionSize', value)}
          min="14"
          max="24"
          step="1"
          unit="px"
          description="Tamanho em pixels (14-24px)"
        />
      </div>

      {/* Font Families */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Title Font */}
        <div className="space-y-4">
          <label className="block text-sm font-medium">Fonte dos Títulos</label>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(FONT_OPTIONS).map(([category, fonts]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm text-gray-500 dark:text-gray-400 capitalize">{category}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {fonts.map(font => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => handleFontChange('titleFont', font.value)}
                      className={`
                        p-3 text-left rounded-lg border-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800
                        ${previewData.titleFont === font.value 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'}
                      `}
                    >
                      <span style={{ fontFamily: font.family }}>{font.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body Font */}
        <div className="space-y-4">
          <label className="block text-sm font-medium">Fonte do Texto</label>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(FONT_OPTIONS).map(([category, fonts]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm text-gray-500 dark:text-gray-400 capitalize">{category}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {fonts.map(font => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => handleFontChange('bodyFont', font.value)}
                      className={`
                        p-3 text-left rounded-lg border-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800
                        ${previewData.bodyFont === font.value 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'}
                      `}
                    >
                      <span style={{ fontFamily: font.family }}>{font.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 space-y-4">
        <h4 className="font-medium">Prévia da Tipografia</h4>
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          <h1 
            style={{ 
              fontSize: `${previewData.titleSize}px`,
              fontFamily: getFontFamily(previewData.titleFont)
            }}
            className="mb-4"
          >
            Exemplo de Título
          </h1>
          <p 
            style={{ 
              fontSize: `${previewData.descriptionSize}px`,
              fontFamily: getFontFamily(previewData.bodyFont)
            }}
            className="max-w-2xl"
          >
            Este é um exemplo de texto para demonstrar como a tipografia será exibida no seu catálogo.
            O tamanho e estilo das fontes podem ser ajustados para melhor se adequar à sua marca.
            Experimente diferentes combinações até encontrar o visual perfeito para sua loja.
          </p>
        </div>
      </div>
    </div>
  );
}