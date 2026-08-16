/* =====================================================================
   Lightbox — a single-image preview, composed over the Dialog recipe.

   The last raw <Modal> holdouts in the lib were single-image lightboxes
   (ArrayPhotoControlRenderer, LayerEdit): a modal whose whole body is one
   image, fit to the viewport, dismissed on Esc or backdrop click. This
   preset is that, so those call sites drop their hand-rolled <Modal> and
   raw <Modal> reaches zero in the lib (B-02, finding 02).

   It is a thin composition, NOT a second Modal.Root: everything windowed
   (overlay, centring, motion, close affordances) is inherited from Dialog.
   ===================================================================== */

import React from 'react';

import { Dialog, type DialogProps } from './Dialog';

export interface LightboxProps
  extends Pick<DialogProps, 'opened' | 'onClose' | 'title' | 'size' | 'zIndex'> {
  /** Image URL. */
  src: string;
  /** Alt text — required; a lightbox with no description is invisible to AT. */
  alt: string;
}

export function Lightbox({ src, alt, title, ...dialog }: LightboxProps) {
  return (
    <Dialog withOverlay title={title} {...dialog}>
      <img
        src={src}
        alt={alt}
        style={{
          display: 'block',
          margin: '0 auto',
          // Fit to the dialog without overflowing it: the body is the
          // scrolling flex cell, so cap to its box and preserve aspect ratio.
          maxWidth: '100%',
          maxHeight: '80vh',
          objectFit: 'contain',
        }}
      />
    </Dialog>
  );
}
