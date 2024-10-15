import React, { useEffect, useState } from 'react'
//import { defaults } from 'react-chartjs-2'
import { defaults } from 'chart.js'

defaults.animation = false

export default function BasicStats(props) {

    const { core } = props;

    const API_URL = core.API_URL;

    const [basicstats, set_basicstats] = useState({})

    useEffect(() => {
        const url = API_URL + '/portal/stats/basicstats'

        fetch(url).then(res => {
            return res.json();
        }).then(result => {
            console.log(result)
            set_basicstats(result)

        })
            .catch(error => {
                console.log("fetch error")
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