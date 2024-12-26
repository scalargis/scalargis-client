import { useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

import LoginWidget from './../components/LoginWidget';
import ResetPasswordWidget from './../components/ResetPasswordWidget';
import RegistrationWidget from './../components/RegistrationWidget';


function PageLogin(props) {

    const { auth, core, dispatch } = props;
    const { actions, siteConfig } = core;

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

    // User Login
    if (mode === 1) {
        return (
            <div className="flex justify-content-center align-self-center p-6 sm:p-8">
                <LoginWidget 
                    core={core}
                    dispatch={dispatch}
                    onLogin={(data) => {
                        //TODO
                        if (siteConfig?.authentication?.actions?.login2) {
                            core.pubsub.publish(siteConfig.authentication.actions.login, null);
                            return;
                        }
                        const apiUrl = siteConfig?.authentication?.endpoints?.login;
                        dispatch(login_post(core, { username: data.username, password: data.password }, apiUrl, history, redirect));
                    }}
                    onShowRegistration={() => setMode(3)}
                    onShowResetPassword={() => setMode(2)}
                />
            </div>
        )
    }

    // Reset Password
    if (mode === 2) {
        return (
            <div class="flex justify-content-center align-self-center p-6 sm:p-8">
                <ResetPasswordWidget
                    core={core}
                    dispatch={dispatch}
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
            </div>
        )
    }

    // Create User
    if (mode === 3) {
        return (
            <div class="flex justify-content-center align-self-center p-6 sm:p-8">
                <RegistrationWidget
                    core={core}
                    dispatch={dispatch}
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

            </div>
        )
    }
}

export default connect(state => ({ auth: state.root.auth }))(PageLogin);