/* =====================================================================
   DIALOG_DEFAULTS — the single source for the ADS dialog "rung".

   Mantine applies a component's theme `defaultProps` only to the compound
   component (<Modal>). Two places build modals imperatively / via Root and
   so BYPASS those defaults, each having to restate the same values:
     - AdsProviders' <ModalsProvider modalProps> (modals.openConfirmModal,
       our confirm() recipe);
     - the Dialog recipe's <Modal.Root> composition.
   Restating them twice is how they drift (finding 01, risk R4). Both spread
   this one constant instead, so the z-index, centering and open motion can
   never fork.

   Values are unchanged from the two former restatements — this is
   de-duplication, not a behaviour change.
   ===================================================================== */

import { motionTransitionProps } from '../theme/motion';

export const DIALOG_DEFAULTS = {
  /** Centred, as Prime dialogs were. */
  centered: true,
  /** ADS overlay ladder — the dialog rung (ads-tokens.css --z-dialog). */
  zIndex: 6000,
  /** Scale-in, from the central motion tokens (theme/motion.ts). */
  transitionProps: motionTransitionProps.dialog,
} as const;
