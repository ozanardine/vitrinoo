import { useEffect, useCallback, useState, useMemo } from 'react';
import { Palette, Droplet, AlertCircle } from 'lucide-react';
import { Alert } from '@mui/material';
import { StoreHeader } from '../../../store/StoreHeader';
import { useThemeStore } from '../../../../stores/useThemeStore';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { useThemePreviewContext } from '../theme-management/ThemePreviewContext';
import { COLOR_PRESETS } from '../../../../constants/theme';
import { ColorPicker } from '../forms/ColorPicker';
import { ThemePresetSelector } from './theme/ThemePresetSelector';
import { ThemePreviewData } from '../theme-management/types';

interface ThemeSettingsProps {
  selectedPreset: string | null;
  onPresetChange: (presetId: string | null) => void;
}

interface ValidationError {
  field: keyof ThemePreviewData;
  message: string;
}

export function ThemeSettings({ selectedPreset, onPresetChange }: ThemeSettingsProps) {
  const { formData, updatePendingChanges } = useStoreCustomization();
  const { previewData, updatePreview } = useThemePreviewContext();
  const themeState = useThemeStore();

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Sincronizar com o tema inicial
  useEffect(() => {
    if (formData.primaryColor) {
      themeState.initializeTheme(formData);
    }
  }, []);

  // Validar cor no formato hexadecimal
  const validateColor = useCallback((color: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }, []);

  // Validar todas as cores do tema
  const validateTheme = useCallback((theme: Partial<ThemePreviewData>): ValidationError[] => {
    const errors: ValidationError[] = [];
    Object.entries(theme).forEach(([key, value]) => {
      if (!validateColor(value)) {
        errors.push({
          field: key as keyof ThemePreviewData,
          message: `Cor ${key} inválida. Use formato hexadecimal.`
        });
      }
    });
    return errors;
  }, [validateColor]);

  // Detectar mudanças comparando com o estado inicial
  const hasChanges = useMemo(() => {
    return Object.entries(previewData).some(([key, value]) => {
      if (key === 'headerBackground') {
        return value !== (formData.headerBackground || formData.primaryColor);
      }
      return value !== formData[key as keyof typeof formData];
    });
  }, [previewData, formData]);

  // Handler para mudança de cores individuais
  const handleColorChange = useCallback((key: keyof ThemePreviewData) => (color: string) => {
    if (!validateColor(color)) {
      setValidationErrors(prev => {
        const filtered = prev.filter(e => e.field !== key);
        return [...filtered, { field: key, message: 'Cor inválida' }];
      });
      return;
    }

    setValidationErrors(prev => prev.filter(error => error.field !== key));
    
    const newData = {
      ...previewData,
      [key]: color,
      ...(key === 'primaryColor' ? { background: color } : {})
    };

    // Atualiza preview
    updatePreview(newData);

    // Atualiza mudanças pendentes
    const pendingData = {
      primary_color: newData.primaryColor,
      secondary_color: newData.secondaryColor,
      accent_color: newData.accentColor,
      header_background: newData.headerBackground,
      background: newData.background
    };
    updatePendingChanges(pendingData, 'theme');
  }, [previewData, updatePreview, updatePendingChanges, validateColor]);

  // Handler para seleção de preset
  const handlePresetSelect = useCallback((presetId: string, colors: any) => {
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
    
    // Atualiza preview
    updatePreview(updatedData);

    // Atualiza mudanças pendentes
    const pendingData = {
      primary_color: colors.primary,
      secondary_color: colors.secondary,
      accent_color: colors.accent,
      header_background: colors.header.background,
      background: colors.primary
    };
    updatePendingChanges(pendingData, 'theme');
    
    onPresetChange(presetId);
  }, [validateTheme, updatePreview, updatePendingChanges, onPresetChange]);

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
          selectedPreset={selectedPreset}
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
          {formData.headerStyle !== 'image' && (
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
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <StoreHeader
            name="Nome da Loja"
            description="Uma descrição atraente para sua loja online"
            logoUrl={formData.logoUrl || "/api/placeholder/400/400"}
            primaryColor={previewData.primaryColor}
            secondaryColor={previewData.secondaryColor}
            accentColor={previewData.accentColor}
            socialLinks={[
              { type: 'instagram', url: 'instagram' },
              { type: 'whatsapp', url: '5541999999999' },
              { type: 'email', url: 'contato@vitryno.com' }
            ]}
            customization={{
              headerStyle: formData.headerStyle,
              headerHeight: '200px',
              headerImage: formData.headerImage,
              headerGradient: 'to bottom',
              headerAlignment: 'center',
              headerOverlayOpacity: formData.headerOverlayOpacity,
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