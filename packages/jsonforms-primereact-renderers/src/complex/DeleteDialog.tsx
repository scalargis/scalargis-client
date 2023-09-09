import React from 'react';
/*
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
*/

export interface DeleteDialogProps {
  open: boolean;
  onClose(): void;
  onConfirm(): void;
  onCancel(): void;
  title: string;
  message: string;
  acceptText: string;
  declineText: string;
}

export interface WithDeleteDialogSupport {
  openDeleteDialog(path: string, data: number): void;
}

export const DeleteDialog = React.memo(function DeleteDialog({
  open,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  acceptText,
  declineText,
}: DeleteDialogProps) {
  return (
    <div>Delete Dialog</div>
  );
  /*
  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      aria-labelledby='alert-dialog-confirmdelete-title'
      aria-describedby='alert-dialog-confirmdelete-description'
    >
      <DialogTitle id='alert-dialog-confirmdelete-title'>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-confirmdelete-description'>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color='primary'>
          {declineText}
        </Button>
        <Button onClick={onConfirm} color='primary'>
          {acceptText}
        </Button>
      </DialogActions>
    </Dialog>
  );
  */
});