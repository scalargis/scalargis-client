/* =====================================================================
   Recipe default strings — the "i18n-aware defaults" the plan's §1c
   contract requires (02-phase-1-foundations.md, notify row).

   The en/pt dictionaries below register on the HOST i18next instance
   (the one both app shells initialise) as the `scalargis_ui` namespace —
   AdsProviders triggers registration, and uiText() re-checks lazily so
   an imperative call (notify, confirm) resolves in whatever language is
   active at call time. Outside an initialised i18next (unit tests), the
   built-in fallback string is returned.

   These are DEFAULTS only: every recipe prop (acceptLabel, chooseLabel,
   placeholder, …) still wins, so screens with their own translation
   pipeline are unaffected.
   ===================================================================== */

import i18next from 'i18next';

export const UI_NAMESPACE = 'scalargis_ui';

const en = {
  confirm: { yes: 'Yes', no: 'No', title: 'Confirmation' },
  notify: { success: 'Success', info: 'Info', warn: 'Warning', error: 'Error' },
  upload: {
    choose: 'Choose',
    upload: 'Upload',
    cancel: 'Cancel',
    complete: 'Upload complete',
    failed: 'Upload failed',
    rejected: 'File rejected',
    tooLarge: 'File is too large (max {{size}})',
    invalidType: 'File type not allowed',
    placeholder: 'Drag and drop files here, or use Choose.',
    remove: 'Remove',
  },
  treeselect: { placeholder: 'Select item', clear: 'Clear selection' },
  skiplink: { label: 'Skip to main content' },
  datagrid: { reorder: 'Reorder row' },
  dialog: { maximize: 'Maximize', restore: 'Restore', close: 'Close' },
  field: { required: 'This field is required' },
};

const pt: typeof en = {
  confirm: { yes: 'Sim', no: 'Não', title: 'Confirmação' },
  notify: { success: 'Sucesso', info: 'Informação', warn: 'Aviso', error: 'Erro' },
  upload: {
    choose: 'Escolher',
    upload: 'Carregar',
    cancel: 'Cancelar',
    complete: 'Carregamento concluído',
    failed: 'Falha no carregamento',
    rejected: 'Ficheiro rejeitado',
    tooLarge: 'O ficheiro é demasiado grande (máx. {{size}})',
    invalidType: 'Tipo de ficheiro não permitido',
    placeholder: 'Arraste ficheiros para aqui ou use Escolher.',
    remove: 'Remover',
  },
  treeselect: { placeholder: 'Selecionar item', clear: 'Limpar seleção' },
  skiplink: { label: 'Saltar para o conteúdo principal' },
  datagrid: { reorder: 'Reordenar linha' },
  dialog: { maximize: 'Maximizar', restore: 'Restaurar', close: 'Fechar' },
  field: { required: 'Campo de preenchimento obrigatório' },
};

/** Idempotent; safe to call on every render. `pt-PT` resolves to the `pt`
 *  bundle through i18next's own language fallback. */
export function registerUiTranslations(): void {
  if (!i18next.isInitialized) return;
  for (const [lng, resources] of [
    ['en', en],
    ['pt', pt],
  ] as const) {
    if (!i18next.hasResourceBundle(lng, UI_NAMESPACE)) {
      i18next.addResourceBundle(lng, UI_NAMESPACE, resources, true, false);
    }
  }
}

/** Resolve a recipe default in the active language, falling back to the
 *  built-in string when i18next is not initialised (unit tests). `vars`
 *  feeds i18next's `{{name}}` interpolation (and the fallback path too). */
export function uiText(
  key: string,
  fallback: string,
  vars?: Record<string, string | number>
): string {
  registerUiTranslations();
  if (!i18next.isInitialized) {
    return vars
      ? fallback.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''))
      : fallback;
  }
  return i18next.t(`${UI_NAMESPACE}:${key}`, { defaultValue: fallback, ...vars });
}
