import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type {
  ColorVariant,
  ExportReport,
  ExportSettings,
  LogoAsset,
  NamingScheme,
  OutputSettings,
  PackagePlan,
  ProgressEvent,
} from '@/types';
import { buildPackagePlan, createDefaultSettings } from '@core/index';

export interface AppState {
  settings: ExportSettings;
  documentName: string | null;
  busy: boolean;
  progress: ProgressEvent | null;
  report: ExportReport | null;
}

export type Action =
  | { type: 'document/loaded'; name: string; assets: LogoAsset[]; brandName: string }
  | { type: 'assets/toggle'; id: string }
  | { type: 'assets/setAll'; selected: boolean }
  | { type: 'assets/setRole'; id: string; role: LogoAsset['role'] }
  | { type: 'variants/toggle'; id: string }
  | { type: 'variants/patch'; id: string; patch: Partial<ColorVariant> }
  | { type: 'presets/toggle'; id: string }
  | { type: 'naming/patch'; patch: Partial<NamingScheme> }
  | { type: 'output/patch'; patch: Partial<OutputSettings> }
  | { type: 'brand/setName'; name: string }
  | { type: 'export/start' }
  | { type: 'export/progress'; progress: ProgressEvent }
  | { type: 'export/finish'; report: ExportReport }
  | { type: 'settings/replace'; settings: ExportSettings };

export function createInitialState(): AppState {
  return {
    settings: createDefaultSettings(),
    documentName: null,
    busy: false,
    progress: null,
    report: null,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  const { settings } = state;
  switch (action.type) {
    case 'document/loaded':
      return {
        ...state,
        documentName: action.name,
        settings: {
          ...settings,
          assets: action.assets,
          brand: { ...settings.brand, name: action.brandName },
        },
      };
    case 'assets/toggle':
      return patchSettings(state, {
        assets: settings.assets.map((a) =>
          a.id === action.id ? { ...a, selected: !a.selected } : a,
        ),
      });
    case 'assets/setAll':
      return patchSettings(state, {
        assets: settings.assets.map((a) => ({ ...a, selected: action.selected })),
      });
    case 'assets/setRole':
      return patchSettings(state, {
        assets: settings.assets.map((a) => (a.id === action.id ? { ...a, role: action.role } : a)),
      });
    case 'variants/toggle':
      return patchSettings(state, {
        variants: settings.variants.map((v) =>
          v.id === action.id ? { ...v, enabled: !v.enabled } : v,
        ),
      });
    case 'variants/patch':
      return patchSettings(state, {
        variants: settings.variants.map((v) =>
          v.id === action.id ? { ...v, ...action.patch } : v,
        ),
      });
    case 'presets/toggle':
      return patchSettings(state, {
        presetIds: settings.presetIds.includes(action.id)
          ? settings.presetIds.filter((id) => id !== action.id)
          : [...settings.presetIds, action.id],
      });
    case 'naming/patch':
      return patchSettings(state, { naming: { ...settings.naming, ...action.patch } });
    case 'output/patch':
      return patchSettings(state, { output: { ...settings.output, ...action.patch } });
    case 'brand/setName':
      return patchSettings(state, { brand: { ...settings.brand, name: action.name } });
    case 'export/start':
      return { ...state, busy: true, progress: null, report: null };
    case 'export/progress':
      return { ...state, progress: action.progress };
    case 'export/finish':
      return { ...state, busy: false, report: action.report, progress: null };
    case 'settings/replace':
      return { ...state, settings: action.settings };
  }
}

function patchSettings(state: AppState, patch: Partial<ExportSettings>): AppState {
  return { ...state, settings: { ...state.settings, ...patch } };
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  plan: PackagePlan;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  // Le plan est derive des reglages : il ne fait donc pas partie de l etat, ce
  // qui evite toute divergence entre ce qui est affiche et ce qui sera exporte.
  const plan = useMemo(() => buildPackagePlan(state.settings), [state.settings]);
  const value = useMemo(() => ({ state, dispatch, plan }), [state, plan]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp doit etre utilise dans un AppProvider.');
  return value;
}
