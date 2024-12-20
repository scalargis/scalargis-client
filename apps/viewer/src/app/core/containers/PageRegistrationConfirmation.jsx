import React  from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import RegistrationConfirmationWidget from './../components/RegistrationConfirmationWidget';

function PageRegistrationConfirmation(props) {
  
  const { core } = props;
  
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
  
  return (
    <div className="flex justify-content-center align-self-center p-6 sm:p-8">
      <RegistrationConfirmationWidget
        core={core}
        token={token}
        history={history}
        redirect={foundRedirect ? foundRedirect[1] : null }
        urlRedirect={foundUrlRedirect ? foundUrlRedirect[1] : null }
      />
    </div>
  );
}

export default PageRegistrationConfirmation;