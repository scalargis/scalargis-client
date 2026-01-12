import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

import { i18n as i18nUtils } from '@scalargis/components';

import LoginWidget from './../components/LoginWidget';
import ResetPasswordWidget from './../components/ResetPasswordWidget';
import RegistrationWidget from './../components/RegistrationWidget';


function PageLogin(props) {

    const { auth, core, dispatch } = props;
    const { actions, utils, siteConfig } = core;

    // Redux actions
    const { login_post, login_user_registration, login_reset_password } = actions;

    // Routing
    const location = useLocation();
    const navigate = useNavigate();

    const history = {
        location,
        navigate
    }

    const { search } = location;

    const params = new URLSearchParams(search)
    const redirect = params.get('redirect') || "/";

    const [mode, setMode] = useState(1);

    const logo = utils.buildRelativeUrlPath(siteConfig?.logo || 'assets/images/logo.png');

    let CompLoginWidget = LoginWidget;
    let CompRegistrationWidget = RegistrationWidget;
    let CompResetPasswordWidget = ResetPasswordWidget;

    if (siteConfig?.authentication?.widgets?.login) {
        CompLoginWidget = core.getComponentWidget(siteConfig?.authentication?.widgets?.login)
    }
    if (siteConfig?.authentication?.widgets?.registration) { 
        CompRegistrationWidget = core.getComponentWidget(siteConfig?.authentication?.widgets?.registration)
    }
    if (siteConfig?.authentication?.widgets?.password) { 
        CompResetPasswordWidget = core.getComponentWidget(siteConfig?.authentication?.widgets?.password)
    }
    
    return (
        <div className="flex justify-content-center align-self-center p-6 sm:p-8">
            <div className="flex align-items-center justify-content-center lg:w-4 md:w-6 w-12">
                <div className="surface-card p-4 pt-6 shadow-2 border-round w-full">
                    <div className="text-center mb-3">
                        <img src={logo} alt="logo" className="mb-3" style={{maxHeight: "180px", maxWidth: "-webkit-fill-available"}} />
                    </div>
                    { mode === 1 ?
                        <React.Fragment>
                            <div className="text-center mb-5">
                                <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("welcome", "Bem-vindo")}</div>
                            </div>
                            <CompLoginWidget
                                auth={auth}
                                history={history}
                                core={core}
                                dispatch={dispatch}
                                actions={actions}
                                redirect={redirect}
                                onLogin={(data) => {
                                    //TODO
                                    if (siteConfig?.authentication?.actions?.login) {
                                        core.pubsub.publish(siteConfig.authentication.actions.login, null);
                                        return;
                                    }
                                    const apiUrl = siteConfig?.authentication?.endpoints?.login;
                                    dispatch(login_post(core, { username: data.username, password: data.password }, apiUrl, history, redirect));
                                }}
                                onShowRegistration={() => setMode(3)}
                                onShowResetPassword={() => setMode(2)}
                            />
                        </React.Fragment>
                    : mode === 2 ?
                        <React.Fragment>
                            <div className="text-center mb-5">
                                <span className="text-600 text-2xl font-medium line-height-3">{i18nUtils.translateValue("passwordReset", "Recuperar password")}</span>
                            </div>
                            <CompResetPasswordWidget
                                auth={auth}
                                core={core}
                                dispatch={dispatch}
                                actions={actions}
                                onResetPassword={(data) => {
                                    //TODO
                                    /*
                                    if (siteConfig?.authentication?.actions?.reset_password) {
                                        core.pubsub.publish(siteConfig?.authentication?.actions?.reset_password, {post: { username: data.username, redirect }, history, redirect});
                                        return;
                                    }
                                    */
                                    dispatch(login_reset_password({ username: data.username, redirect }, history, redirect));
                                }}
                                onShowLogin={()=> setMode(1)}
                            />
                        </React.Fragment>
                    : mode === 3 ?
                        <React.Fragment>
                            <div className="text-center mb-5">
                                <span className="text-600 text-2xl font-medium line-height-3">{i18nUtils.translateValue("createUser", "Criar utilizador")}</span>
                            </div>
                            <CompRegistrationWidget
                                auth={auth}
                                core={core}
                                dispatch={dispatch}
                                actions={actions}
                                onRegistration={(data) => {
                                    const payload = {
                                        ...data,
                                        redirect
                                    }
                                    const apiUrl = siteConfig?.authentication?.endpoints?.registration;
                                    dispatch(login_user_registration(core, payload, apiUrl, redirect));
                                }}
                                onShowLogin={() => setMode(1)}
                            />
                        </React.Fragment>
                    : null }
                </div>
            </div>
        </div>
    )
}

export default connect(state => ({ auth: state.root.auth }))(PageLogin);