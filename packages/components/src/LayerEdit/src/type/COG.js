import React, { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";

import { Dropdown } from 'primereact/dropdown';
import {InputSwitch} from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Fieldset } from 'primereact/fieldset';

export default function COG(props) {

    const { data, editField, Models } = props;
  
    const { t } = useTranslation(); 

    const [showAdvanceOptions, setShowAdvancedOptions] = useState(false);
    
    const bandOptions = useMemo(() => {
        if (!data?.options?.image_bands) {
          return [1, 2, 3];
        }
        return [...Array(data.options.image_bands).keys().map(i => i+1)];
      }, [data?.options?.image_bands]);

    const onChangeBand = (index, value) => {
        const bands = [...selectedBands];
        bands[index] = value;

        const new_options = {
            ...data?.options,
            bands: bands
        }
        editField("options", new_options);
    }

    const onChangeConvertToRGB = (value) => {
        const new_options = {
            ...data?.options,
            convertToRGB: value
        }
        editField("options", new_options);
    }

    const onChangeNoData = (value) => {
        const new_options = {
            ...data?.options,
            nodata: value
        }
        editField("options", new_options);
    }

    let selectedBands = [1, 2, 3];
    let convertToRGB;
    let nodata;
    if (data?.options?.bands?.length) {
        selectedBands = data.options.bands;
    } else if (data?.options?.bands?.length) {
        selectedBands = data.options.bands;
    }
    convertToRGB = data?.options?.convertToRGB != null ? data.options.convertToRGB : false;
    nodata = data.options?.nodata != null ? data.options?.nodata : undefined;

    // Don't show if advancedOptions equals False
    if (data?.advancedOptions === false) return null;

    return (
        <div>
            <p style={{textAlign: 'right'}}>
            <a style={{cursor: 'pointer'}}
                onClick={e => setShowAdvancedOptions(!showAdvanceOptions)}>
                {t("advancedOptions", "Opções Avançadas")}{' '}
                <i className={showAdvanceOptions ? 'pi pi-angle-up' : 'pi pi-angle-down'}></i>
            </a>
            </p>
            { showAdvanceOptions && (
            <div className="p-pb-2">
                <div className="p-grid p-col-12">
                    <div className="p-field p-col-12 p-md-6">
                        <Fieldset legend={t("bands", `Bandas` )} className="p-col-12">
                            <div className="p-field p-grid">
                                <label className="p-col-12 p-md-4">{t("red", "Vermelho")}</label>
                                <div className="p-col-12 p-md-8">
                                    <Dropdown placeholder={t("selectBands", "Selecione a banda")}
                                    options={bandOptions}
                                    value={selectedBands[0]}
                                    onChange={({ value }) => {
                                        onChangeBand(0, value);
                                    }}
                                    />
                                </div>
                            </div>
                            <div className="p-field p-grid">
                                <label className="p-col-12 p-md-4">{t("green", "Verde")}</label>
                                <div className="p-col-12 p-md-8">
                                    <Dropdown placeholder={t("selectBands", "Selecione a banda")}
                                    options={bandOptions}
                                    value={selectedBands[1]}
                                    onChange={({ value }) => {
                                        onChangeBand(1, value);
                                    }}
                                    />
                                </div>
                            </div>
                            <div className="p-field p-grid">
                                <label className="p-col-12 p-md-4">{t("azul", "Azul")}</label>
                                <div className="p-col-12 p-md-8">
                                    <Dropdown placeholder={t("selectBands", "Selecione a banda")}
                                    options={bandOptions}
                                    value={selectedBands[2]}
                                    onChange={({ value }) => {
                                        onChangeBand(2, value);
                                    }}
                                    />
                                </div>
                            </div>
                        </Fieldset>
                    </div>
                    <div className="p-field p-col-12 p-md-6 p-mt-4">
                        <div className="p-field p-grid">
                            <label className="p-col-12 p-md-4">{t("convertToRGB", "Converter para RGB")}</label>
                            <InputSwitch className="p-ml-2" checked={convertToRGB} onChange={(e) => {
                                onChangeConvertToRGB(e.value);
                            }} />
                        </div> 

                        <div className="p-field p-grid">
                            <label className="p-col-12 p-md-4">{t("nodataValue", "Valor NoData")}</label>
                            <div className="p-col-12 p-md-8">
                                <InputNumber value={nodata} mode="decimal" onValueChange={(e) => {
                                onChangeNoData(e.value);
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ) }
        </div>
    )
}