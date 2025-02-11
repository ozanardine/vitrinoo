import React from 'react';
import { Clock, MapPin, Globe } from 'lucide-react';

interface ServiceInfoProps {
  form: any;
  setForm: (form: any) => void;
}

export function ServiceInfo({ form, setForm }: ServiceInfoProps) {
  const weekdays = [
    { id: 'sun', label: 'Domingo' },
    { id: 'mon', label: 'Segunda' },
    { id: 'tue', label: 'Terça' },
    { id: 'wed', label: 'Quarta' },
    { id: 'thu', label: 'Quinta' },
    { id: 'fri', label: 'Sexta' },
    { id: 'sat', label: 'Sábado' }
  ];

  const handleWeekdayToggle = (day: string) => {
    const currentAvailability = form.availability || { weekdays: [], hours: [] };
    const weekdays = currentAvailability.weekdays || [];
    
    const newWeekdays = weekdays.includes(day)
      ? weekdays.filter(d => d !== day)
      : [...weekdays, day];

    setForm({
      ...form,
      availability: {
        ...currentAvailability,
        weekdays: newWeekdays
      }
    });
  };

  const addTimeSlot = () => {
    const currentAvailability = form.availability || { weekdays: [], hours: [] };
    const hours = currentAvailability.hours || [];

    setForm({
      ...form,
      availability: {
        ...currentAvailability,
        hours: [
          ...hours,
          { start: '09:00', end: '17:00' }
        ]
      }
    });
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const currentAvailability = form.availability || { weekdays: [], hours: [] };
    const hours = [...(currentAvailability.hours || [])];
    
    hours[index] = {
      ...hours[index],
      [field]: value
    };

    setForm({
      ...form,
      availability: {
        ...currentAvailability,
        hours
      }
    });
  };

  const removeTimeSlot = (index: number) => {
    const currentAvailability = form.availability || { weekdays: [], hours: [] };
    const hours = currentAvailability.hours.filter((_, i) => i !== index);

    setForm({
      ...form,
      availability: {
        ...currentAvailability,
        hours
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Informações do Serviço</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Duração</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={form.duration?.split(':')[0] || ''}
              onChange={(e) => {
                const hours = e.target.value;
                const minutes = form.duration?.split(':')[1] || '00';
                setForm({ ...form, duration: `${hours}:${minutes}` });
              }}
              className="w-20 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="0"
              placeholder="Horas"
            />
            <span>:</span>
            <input
              type="number"
              value={form.duration?.split(':')[1] || ''}
              onChange={(e) => {
                const hours = form.duration?.split(':')[0] || '0';
                const minutes = e.target.value;
                setForm({ ...form, duration: `${hours}:${minutes}` });
              }}
              className="w-20 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="0"
              max="59"
              placeholder="Minutos"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Modalidade</label>
          <select
            value={form.service_modality || ''}
            onChange={(e) => setForm({ ...form, service_modality: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Selecione...</option>
            <option value="presential">Presencial</option>
            <option value="online">Online</option>
            <option value="hybrid">Híbrido</option>
          </select>
        </div>
      </div>

      {(form.service_modality === 'presential' || form.service_modality === 'hybrid') && (
        <div>
          <label className="block text-sm font-medium mb-1">Local do Serviço</label>
          <input
            type="text"
            value={form.service_location || ''}
            onChange={(e) => setForm({ ...form, service_location: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="Endereço ou local de atendimento"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Dias de Atendimento</label>
        <div className="flex flex-wrap gap-2">
          {weekdays.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => handleWeekdayToggle(day.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                form.availability?.weekdays?.includes(day.id)
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Horários de Atendimento</label>
          <button
            type="button"
            onClick={addTimeSlot}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Adicionar Horário
          </button>
        </div>
        <div className="space-y-2">
          {form.availability?.hours?.map((hour: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="time"
                value={hour.start}
                onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <span>até</span>
              <input
                type="time"
                value={hour.end}
                onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => removeTimeSlot(index)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}