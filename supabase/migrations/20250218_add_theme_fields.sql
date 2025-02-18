-- Adiciona campos relacionados ao tema da loja
alter table stores
  add column if not exists allow_theme_toggle boolean default true,
  add column if not exists header_background text default '#ffffff',
  -- Atualiza o social_settings para incluir os novos campos
  alter column social_settings set default '{"displayFormat": "username", "contactsPosition": "above"}'::jsonb;

-- Remove campos duplicados do social_settings
update stores
set social_settings = jsonb_strip_nulls(
  social_settings - 'display_format' - 'contacts_position' ||
  jsonb_build_object(
    'displayFormat', coalesce(social_settings->>'display_format', social_settings->>'displayFormat', 'username'),
    'contactsPosition', coalesce(social_settings->>'contacts_position', social_settings->>'contactsPosition', 'above')
  )
)
where social_settings is not null;
