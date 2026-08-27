import { useCallback, useEffect } from 'react';
import {
  guessBrandName,
  isRunningInIllustrator,
  readAssets,
  readDocumentInfo,
} from '@core/illustrator';
import { useApp } from '@ui/state/store';

/**
 * Synchronise le panneau avec le document actif.
 *
 * UXP n emet pas encore d evenement fiable de changement de document actif dans
 * Illustrator : on relit donc a la demande et a chaque retour de focus, ce qui
 * couvre le cas reel (l utilisateur bascule de document puis revient au panneau).
 */
export function useDocument(): { refresh: () => void; available: boolean } {
  const { dispatch } = useApp();

  const refresh = useCallback(() => {
    const info = readDocumentInfo();
    if (!info) return;
    dispatch({
      type: 'document/loaded',
      name: info.name,
      assets: readAssets(),
      brandName: guessBrandName(info.name),
    });
  }, [dispatch]);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  return { refresh, available: isRunningInIllustrator() };
}
