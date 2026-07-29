import React from 'react'
import { Checkbox } from '@mantine/core';

import './style.css'

export default function PrintGroupItem(props) {

  const { printGroup, printDetails, groupItem, config, actions } = props;
  const { selectedPrints, setSelectedPrints } = props;

  const onSelectedPrintChange = (e) => {
    const prints = [...selectedPrints];

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
                  {printDetails.allow_selection ?
                    <Checkbox size="sm"
                      label={print.title}
                      checked={selectedPrints.includes(print.uuid)}
                      onChange={(e) => onSelectedPrintChange({ checked: e.currentTarget.checked, value: print.uuid })} />
                    :
                    <span className="task-name">{print.title}</span>
                  }
                </li>
              )
            })}
          </ul>
        }
      </li>
    </ul>
  )
}
