import React, { useContext, useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import Cookies from 'universal-cookie';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import AppContext from '../../AppContext';
import { classNames } from 'primereact/utils';

const cookies = new Cookies();

function PasswordWidget({ token, auth, pwd, history, redirect, urlRedirect }) {

  const [mode, setMode] = useState('set');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [goRedirect, setGoRedirect] = useState(false);

  // Enable redux actions
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { login_reset_password, password_reset_validation, password_post, login_post, logout } = core.actions;

  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);

  const defaultValues = {
    newPassword: '',
    confirmPassword: ''
  }

  const passwordStrengthLabels = {
    weakLabel: 'Fraca',
    mediumLabel: 'Média',
    strongLabel: 'Forte'
  }
  
  useEffect(() => {
    if (cookieData)  return;
    
    dispatch(password_reset_validation({ token }, history, redirect));
  }, []);

  useEffect(() => {
    if (auth.response && auth.response.valid_token === false) {
      setMode('reset');
    }
  }, [auth]);

  const { control, formState: { errors }, getValues, handleSubmit } = useForm({ defaultValues });
  

  const getFormValidationErrorMessage = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].type === 'required') {
        return <small className="p-error">{errors[name].message || 'Campo obrigatório'}</small>
      } else if (errors[name].type === 'maxLength') {
         return <small className="p-error">{errors[name].message || 'O número de caracteres é superior à dimensão máxima permitida'}</small>
      } else if (errors[name].type === 'pattern') {
        return <small className="p-error">{errors[name].message || 'Formato inválido'}</small>
      } else {
        return <small className="p-error">{errors[name].message}</small>
      }
    }      
  };

  const passwordFooter = (
      <React.Fragment>
          <Divider className="mt-2" />
          <p className="mt-2">Sugestões:</p>
          <ul className="pl-2 ml-2 mt-0" style={{ lineHeight: '1.5' }}>
              <li>Pelo menos uma minúscula</li>
              <li>Pelo menos uma maiúscula</li>
              <li>Pelo menos um dígito</li>
              <li>Pelo menos 8 caracteres</li>
          </ul>
      </React.Fragment>
  );

  // Render user
  if (cookieData) {
    const { username } = cookieData;
    return (
      <div>
        <p>Existe uma sessão ativa para o utilizador <i><strong>{ username }</strong></i>.</p>
        <p>
          Clique para 
          <Button
            className="p-button-link"
            label="terminar sessão"
            onClick={e => dispatch(logout())}
          />e fazer a alteração da palavra-passe.
        </p>
      </div>
    )
  }

  const onSubmit = (data) => {
    setPassword(data.newPassword);
    dispatch(password_post({ token, password: data.newPassword }, history, redirect))
  }

  if (pwd.response && !!pwd.response && !!pwd.response.authenticated) {
    const username = pwd.response.username;
    return (
      <div className="flex align-items-center p-dir-col p-px-3">
        <h3>Definição de Palavra-passe</h3>
        <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--green-500)' }}></i>        
        <p style={{ lineHeight: 1.5 }}>A Palavra-passe foi alterada com sucesso!</p>
        <Button label="Continuar" 
          onClick={ e => {
            setGoRedirect(true); 
            dispatch(login_post({ username, password }, history, redirect, urlRedirect));
          }}
          icon={ goRedirect ? "pi pi-spin pi-spinner": "pi pi-check" }
          disabled={goRedirect} />
      </div>
    )
  }

  if (mode === 'reset') {
    if (auth?.response?.reset_password) {
      return (
        <React.Fragment>
          <div className="p-fluid">

            <div className="field grid">
              <div className="col-12">
                <h3>Alteração de Palavra-passe</h3>
              </div>
            </div>

            <div className="p-fluid field grid">
              <div className="col-12 ">
              <Message severity="info" text={auth.response.message}></Message> 
              </div>
            </div>

            <div className="field grid">
              <div className="col-12">
                <Button
                  className="p-button-link"
                  label = "Login"
                  onClick={() => {
                    history.push('login?redirect=' + (redirect|| '/'));
                  }}
                />
              </div>
            </div>          
          </div>

          <div className="p-dialog-myfooter"></div>
        </React.Fragment>
      )
    } else {
      return (
        <React.Fragment>
          <div className="p-fluid">

            <div className="field grid">
              <div className="col-12">
                <h3>Alteração de Palavra-passe</h3>
                <p>Indique o seu <i>username</i> ou <i>email</i> para receber um email com instruções para alterar a palavra-passe.</p>
              </div>
            </div>

            <div className="field grid">
              <label className="col-12 md:col-4">Nome de Utilizador / E-mail</label>
              <div className="col-12 md:col-8">
                <InputText
                  value={username}
                  placeholder="Nome de Utilizador"
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-dialog-myfooter">
            <Button 
              color='green'
              icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
              label={"Enviar" }
              onClick={(e)=> { e.preventDefault(); dispatch(login_reset_password({ username }, history, redirect));}}
              disabled={auth.loading}
            />
          </div>

          { auth.response && !!auth.response && !!auth.response.message && 
            <div className="p-fluid">
              <Message severity={auth.http_error ? "error" : "info"} text={auth?.response?.message}></Message>
            </div>
          }

        </React.Fragment>   
      )
    }
  }

  if (mode === 'set') {
    return (        
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="new-password">
        <div className="p-fluid">       

          <div className="field grid">
            <div className="col-12">
              <h3>Definição de Password</h3>
              <p>Por favor, defina e confirme a sua nova palavra-passe</p>
            </div>
          </div>

          <div className="field grid">
            <label htmlFor="newPassword" className={classNames({ 'col-12 md:col-4': true,'p-error': errors.newPassword })}>Palavra-passe*</label>
            <div className="col-12 md:col-8">
              <Controller name="newPassword" control={control} rules={{ required: 'Preenchimento obrigatório.' }} render={({ field, fieldState }) => (
                <Password id={field.name} {...field} 
                  toggleMask
                  promptLabel="Introduza a palavra-passe"
                  {...passwordStrengthLabels}
                  className={classNames({ 'p-invalid': fieldState.invalid })} 
                  footer={passwordFooter}
                  autoComplete="off"
                  aria-autocomplete="none" />
              )} />
              {getFormValidationErrorMessage(errors, 'newPassword')}            
            </div>
          </div>

          <div className="field grid">
            <label htmlFor="confirmPassword" className={classNames({ 'col-12 md:col-4': true,'p-error': errors.confirmPassword })}>Confirmar Palavra-passe*</label>
            <div className="col-12 md:col-8">
              <Controller name="confirmPassword" control={control} rules={{ required: 'Preenchimento obrigatório.', validate: ()=>{ if (getValues('newPassword') !== getValues('confirmPassword')) return "As passwords não são iguais." } }} render={({ field, fieldState }) => (
                <Password id={field.name} {...field} 
                  toggleMask 
                  feedback={false} 
                  className={classNames({ 'p-invalid': fieldState.invalid })}
                  autoComplete="off"
                  aria-autocomplete="none" />
              )} />
              {getFormValidationErrorMessage(errors, 'confirmPassword')}            
            </div>
          </div>      

        </div>

        <div className="p-dialog-myfooter">
          <Button 
            color='green'
            icon={ pwd.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
            label="Aceitar" 
            type="submit"
            disabled={pwd.loading}
          />
        </div>
        
        { pwd.http_error && !pwd.response &&
          <div className="p-fluid">
            <Message severity="error" text="Serviço Indisponível"></Message>
          </div>
        }

        { pwd.response && !!pwd.response && !pwd.authenticated && !!pwd.response.message &&
          <div className="p-fluid"> 
            <Message severity="error" text="Dados inválidos"></Message>
          </div>
        }

      </form>
    )
  }
}

export default connect(state => ({ auth: state.root.auth, pwd: state.root.password }))(PasswordWidget)