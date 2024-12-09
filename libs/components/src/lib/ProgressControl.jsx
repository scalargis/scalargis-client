import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';


export default function ProgressControl(props) {

  return (
    <>
      <ProgressSpinner style={{width: '40px', height: '40px'}} strokeWidth="5" fill="#EEEEEE" />
      <div>{ props.children }</div>
    </>
  );

}
