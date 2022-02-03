import React, { useEffect, useState, useRef } from 'react'

import { Line } from 'react-chartjs-2'

import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner'

import { defaults } from 'react-chartjs-2'
defaults.animation = false

export default function BasicStats(props) {

    const API_URL = process.env.REACT_APP_API_URL;

    const [basicstats, set_basicstats] = useState({})

    useEffect(() => {
        // set_loading_data_chart(true)

        const url = API_URL + '/api/v2/portal/stats/basicstats'

        fetch(url).then(res => {
            return res.json();
        }).then(result => {
            // set_loading_data_chart(false)
            console.log(result)
            set_basicstats(result)

        })
            .catch(error => {
                console.log("fetch error")
                // set_loading_data_chart(false)
            })
    }, [])


    return (
        <React.Fragment>
            <div className="p-col-12 p-lg-3">
                <div className="card summary">
                    <span className="title">Utilizadores</span>
                    <span className="detail">Utilizadores registados</span>
                    <span className="count blue">{basicstats?.nb_users}</span>
                </div>
            </div>
            <div className="p-col-12 p-lg-3">
                <div className="card summary">
                    <span className="title">Grupos</span>
                    <span className="detail">Grupos de utilizadores</span>
                    <span className="count blue">{basicstats?.nb_groups}</span>
                </div>
            </div>
            <div className="p-col-12 p-lg-3">
                <div className="card summary">
                    <span className="title">Visualizadores</span>
                    <span className="detail">Incluindo mapas partilhados</span>
                    <span className="count orange">{basicstats?.nb_viewers}</span>
                </div>
            </div>
            <div className="p-col-12 p-lg-3">
                <div className="card summary">
                    <span className="title">Operações</span>
                    <span className="detail">Visitas, plantas, etc...</span>
                    <span className="count red">{basicstats?.nb_ops}</span>
                </div>
            </div>
        </React.Fragment>


    )
}