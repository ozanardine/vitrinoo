import { useEffect, useCallback, useState } from 'react';
import { Palette, Droplet, AlertCircle, Grid } from 'lucide-react';
import { Alert } from '@mui/material';
import { StoreHeader } from '../../../store/StoreHeader';
import { useThemeStore } from '../../../../stores/useThemeStore';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { COLOR_PRESETS } from '../../../../constants/theme';
import { ColorPicker } from '../forms/ColorPicker';
import { ThemePresetSelector } from './theme/ThemePresetSelector';

interface ThemeSettingsProps {
  selectedPreset: string | null;
  onPresetChange: (presetId: string) => void;
}

interface ThemeData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBackground: string;
  background: string;
}

interface ValidationError {
  field: keyof ThemeData;
  message: string;
}

export function ThemeSettings({ selectedPreset, onPresetChange }: ThemeSettingsProps) {
  const { previewData, updatePreview, stagePendingChanges } = useStoreCustomization();
  const themeState = useThemeStore();
  
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [localPreset, setLocalPreset] = useState<string | null>(selectedPreset);

  // Validar cor no formato hexadecimal
  const validateColor = useCallback((color: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }, []);

  // Validar todas as cores do tema
  const validateTheme = useCallback((theme: Partial<ThemeData>): ValidationError[] => {
    const errors: ValidationError[] = [];
    Object.entries(theme).forEach(([key, value]) => {
      if (!validateColor(value)) {
        errors.push({
          field: key as keyof ThemeData,
          message: `Cor ${key} inválida. Use formato hexadecimal.`
        });
      }
    });
    return errors;
  }, [validateColor]);

  // Handler para mudança de cores individuais
  const handleColorChange = useCallback((key: keyof ThemeData) => (color: string) => {
    if (!validateColor(color)) {
      setValidationErrors(prev => {
        const filtered = prev.filter(e => e.field !== key);
        return [...filtered, { field: key, message: 'Cor inválida' }];
      });
      return;
    }

    setValidationErrors(prev => prev.filter(error => error.field !== key));
    
    const updates = {
      [key]: color,
      ...(key === 'primaryColor' ? { background: color } : {})
    };
    
    // Atualiza preview
    updatePreview(updates, 'theme');
    
    // Prepara mudanças para salvamento
    stagePendingChanges(updates, 'theme');
    
    // Atualiza estado local do tema
    themeState.updateColor(key, color);
    
    // Reset preset selection since we're customizing colors
    setLocalPreset(null);
  }, [themeState, updatePreview, stagePendingChanges, validateColor]);

  // Handler para seleção de preset
  const handlePresetSelect = useCallback((presetId: string, colors: any) => {
    try {
      const updatedData = {
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        accentColor: colors.accent,
        headerBackground: colors.header.background,
        background: colors.primary
      };

      const errors = validateTheme(updatedData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      setValidationErrors([]);

      // Atualiza preview e prepara mudanças
      updatePreview(updatedData, 'theme');
      stagePendingChanges(updatedData, 'theme');

      // Atualiza estado local do tema para preview
      Object.entries(updatedData).forEach(([key, value]) => {
        themeState.updateColor(key as keyof ThemeData, value);
      });
      
      // Atualiza preset local e notifica mudança externa para controle de estado
      setLocalPreset(presetId);
      onPresetChange(presetId);
      
    } catch (error) {
      console.error('Erro ao aplicar preset:', error);
      setValidationErrors([{
        field: 'primaryColor',
        message: 'Erro ao aplicar tema. Tente novamente.'
      }]);
    }
  }, [themeState, validateTheme, updatePreview, stagePendingChanges, onPresetChange]);

  // Sincroniza preset local com estado externo
  useEffect(() => {
    if (selectedPreset !== localPreset) {
      setLocalPreset(selectedPreset);
    }
  }, [selectedPreset]);

  return (
    <div className="space-y-8">
      {validationErrors.length > 0 && (
        <Alert
          severity="error"
          icon={<AlertCircle className="w-5 h-5" />}
          sx={{ mb: 2 }}
        >
          <div className="font-medium">Corrija os seguintes erros:</div>
          <ul className="list-disc list-inside mt-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Temas Predefinidos
        </h3>
        <ThemePresetSelector
          selectedPreset={localPreset}
          onSelect={handlePresetSelect}
        />
      </section>

      <section className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Droplet className="w-5 h-5" />
          Cores Personalizadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker
            label="Cor Principal"
            value={previewData.primaryColor}
            onChange={handleColorChange('primaryColor')}
            description="Cor de fundo principal"
            presets={COLOR_PRESETS.primary}
            error={validationErrors.find(e => e.field === 'primaryColor')?.message}
          />
          <ColorPicker
            label="Cor Secundária"
            value={previewData.secondaryColor}
            onChange={handleColorChange('secondaryColor')}
            description="Cor do texto e elementos de contraste"
            presets={COLOR_PRESETS.secondary}
            error={validationErrors.find(e => e.field === 'secondaryColor')?.message}
          />
          <ColorPicker
            label="Cor de Destaque"
            value={previewData.accentColor}
            onChange={handleColorChange('accentColor')}
            description="Cor para botões e elementos interativos"
            presets={COLOR_PRESETS.accent}
            error={validationErrors.find(e => e.field === 'accentColor')?.message}
          />
          {previewData.headerStyle !== 'image' && (
            <ColorPicker
              label="Cor do Cabeçalho"
              value={previewData.headerBackground}
              onChange={handleColorChange('headerBackground')}
              description="Cor de fundo específica para o cabeçalho"
              presets={COLOR_PRESETS.primary}
              error={validationErrors.find(e => e.field === 'headerBackground')?.message}
            />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Grid className="w-5 h-5" />
          Preview do Layout
        </h3>
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <StoreHeader
            name="Nome da Loja"
            description="Uma descrição atraente para sua loja online"
            logoUrl={previewData.logoUrl || "/api/placeholder/400/400"}
            primaryColor={previewData.primaryColor}
            secondaryColor={previewData.secondaryColor}
            accentColor={previewData.accentColor}
            socialLinks={[
              { type: 'instagram', url: 'instagram' },
              { type: 'whatsapp', url: '5541999999999' },
              { type: 'email', url: 'contato@vitryno.com' }
            ]}
            customization={{
              headerStyle: previewData.headerStyle,
              headerHeight: '200px',
              headerImage: previewData.headerImage,
              headerGradient: 'to bottom',
              headerAlignment: 'center',
              headerOverlayOpacity: previewData.headerOverlayOpacity,
              headerVisibility: {
                logo: true,
                title: true,
                description: true,
                socialLinks: true
              },
              logoSize: '120px',
              titleSize: '32px',
              descriptionSize: '16px',
              titleFont: 'Roboto',
              bodyFont: 'Roboto',
              socialSettings: {
                contactsPosition: 'above',
                displayFormat: 'username'
              },
              headerBackground: previewData.headerBackground,
              preview: true
            }}
          />
        </div>
      </section>
    </div>
  );
}