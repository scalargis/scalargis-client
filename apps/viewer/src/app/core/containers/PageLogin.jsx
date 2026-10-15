import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Anchor } from '@mantine/core';

import { i18n as i18nUtils, LoginWidget, RegistrationWidget, ResetPasswordWidget } from '@scalargis/components';

import LocaleSelector from './../components/LocaleSelector';


function PageLogin(props) {

    const { auth, core, dispatch } = props;
    const { actions, utils, siteConfig } = core;

    // This page renders through i18nUtils.translateValue(), a plain function
    // that never subscribes to i18next, so a locale switch from the
    // LocaleSelector changed the language but left the page frozen. Subscribing
    // to 'languageChanged' here repaints the whole tree (and its widgets) on
    // switch; the return value is intentionally unused.
    useTranslation();

    // Redux actions
    const { login_post, login_user_registration, login_reset_password, login_clear_error, logout } = actions;

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

    // The full-page container drives the pure widgets' link visibility from
    // siteConfig (the dialog surface reads record.config_json instead).
    const showRegistration = siteConfig?.authentication?.user_registration === true;
    const showResetPassword = siteConfig?.authentication?.reset_password === true || (siteConfig?.authentication?.reset_password_login_error && auth.response && !!auth.response && !!auth.response.message);

    let CompLoginWidget = LoginWidget;
    let CompRegistrationWidget = RegistrationWidget;
    let CompResetPasswordWidget = ResetPasswordWidget;

    if (siteConfig?.authentication?.widgets?.login) {
        CompLoginWidget = core.getComponentWidget(siteConfig?.authentication?.widgets?.login) || CompLoginWidget
    }
    if (siteConfig?.authentication?.widgets?.registration) {
        CompRegistrationWidget = core.getComponentWidget(siteConfig?.authentication?.widgets?.registration) || CompRegistrationWidget
    }
    if (siteConfig?.authentication?.widgets?.password) {
        CompResetPasswordWidget = core.getComponentWidget(siteConfig?.authentication?.widgets?.password) || CompResetPasswordWidget
    }

    if (auth?.data?.token) {
        const { username } = auth.data;
        return (
            <div className="flex justify-content-center align-self-center p-6 sm:p-8">
                <div className="flex align-items-center justify-content-center lg:w-4 md:w-6 w-12">
                    <div className="surface-card p-4 pt-6 shadow-2 border-round w-full">
                        <div className="flex justify-content-end">
                            <LocaleSelector core={core} componentConfig={siteConfig} className="popup-locale-selector" />
                        </div>
                        <div className="text-center mb-3">
                            <img src={logo} alt="logo" className="mb-3" style={{maxHeight: "180px", maxWidth: "-webkit-fill-available"}} />
                        </div>
                        <div>
                            <p>{i18nUtils.translateValue("hello_user", "Olá {{username}}", undefined, undefined, undefined, {username})}.</p>
                            <p>
                            {i18nUtils.translateValue("clickTo", "Clique para")}{' '}
                            <Anchor component="button" type="button" onClick={e => dispatch(logout())}>
                                {i18nUtils.translateValue("endSession", "Terminar sessão")}
                            </Anchor>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="flex justify-content-center align-self-center p-6 sm:p-8">
            <div className="flex align-items-center justify-content-center lg:w-4 md:w-6 w-12">
                <div className="surface-card p-4 pt-6 shadow-2 border-round w-full">
                    <div className="flex justify-content-end">
                        <LocaleSelector core={core} componentConfig={siteConfig} className="popup-locale-selector" />
                    </div>
                    <div className="text-center mb-3">
                        <img src={logo} alt="logo" className="mb-3" style={{maxHeight: "180px", maxWidth: "-webkit-fill-available"}} />
                    </div>
                    { mode === 1 ?
                        <React.Fragment>
                            <div className="text-center mb-3">
                                <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("welcome", "Bem-vindo")}</div>
                            </div>
                            <CompLoginWidget
                                auth={auth}
                                history={history}
                                core={core}
                                dispatch={dispatch}
                                actions={actions}
                                redirect={redirect}
                                layout="page"
                                showRegistration={showRegistration}
                                showResetPassword={showResetPassword}
                                onClearError={() => dispatch(login_clear_error())}
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
                            <div className="text-center mb-3">
                                <span className="text-600 text-2xl font-medium line-height-3">{i18nUtils.translateValue("passwordReset", "Recuperar password")}</span>
                            </div>
                            <CompResetPasswordWidget
                                auth={auth}
                                core={core}
                                dispatch={dispatch}
                                actions={actions}
                                layout="page"
                                onClearError={() => dispatch(login_clear_error())}
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
                            <div className="text-center mb-3">
                                <span className="text-600 text-2xl font-medium line-height-3">{i18nUtils.translateValue("createUser", "Criar utilizador")}</span>
                            </div>
                            <CompRegistrationWidget
                                auth={auth}
                                history={history}
                                core={core}
                                dispatch={dispatch}
                                actions={actions}
                                redirect={redirect}
                                layout="page"
                                apiUrl={core?.API_URL}
                                termsOfServiceUrl={siteConfig?.terms_of_service_url}
                                onClearError={() => dispatch(login_clear_error())}
                                onRegistration={(data) => {
                                    const payload = {
                                        ...data,
                                        redirect
                                    }
                                    const apiUrl = siteConfig?.authentication?.endpoints?.registration;
                                    dispatch(login_user_registration(core, payload, apiUrl, redirect));
                                }}
                                onResendConfirmation={siteConfig?.authentication?.endpoints?.registration ? undefined :
                                    (email) => actions.resend_confirmation(email, redirect)}
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