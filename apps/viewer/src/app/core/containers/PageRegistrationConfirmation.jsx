import React  from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import RegistrationConfirmationWidget from './../components/RegistrationConfirmationWidget';

function PageRegistrationConfirmation(props) {
  
  const { core } = props;
  const { utils, siteConfig } = core;
  
  // Routing
  const location = useLocation();
  const navigate = useNavigate()

  const history = {
    location,
    navigate
  }

  const { search } = location;
  
  const query = new URLSearchParams(search);
  const token = query.get('token');

  const foundRedirect = /redirect=(.*)/i.exec(search);
  const foundUrlRedirect = /url_redirect=(.*)/i.exec(search);

  const logo = utils.buildRelativeUrlPath(siteConfig?.logo || 'assets/images/logo.png');

  return (
    <div className="flex justify-content-center align-self-center p-6 sm:p-8">
      <div className="flex align-items-center justify-content-center lg:w-4 md:w-6 w-12">
        <div className="surface-card p-4 pt-6 shadow-2 border-round w-full">
          <div className="text-center mb-2">
            <img src={logo} alt="logo" height={50} className="mb-3" />
          </div>
          <RegistrationConfirmationWidget
            core={core}
            token={token}
            history={history}
            redirect={foundRedirect ? foundRedirect[1] : null }
            urlRedirect={foundUrlRedirect ? foundUrlRedirect[1] : null }
          />
        </div>
      </div>
    </div>
  );
}

export default PageRegistrationConfirmation;