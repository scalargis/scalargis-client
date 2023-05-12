import React, { useState, useEffect } from 'react'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import useFormFields from "./useFormFields";
import './style.css'
import { useLayoutEffect } from 'react';

export default function PrintGroupItem(props) {

  const { control, printLayer, printGroup, printDetails, groupItem, config, actions } = props;
  const { selectedPrints, setSelectedPrints } = props;
  const { viewer, mainMap, dispatch, Models } = config;

  const onSelectedPrintChange = (e) => {
    let prints = [...selectedPrints];

    if (e.checked)
      prints.push(e.value);
    else
      prints.splice(prints.indexOf(e.value), 1);

    setSelectedPrints(prints);
  }

  return (
    <ul>
      <li>
        <span><b>{groupItem.title}</b></span>
        {(groupItem.children && groupItem.children.length > 0) &&
          <React.Fragment>
            {groupItem.children.map(item => {
              return (
                <PrintGroupItem
                  key={item.id}
                  config={config}
                  actions={actions}
                  printGroup={printGroup}
                  printDetails={printDetails}
                  groupItem={item}
                  selectedPrints={selectedPrints}
                  setSelectedPrints={setSelectedPrints}
                />
              )
            })}
          </React.Fragment>
        }
        {(groupItem.prints && groupItem.prints.length > 0) &&
          <ul>
            {groupItem.prints.map(print => {
              return (
                <li key={print.id}>
                  {printDetails.allow_selection &&
                    <Checkbox value={print.uuid}
                      onChange={onSelectedPrintChange} checked={selectedPrints.includes(print.uuid)} />
                  }
                  <span className="task-name p-ml-1">{print.title}</span>
                </li>
              )
            })}
          </ul>
        }
      </li>
    </ul>
  )
}