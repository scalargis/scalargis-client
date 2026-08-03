import React, { useMemo } from 'react';
import { useTranslation } from "react-i18next";

import { Accordion, Fieldset, NumberInput, Select, Switch } from '@mantine/core';

export default function COG(props) {

    const { data, editField } = props;

    const { t } = useTranslation();

    const bandOptions = useMemo(() => {
        if (!data?.options?.image_bands) {
          return [1, 2, 3];
        }
        return Array.from({length: data.options.image_bands}, (_, index) => (index + 1));
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
    if (data?.options?.bands?.length) {
        selectedBands = data.options.bands;
    }
    const convertToRGB = data?.options?.convertToRGB != null ? data.options.convertToRGB : false;
    const nodata = data.options?.nodata != null ? data.options?.nodata : undefined;

    // Don't show if advancedOptions equals False
    if (data?.advancedOptions === false) return null;

    return (
        <Accordion className="pt-2">
          <Accordion.Item value="advanced">
            <Accordion.Control>{t("advancedOptions", "Opções Avançadas")}</Accordion.Control>
            <Accordion.Panel>
            <div className="pb-2">
                <div className="grid col-12">
                    <div className="field col-12 md:col-6">
                        <Fieldset legend={t("bands", `Bandas` )} className="col-12">
                            <div className="field grid">
                                <label className="col-12 md:col-4">{t("red", "Vermelho")}</label>
                                <div className="col-12 md:col-8">
                                    <Select placeholder={t("selectBands", "Selecione a banda")}
                                    data={bandOptions.map(b => String(b))}
                                    value={selectedBands[0] != null ? String(selectedBands[0]) : null}
                                    onChange={(value) => {
                                        onChangeBand(0, Number(value));
                                    }}
                                    />
                                </div>
                            </div>
                            <div className="field grid">
                                <label className="col-12 md:col-4">{t("green", "Verde")}</label>
                                <div className="col-12 md:col-8">
                                    <Select placeholder={t("selectBands", "Selecione a banda")}
                                    data={bandOptions.map(b => String(b))}
                                    value={selectedBands[1] != null ? String(selectedBands[1]) : null}
                                    onChange={(value) => {
                                        onChangeBand(1, Number(value));
                                    }}
                                    />
                                </div>
                            </div>
                            <div className="field grid">
                                <label className="col-12 md:col-4">{t("azul", "Azul")}</label>
                                <div className="col-12 md:col-8">
                                    <Select placeholder={t("selectBands", "Selecione a banda")}
                                    data={bandOptions.map(b => String(b))}
                                    value={selectedBands[2] != null ? String(selectedBands[2]) : null}
                                    onChange={(value) => {
                                        onChangeBand(2, Number(value));
                                    }}
                                    />
                                </div>
                            </div>
                        </Fieldset>
                    </div>
                    <div className="field col-12 md:col-6 mt-4">
                        <div className="field grid">
                            <label className="col-12 md:col-4">{t("convertToRGB", "Converter para RGB")}</label>
                            <Switch size="md" className="ml-2" style={{ display: 'inline-block' }} checked={convertToRGB || false} onChange={(e) => {
                                onChangeConvertToRGB(e.currentTarget.checked);
                            }} />
                        </div>

                        <div className="field grid">
                            <label className="col-12 md:col-4">{t("nodataValue", "Valor NoData")}</label>
                            <div className="col-12 md:col-8">
                                <NumberInput hideControls value={nodata != null ? nodata : ''} onChange={(value) => {
                                onChangeNoData(typeof value === 'number' ? value : (value === '' || value == null ? null : Number(value)));
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
    )
}
