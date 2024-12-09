import React from 'react';
import {
  ControlElement,
  createDefaultValue,
  JsonSchema,
  ArrayTranslations,
} from '@jsonforms/core';
/*
import { IconButton, TableRow, Tooltip, Grid, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
*/
import ValidationIcon from './ValidationIcon';
import NoBorderTableCell from './NoBorderTableCell';

export interface MaterialTableToolbarProps {
  numColumns: number;
  errors: string;
  label: string;
  path: string;
  uischema: ControlElement;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  enabled: boolean;
  translations: ArrayTranslations;
  addItem(path: string, value: any): () => void;
}

const fixedCellSmall = {
  paddingLeft: 0,
  paddingRight: 0,
};

// TODO
const TableToolbar = React.memo(function TableToolbar({
  numColumns,
  errors,
  label,
  path,
  addItem,
  schema,
  enabled,
  translations,
}: MaterialTableToolbarProps) {
  return(
    <div>TODO: TableToolbar</div>
  );
  /*
  return (
    <TableRow>
      <NoBorderTableCell colSpan={numColumns}>
        <Grid
          container
          justifyContent={'flex-start'}
          alignItems={'center'}
          spacing={2}
        >
          <Grid item>
            <Typography variant={'h6'}>{label}</Typography>
          </Grid>
          <Grid item>
            {errors.length !== 0 && (
              <Grid item>
                <ValidationIcon
                  id='tooltip-validation'
                  errorMessages={errors}
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      </NoBorderTableCell>
      {enabled ? (
        <NoBorderTableCell align='right' style={fixedCellSmall}>
          <Tooltip
            id='tooltip-add'
            title={translations.addTooltip}
            placement='bottom'
          >
            <IconButton
              aria-label={translations.addAriaLabel}
              onClick={addItem(path, createDefaultValue(schema))}
              size='large'
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </NoBorderTableCell>
      ) : null}
    </TableRow>
  );
  */
});

export default TableToolbar;