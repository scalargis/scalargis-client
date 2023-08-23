import React, { useCallback, useState } from 'react';
import {
  ArrayLayoutProps,
  RankedTester,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsArrayLayoutProps } from '@jsonforms/react';
//import { MaterialTableControl } from './MaterialTableControl';
import { DeleteDialog } from './DeleteDialog';

export const PrimereactArrayControlRenderer = (props: ArrayLayoutProps) => {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(undefined);
  const [rowData, setRowData] = useState(undefined);
  const { removeItems, visible } = props;

  console.log(props);

  const openDeleteDialog = useCallback(
    //(p: string, rowIndex: number) => {
    (p: any, rowIndex: any) => {
      setOpen(true);
      setPath(p);
      setRowData(rowIndex);
    },
    [setOpen, setPath, setRowData]
  );
  const deleteCancel = useCallback(() => setOpen(false), [setOpen]);
  const deleteConfirm = useCallback(() => {
    //const p = path.substring(0, path.lastIndexOf('.'));
    const p = (path || '').substring(0, (path || '').lastIndexOf('.'));
    //removeItems(p, [rowData])();
    (p && removeItems && rowData) && removeItems(p, [rowData])();
    setOpen(false);
  }, [setOpen, path, rowData]);
  const deleteClose = useCallback(() => setOpen(false), [setOpen]);

  // TODO
  return (
    <div>TODO: PrimereactArrayControlRenderer</div>
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <MaterialTableControl {...props} openDeleteDialog={openDeleteDialog} />
      <DeleteDialog
        open={open}
        onCancel={deleteCancel}
        onConfirm={deleteConfirm}
        onClose={deleteClose}
        acceptText={props.translations.deleteDialogAccept}
        declineText={props.translations.deleteDialogDecline}
        title={props.translations.deleteDialogTitle}
        message={props.translations.deleteDialogMessage}
      />
    </Hidden>
  );
  */
};

export const primereactArrayControlTester: RankedTester = rankWith(
  3,
  or(isObjectArrayControl, isPrimitiveArrayControl)
);

export default withJsonFormsArrayLayoutProps(PrimereactArrayControlRenderer);