import React, { useEffect, useState, useRef } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { defaults } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Box, Button, Grid, Loader, Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconDownload } from '@scalargis/ui';
import dayjs from 'dayjs';

import dataProvider from '../../../service/DataProvider';
import { fetchJson } from  '../../../service/fetch'
import PageSection from '../common/PageSection';


defaults.animation = false

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

// The @mantine/dates pickers exchange 'YYYY-MM-DD' strings; customRange keeps
// Dates because getDataByCustomRange compares them.
const toPickerDate = (value) => (value ? dayjs(value).format('YYYY-MM-DD') : null);
const fromPickerDate = (value) => (value ? dayjs(value).toDate() : null);

export default function ViewerVisitsChart(props) {

    const { core } = props;

    const API_URL = core.API_URL;

    const [types, setTypes] = useState([
        { label: 'Visualização de mapas', value: 'VM' },
        { label: 'Emissão de plantas', value: 'EP' }
    ]);

    const [timeranges, setTimeranges] = useState([
        { label: 'Desde sempre', value: 'all' },
        { label: 'Últimos 7 dias', value: '7' },
        { label: 'Últimos 30 dias', value: '30' },
        { label: 'Últimos 100 dias', value: '100' },
        { label: 'Último ano', value: '365' },
        { label: 'Período', value: 'custom'}
    ]);

    const [op_type, set_op_type] = useState("VM")

    const [selected_viewer, set_selected_viewer] = useState(null);
    const [viewers_list, set_viewers_list] = useState(null);

    const [timerange, changeTimeRange] = useState("100")

    const [dates_str, changeDates_str] = useState()
    const [data_values, changeData_values] = useState()

    const [input_dates_str, set_input_dates_str] = useState()
    const [input_data_values, set_input_data_values] = useState()

    const [customRange, setCustomRange] = useState(null)

    const [loading_data_chart, set_loading_data_chart] = useState(false)

    const searchTimer = useRef(null);


    useEffect(() => {
        if (props?.stats?.types) {
            setTypes([...props.stats.types]);
        }
        if (props?.stats?.timeranges) {
            setTimeranges([...props.stats.timeranges]);
        }
        if (props?.stats?.selected_type) {
            set_op_type(props.stats.selected_type);
        }
        if (props?.stats?.selected_timerange) {
            changeTimeRange(props.stats.selected_timerange);
        }
    }, [props.stats]);

    useEffect(() => {
        set_loading_data_chart(true)

        let url = API_URL + '/portal/stats/viewer_visits?type_code=' + op_type;
        if (selected_viewer) {
            url += '&viewer_id=' + selected_viewer.value;
        }

        const httpClient = fetchJson;

        httpClient(url).then(({ headers, json }) => json)
        .then (result => {
            set_loading_data_chart(false)

            if (result.values) {
                const input_d = result.values.map(e => e.date)
                const input_v = result.values.map(e => e.count)

                set_input_dates_str(input_d)
                set_input_data_values(input_v)

                if (timerange === 'all') {
                    changeDates_str(input_d)
                    changeData_values(input_v)
                    return
                }

                if (timerange === 'custom') {
                    const new_data = getDataByCustomRange(input_d, input_v)
                    changeDates_str(new_data[0])
                    changeData_values(new_data[1])
                    return
                }

                let pos = input_d.length - 1 - parseInt(timerange)
                if (pos < 0) pos = 0

                const new_dates = input_d.slice(pos, input_d.length - 1)
                const new_values = input_v.slice(pos, input_v.length - 1)

                changeDates_str(new_dates)
                changeData_values(new_values)
            } else {
                set_input_dates_str(null);
                set_input_data_values(null);

                changeDates_str(null);
                changeData_values(null);
            }
        })
        .catch(error => {
            console.log("fetch error")
            set_loading_data_chart(false)
        });
    }, [op_type, selected_viewer])


    useEffect(() => {
        if (timerange !== 'custom') return;

        const new_data = getDataByCustomRange(input_dates_str, input_data_values);
        changeDates_str(new_data[0]);
        changeData_values(new_data[1]);
    }, [customRange]);

    const data = {
        labels: dates_str,
        datasets: [
            {
                data: data_values,
                fill: false,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgba(255, 99, 132, 0.8)',
                tension: 0.25
            },
        ],
    };


    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
                position: 'top',
            },
            title: {
                display: true,
                text: 'Contagem diária'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }

    function getDataByCustomRange(dates_str, dates_values) {
        let new_dates_str = [];
        let  new_dates_values = [];
        if (customRange?.length > 1) {
            dates_str.forEach((d, i) => {
                const date = new Date(d);
                if (customRange[0]<= date && customRange[1] >= date) {
                    new_dates_str.push(dates_str[i]);
                    new_dates_values.push(dates_values[i]);
                }
            });
        } else {
            new_dates_str = [...dates_str];
            new_dates_values = [...data_values];
        }
        return [new_dates_str, new_dates_values]
    }


    function changeTimeRangeAction(value) {

        changeTimeRange(value)

        if (value === 'all') {
            changeDates_str(input_dates_str)
            changeData_values(input_data_values)
            return
        }

        if (value === 'custom') {
            setCustomRange([new Date(dates_str[0]), new Date(dates_str[dates_str.length - 1])])
            return;
        }

        if (input_dates_str) {
            let pos = input_dates_str.length - 1 - parseInt(value)
            if (pos < 0) pos = 0

            const new_dates = input_dates_str.slice(pos, input_dates_str.length - 1)
            const new_values = input_data_values.slice(pos, input_data_values.length - 1)

            changeDates_str(new_dates)
            changeData_values(new_values)
        }
    }

    function changeOpType(value) {
        set_op_type(value)
    }

    function changeCustomRange(index, value) {
        const new_range = customRange?.length ? [...customRange] : [null, null];
        new_range[index] = value;

        setCustomRange(new_range);
    }

    const searchViewer = (query) => {
        const params = { filter: {'name': query.trim()} };

        const provider = dataProvider(API_URL + '/portal');
        provider.getSimpleList('/viewers/list', params).then(d => {
            set_viewers_list(d.data.map(d=>{return {value: d.id, name: d.name}}));
          }).catch(e => {
            console.log('searchViewers: fetch error.');
          });
    }

    // AutoComplete's delay=500 equivalent: debounce the remote search.
    const onViewerSearchChange = (query) => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (!query) return;
        searchTimer.current = setTimeout(() => searchViewer(query), 500);
    }

    const exportCSV = (e) => {

        let data = data_values.map((val, idx) => { return [dates_str[idx], val]});
        data = [['Data', 'Total'], ...data];

        let csvString = "";
        data.forEach(function(row, rowIndex) {
            csvString += row.join(',');
            csvString += "\r\n";
          });
        csvString = "data:application/csv," + encodeURIComponent(csvString);
        const x = document.createElement("A");
        x.setAttribute("href", csvString );
        x.setAttribute("download", `stats_${op_type}.csv`);
        document.body.appendChild(x);
        x.click()
    }


    return (
        <PageSection>
            <Grid gap="sm">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                        data={types}
                        value={op_type}
                        onChange={(value) => { if (value != null) changeOpType(value); }}
                        allowDeselect={false} />

                    { !props?.stats?.viewers?.length &&
                        <Box py="xs">
                            <Select
                                placeholder="Escolha um Visualizador"
                                data={(viewers_list || []).map(v => ({ value: String(v.value), label: v.name }))}
                                value={selected_viewer ? String(selected_viewer.value) : null}
                                onChange={(value) => {
                                    const new_val = value != null
                                      ? (viewers_list || []).find(v => String(v.value) === value) || null
                                      : null;
                                    set_selected_viewer(new_val);
                                }}
                                onSearchChange={onViewerSearchChange}
                                searchable clearable />
                        </Box>
                    }
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    { props?.stats?.viewers?.length > 0 &&
                        <Select
                            placeholder="Escolha um Visualizador"
                            data={(props?.stats?.viewers || []).map(v => ({ ...v, value: String(v.value) }))}
                            value={selected_viewer ? String(selected_viewer.value) : null}
                            searchable={(props?.stats?.viewers || []).length > 25}
                            clearable
                            onChange={(value) => {
                                let new_val = null;
                                if (value != null && props?.stats?.viewers?.length) {
                                    new_val = props.stats.viewers.find(d => String(d.value) === value) || null;
                                }
                                set_selected_viewer(new_val)
                            }} />
                    }
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                        data={timeranges}
                        value={timerange}
                        onChange={(value) => { if (value != null) changeTimeRangeAction(value); }}
                        allowDeselect={false} />

                    { timerange === 'custom' &&
                    <Grid mt={4} gap="sm">
                        <Grid.Col span="auto">
                            <DatePickerInput
                                valueFormat="DD/MM/YYYY" placeholder="dd/mm/aaaa"
                                value={toPickerDate(customRange?.length ? customRange[0] : null)}
                                onChange={(value) => changeCustomRange(0, fromPickerDate(value))} />
                        </Grid.Col>
                        <Box ta="center" style={{ alignContent: 'center' }}>e</Box>
                        <Grid.Col span="auto">
                            <DatePickerInput
                                valueFormat="DD/MM/YYYY" placeholder="dd/mm/aaaa"
                                value={toPickerDate(customRange?.length ? customRange[1] : null)}
                                onChange={(value) => changeCustomRange(1, fromPickerDate(value))} />
                        </Grid.Col>
                    </Grid>
                    }
                </Grid.Col>
                { loading_data_chart &&
                <Grid.Col ta="right" span={{ base: 12, md: 6 }}>
                    <Loader size="sm" />
                </Grid.Col>
                }

                <Grid.Col ta="right" span={12}>
                    <Button
                        variant="outline"
                        leftSection={<IconDownload />}
                        onClick={exportCSV}
                        disabled={!data_values?.length}>Exportar CSV</Button>
                </Grid.Col>


                <Line data={data} options={options} />
            </Grid>
        </PageSection>
    )
}
