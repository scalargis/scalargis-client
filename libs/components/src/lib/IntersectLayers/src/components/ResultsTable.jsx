import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { i18n } from '../../../components';


export default function ResultsTable(props) {

    const { records, fields, filters, onFiltersChange } = props;

    const t = i18n.translateValue;

    const showAreaColumn = records.filter(r => r.dimension == 2).length > 0 && 
        (props?.showResultMeasure !== false || props?.showResultPercentage !== false);
    const showLengthColumn = records.filter(r => r.dimension == 1).length > 0 && 
        (props?.showResultMeasure !== false || props?.showResultPercentage !== false);

    const numericValueTemplate = (val) => {
        const precision = 100;
        return val ? Math.round(val * precision) / precision : val;
    };

    return (
        <DataTable value={records} filters={filters} onFilter={filter => onFiltersChange(filter.filters)}>
            { fields.map((item, index) => {
                const fieldTitle = t(item?.title || item?.alias, item?.title || item?.alias || item?.field);
                return (
                    <Column key={index} field={item.field} header={fieldTitle} filter sortable></Column>
                );
            })}
            { showAreaColumn && props?.showResultMeasure ?
                <Column key="area" field="area" dataType="numeric" header={`${t("area", "Área")} (m²)`} filter sortable body={rowData => numericValueTemplate(rowData.area)} /> : null
            }
            { showLengthColumn && props?.showResultMeasure ?
                <Column key="length" field="length" dataType="numeric" header={`${t("length", "Comprimento")} (m)`} filter sortable body={rowData => numericValueTemplate(rowData.length)} /> : null
            }
            { (showAreaColumn || showLengthColumn) && props?.showResultPercentage ?
                <Column key="percentage" field="percent" dataType="numeric" header="%" filter sortable body={rowData => numericValueTemplate(rowData.percent)} /> : null
            }
        </DataTable>
    );

}