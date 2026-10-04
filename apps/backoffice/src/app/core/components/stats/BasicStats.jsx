import React, { useEffect, useState } from 'react';
import { defaults } from 'chart.js';
import { Paper, SimpleGrid } from '@mantine/core';

defaults.animation = false;


export default function BasicStats(props) {

    const { core } = props;

    const API_URL = core.API_URL;

    const [basicstats, set_basicstats] = useState({});

    useEffect(() => {
        const url = API_URL + '/portal/stats/basicstats'

        fetch(url).then(res => {
            return res.json();
        }).then(result => {
            set_basicstats(result)
        }).catch(error => {
            console.log("fetch error")
        })
    }, [])


    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Paper p="md" className="summary">
                <span className="title">Utilizadores</span>
                <span className="detail">Utilizadores registados</span>
                <span className="count blue">{basicstats?.nb_users}</span>
            </Paper>
            <Paper p="md" className="summary">
                <span className="title">Grupos</span>
                <span className="detail">Grupos de utilizadores</span>
                <span className="count blue">{basicstats?.nb_groups}</span>
            </Paper>
            <Paper p="md" className="summary">
                <span className="title">Visualizadores</span>
                <span className="detail">Incluindo mapas partilhados</span>
                <span className="count orange">{basicstats?.nb_viewers}</span>
            </Paper>
            <Paper p="md" className="summary">
                <span className="title">Operações</span>
                <span className="detail">Visitas, plantas, etc...</span>
                <span className="count red">{basicstats?.nb_ops}</span>
            </Paper>
        </SimpleGrid>
    )
}