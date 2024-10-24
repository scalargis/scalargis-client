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
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner'
import { AutoComplete } from 'primereact/autocomplete'
import { Calendar } from 'primereact/calendar'

import dataProvider from '../../../service/DataProvider';
import { fetchJson } from  '../../../service/fetch'


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
    
    const [viewerFilter, setViewerFilter] = useState(null);
    const [selected_viewer, set_selected_viewer] = useState(null);
    const [viewers_list, set_viewers_list] = useState(null);

    const [timerange, changeTimeRange] = useState("100")

    const [dates_str, changeDates_str] = useState()
    const [data_values, changeData_values] = useState()

    const [input_dates_str, set_input_dates_str] = useState()
    const [input_data_values, set_input_data_values] = useState()

    const [customRange, setCustomRange] = useState(null)

    const [loading_data_chart, set_loading_data_chart] = useState(false)


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
        //if (op_type === 'VM' && selected_viewer) {
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
                // label: 'Nº de Visitas',
                data: data_values,
                fill: false,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgba(255, 99, 132, 0.8)',
                tension: 0.25
                // yAxisID: 'y-axis-1'
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


    const legend = {
        display: true,
        position: "top",
        labels: {
            fontColor: "#323130",
            fontSize: 14
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

    const searchViewer = (event) => {
        const params = { filter: {'name': event.query.trim()} };

        const provider = dataProvider(API_URL + '/portal');        
        provider.getSimpleList('/viewers/list', params).then(d => {
            set_viewers_list(d.data.map(d=>{return {value: d.id, name: d.name}}));
          }).catch(e => {
            console.log('searchViewers: fetch error.');
          });
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

    const [city, setCity] = useState(null);

    const citySelectItems = [
        {label: 'New York', value: 'NY'},
        {label: 'Rome', value: 'RM'},
        {label: 'London', value: 'LDN'},
        {label: 'Istanbul', value: 'IST'},
        {label: 'Paris', value: 'PRS'}
    ];


    return (
        <div className="card">
            <div className="grid">
                <div className="col-12 md:col-6">
                    <Dropdown className="w-full" value={op_type} options={types} onChange={(e) => changeOpType(e.value)} />

                    { !props?.stats?.viewers?.length > 0 &&
                        <div className="col-12 pl-0 pr-0">
                            <AutoComplete
                                delay={500}
                                value={selected_viewer ? [selected_viewer] : null}
                                suggestions={viewers_list}
                                field="name"
                                multiple
                                forceSelection
                                completeMethod={searchViewer} 
                                onSelect={(e) => set_selected_viewer(e.value)}
                                onUnselect={(e) => set_selected_viewer(null)} />
                        </div>
                    }
                </div>
                <div className="col-12 md:col-6">
                    { props?.stats?.viewers?.length > 0 &&
                        <Dropdown
                            className="w-full"
                            value={selected_viewer?.value}
                            options={props?.stats?.viewers}
                            placeholder="Escolha um Visualizador"
                            filter={(props?.stats?.viewers || []).length > 25}
                            showClear
                            onChange={(e) => {
                                let new_val = null;
                                if (props?.stats?.viewers?.length) {
                                    new_val = props?.stats?.viewers.find(d => d.value === e.value);
                                }
                                set_selected_viewer(new_val)
                            }}
                            onUnselect={(e) => set_selected_viewer(null)} />
                    }
                </div>
                <div className="col-12 md:col-6">
                    <Dropdown className="w-full" value={timerange} options={timeranges} onChange={(e) => changeTimeRangeAction(e.value)} />

                    { timerange === 'custom' &&
                    <div className="grid mt-1">
                        <div className="col">
                            <Calendar
                                className="w-full"
                                dateFormat="dd/mm/yy" mask="99/99/9999" placeholder="dd/mm/aaaa"
                                value={customRange?.length ? customRange[0] : null}
                                onChange={(e) => changeCustomRange(0, e.value)} />
                        </div>
                        <div className="align-content-center text-center">e</div>
                        <div className="col">
                            <Calendar
                                className="w-full"
                                dateFormat="dd/mm/yy" mask="99/99/9999" placeholder="dd/mm/aaaa"
                                value={customRange?.length ? customRange[1] : null}
                                onChange={(e) => changeCustomRange(1, e.value)} />
                        </div>
                    </div>
                    }
                </div>
                { loading_data_chart && 
                <div className="col-12 md:col-6 text-right">
                    <ProgressSpinner style={{ width: '25px', height: '30px' }} />
                </div>
                }

                <div className="col-12 text-right">
                    <Button label="Exportar CSV" 
                        className="p-button-outlined"
                        icon="pi pi-download"
                        onClick={exportCSV}
                        disabled={!data_values?.length} />
                </div>


                <Line data={data} options={options} />
            </div>
        </div>
    )
}