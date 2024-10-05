import React from 'react'
import Viewer from './Viewer'
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import HomePage from '../components/HomePage'
import Page404 from '../components/Page404'
import Page401 from '../components/Page401'
import PageLogin from '../components/PageLogin'
import PageRegistrationConfirmation from '../components/PageRegistrationConfirmation'
import PagePassword from '../components/PagePassword'

const Routes = ({core, pages}) => {

    return (
        <Switch>
            <Route path="/login" children={<PageLogin />} />
            <Route path="/registration" children={<PageRegistrationConfirmation />} />
            <Route path="/password" children={<PagePassword/>} />
            <Route path="/not-found" children={<Page404 />} />
            <Route path="/not-allowed" children={<Page401 />} />
            <Route path="/mapa/session/:id?" children={<Viewer />} />
            <Route path="/map/session/:id?" children={<Viewer />} />
            <Route path="/mapa/:id?" children={<Viewer />} />
            <Route path="/map/:id?" children={<Viewer />} />

            <Route path="/mapas/:id?" children={<Viewer />} />
            
            {pages.map((p, i) => {
            const CustomPage = p.children;
            return (
                <Route key={i} path={p.path} render={(props) => {
                return (
                    <CustomPage
                    core={core}
                    action={props.match.params.action} />
                )
                }} />
            )
            })}

            <Route path="/:id" children={<Viewer />} />

            {/*
            <Route path="/:id" render={(props) => {
                console.log(props);
                return <Redirect to={`/map/${props.match.params.id || ''}${props.location.search || ''}`} />
            }} />
            */}
            {/*
            <Route path="/" children={<HomePage />} />
            */}

            <Route path="/" render={(props) => {
            if (core?.siteConfig?.home) {
                return <Redirect to={`${core.siteConfig.home}${props.location.search || ''}${props.location.hash || ''}`} />
            }
            return <Redirect to={`/map/${props.location.search || ''}${props.location.hash || ''}`} />
            }} />

        </Switch>
    )
}

export default Routes;