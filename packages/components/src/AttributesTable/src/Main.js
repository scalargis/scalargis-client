import React from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog';

const paginatorLeft = <Button type="button" icon="pi pi-refresh" className="p-button-text" />;
const paginatorRight = <Button type="button" icon="pi pi-cloud" className="p-button-text" />;

export default function Main({ open, as, onOpen, onClose, data, fields }) {

  if (as === 'button') return (
    <Button icon="pi pi-table"
      title="Tabela de atributos"
      color="blue"
      className="p-button-sm p-button-rounded p-button-text tool"
      onClick={e => onOpen(true)}
    />
  )

  return (
      <React.Fragment>
        <Dialog
          header="Tabela de Attributos"
          visible={open}
          style={{width: '50vw'}} 
          modal 
          onHide={e => onClose(false)}>
            <DataTable 
              value={data} 
              paginator rows={4} 
              paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
              currentPageReportTemplate="A mostrar de {first} até {last} de um total de {totalRecords}"
              rowsPerPageOptions={[2,4]}
              paginatorLeft={paginatorLeft}
              paginatorRight={paginatorRight}
              className="p-datatable-striped">
                
                { fields.map(field =>
                  <Column 
                    key={field.name}
                    field={field.name} 
                    header={field.label}
                    sortable={field.type !== 'url'}
                    filter={field.type !== 'url'}
                    filterPlaceholder={"Procurar por " + field.label.toLowerCase()}
                    body={row => 
                      field.type === 'url' ?
                        <div>
                          <a href={row[field.name]} title={row[field.name]} target="_blank" rel="noopener noreferrer">
                            <i className="pi pi-external-link"></i>
                          </a>
                        </div>
                      : row[field.name]
                    }
                  />
                )}

            </DataTable>
          </Dialog>
      </React.Fragment>
  )
}