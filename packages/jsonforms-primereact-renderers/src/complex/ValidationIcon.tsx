import React from 'react';

//import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
//import { Badge, Tooltip, styled } from '@mui/material';

/*
const StyledBadge = styled(Badge)(({ theme }: any) => ({
  color: theme.palette.error.main,
}));
*/

export interface ValidationProps {
  errorMessages: string;
  id: string;
}

const ValidationIcon: React.FC<ValidationProps> = ({ errorMessages, id }) => {
  // TODO
  return (
    <div>TODO</div>
  );
  /*
  return (
    <Tooltip id={id} title={errorMessages}>
      <StyledBadge badgeContent={errorMessages.split('\n').length}>
        <ErrorOutlineIcon color='inherit' />
      </StyledBadge>
    </Tooltip>
  );
  */
};

export default ValidationIcon;