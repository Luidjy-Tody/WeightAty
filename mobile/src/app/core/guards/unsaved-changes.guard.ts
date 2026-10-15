import type { CanDeactivateFn } from '@angular/router';

/** Composant susceptible de signaler des modifications non enregistrées. */
export interface PendingChangesAware {
  canDeactivate(): boolean | Promise<boolean>;
}

/**
 * Demande confirmation avant de quitter un écran comportant des modifications
 * non enregistrées.
 */
export const unsavedChangesGuard: CanDeactivateFn<PendingChangesAware> = (component) => {
  return component.canDeactivate();
};
