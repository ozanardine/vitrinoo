import { useEffect, useCallback, useState, useMemo } from 'react';
import { Palette, Droplet, AlertCircle, Grid } from 'lucide-react';
import { Alert, Snackbar } from '@mui/material';
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
  const { formData, updateFormData } = useStoreCustomization();
  const themeState = useThemeStore();
  
  // Estado inicial com valores do formData
  const initialState = useMemo(() => ({
    primaryColor: formData.primaryColor,
    secondaryColor: formData.secondaryColor,
    accentColor: formData.accentColor,
    headerBackground: formData.headerBackground || formData.primaryColor,
    background: formData.primaryColor
  }), [formData]);

  const [localData, setLocalData] = useState<ThemeData>(initialState);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (formData.primaryColor) {
      themeState.initializeTheme(formData);
    }
  }, [formData.primaryColor]);

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

  // Detectar mudanças comparando com o estado inicial
  const hasChanges = useMemo(() => {
    return Object.entries(localData).some(([key, value]) => {
      if (key === 'headerBackground') {
        return value !== (formData.headerBackground || formData.primaryColor);
      }
      return value !== formData[key as keyof typeof formData];
    });
  }, [localData, formData]);

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
    
    const newData = {
      ...localData,
      [key]: color,
      ...(key === 'primaryColor' ? { background: color } : {})
    };

    setLocalData(newData);
    themeState.updateColor(key, color);
  }, [localData, themeState]);

  // Handler para seleção de preset
  const handlePresetSelect = useCallback(async (presetId: string, colors: any) => {
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
      setLocalData(updatedData);

      // Atualizar estado do tema
      Object.entries(updatedData).forEach(([key, value]) => {
        themeState.updateColor(key as keyof ThemeData, value);
      });

      // Atualizar preview sem salvar
      updateFormData(updatedData);
      
      onPresetChange(presetId);
      setSuccessMessage('Tema predefinido aplicado com sucesso!');
    } catch (error) {
      console.error('Erro ao aplicar preset:', error);
      setValidationErrors([{
        field: 'primaryColor',
        message: 'Erro ao aplicar tema. Tente novamente.'
      }]);
    }
  }, [themeState, onPresetChange, validateTheme, updateFormData]);

  // Handler para aplicar mudanças
  const handleApplyChanges = useCallback(() => {
    const errors = validateTheme(localData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const themeUpdates = {
        primaryColor: localData.primaryColor,
        secondaryColor: localData.secondaryColor,
        accentColor: localData.accentColor,
        headerBackground: localData.headerBackground,
        background: localData.background
      };

      updateFormData(themeUpdates);
      setValidationErrors([]);
      setSuccessMessage('Alterações aplicadas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      setValidationErrors([{
        field: 'primaryColor',
        message: 'Erro ao salvar alterações. Tente novamente.'
      }]);
    }
  }, [localData, updateFormData, validateTheme]);

  // Handler para descartar mudanças
  const handleDiscardChanges = useCallback(() => {
    setLocalData(initialState);
    setValidationErrors([]);
    
    Object.entries(initialState).forEach(([key, value]) => {
      themeState.updateColor(key as keyof ThemeData, value);
    });
    
    updateFormData(initialState);
  }, [initialState, themeState, updateFormData]);

  return (
    <div className="space-y-8">
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

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
            value={localData.primaryColor}
            onChange={handleColorChange('primaryColor')}
            description="Cor de fundo principal"
            presets={COLOR_PRESETS.primary}
            error={validationErrors.find(e => e.field === 'primaryColor')?.message}
          />
          <ColorPicker
            label="Cor Secundária"
            value={localData.secondaryColor}
            onChange={handleColorChange('secondaryColor')}
            description="Cor do texto e elementos de contraste"
            presets={COLOR_PRESETS.secondary}
            error={validationErrors.find(e => e.field === 'secondaryColor')?.message}
          />
          <ColorPicker
            label="Cor de Destaque"
            value={localData.accentColor}
            onChange={handleColorChange('accentColor')}
            description="Cor para botões e elementos interativos"
            presets={COLOR_PRESETS.accent}
            error={validationErrors.find(e => e.field === 'accentColor')?.message}
          />
          {formData.headerStyle !== 'image' && (
            <ColorPicker
              label="Cor do Cabeçalho"
              value={localData.headerBackground}
              onChange={handleColorChange('headerBackground')}
              description="Cor de fundo específica para o cabeçalho"
              presets={COLOR_PRESETS.primary}
              error={validationErrors.find(e => e.field === 'headerBackground')?.message}
            />
          )}
        </div>

        {hasChanges && (
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Descartar Alterações
            </button>
            <button
              type="button"
              onClick={handleApplyChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={validationErrors.length > 0}
            >
              Aplicar Alterações
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"> <Grid className="w-5 h-5" /> Preview do Layout </h3>
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <StoreHeader
            name="Nome da Loja"
            description="Uma descrição atraente para sua loja online"
            logoUrl={formData.logoUrl || "/api/placeholder/400/400"}
            primaryColor={localData.primaryColor}
            secondaryColor={localData.secondaryColor}
            accentColor={localData.accentColor}
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
              headerBackground: localData.headerBackground,
              preview: true
            }}
          />
        </div>
      </section>
    </div>
  );
}