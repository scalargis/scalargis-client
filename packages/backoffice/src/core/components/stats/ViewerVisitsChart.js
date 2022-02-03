import React, { useEffect, useState, useRef } from 'react'

import { fetchJson } from  '../../../service/fetch'

import { Line } from 'react-chartjs-2'

import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner'

import { defaults } from 'react-chartjs-2'
defaults.animation = false

export default function ViewerVisitsChart(props) {

    const API_URL = process.env.REACT_APP_API_URL;

    const [types, setTypes] = useState([
        { label: 'Visualização de mapas', value: 'VM' },
        { label: 'Emissão de plantas', value: 'EP' }
    ]);

    const [timeranges, setTimeranges] = useState([
        { label: 'Desde sempre', value: 'all' },
        { label: 'Últimos 7 dias', value: '7' },
        { label: 'Últimos 30 dias', value: '30' },
        { label: 'Últimos 100 dias', value: '100' },
        { label: 'Último ano', value: '365' }
    ]);

    const [op_type, set_op_type] = useState("VM")

    const [timerange, changeTimeRange] = useState("100")

    const [dates_str, changeDates_str] = useState()
    const [data_values, changeData_values] = useState()

    const [input_dates_str, set_input_dates_str] = useState()
    const [input_data_values, set_input_data_values] = useState()

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

        const url = API_URL + '/api/v2/portal/stats/viewer_visits?type_code=' + op_type;

        const httpClient = fetchJson;

        httpClient(url).then(({ headers, json }) => json)
        .then (result => {
            set_loading_data_chart(false)

            if (result.values) {
                const input_d = result.values.map(e => e.date)
                const input_v = result.values.map(e => e.count)

                set_input_dates_str(input_d)
                set_input_data_values(input_v)


                let pos = input_d.length - 1 - parseInt(timerange)
                if (pos < 0) pos = 0
                if (timerange === 'all') {
                    changeDates_str(input_d)
                    changeData_values(input_v)
                    return
                }
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
    }, [op_type])



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


    function changeTimeRangeAction(value) {

        changeTimeRange(value)

        if (value === 'all') {
            changeDates_str(input_dates_str)
            changeData_values(input_data_values)
            return
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


    return (
        <div className="card">
            <div className="p-grid p-fluid">
                <div className="p-col-12 p-lg-5">
                    <Dropdown value={op_type} options={types} onChange={(e) => changeOpType(e.value)} />
                </div>

                <div className="p-col-12 p-lg-5">
                    <Dropdown value={timerange} options={timeranges} onChange={(e) => changeTimeRangeAction(e.value)} />
                </div>

                <div className="p-col-12 p-lg-2">
                    {loading_data_chart ? <ProgressSpinner style={{ width: '25px', height: '30px' }} /> : null}
                </div>

                <Line data={data} options={options} />
            </div>
        </div>
    )
}