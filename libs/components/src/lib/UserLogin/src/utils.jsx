export const getFormValidationErrorMessage = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].type === 'required') {
        return <small className="sg-error">{errors[name].message || 'Campo obrigatório'}</small>
      } else if (errors[name].type === 'maxLength') {
         return <small className="sg-error">{errors[name].message || 'O número de caracteres é superior à dimensão máxima permitida'}</small>
      } else if (errors[name].type === 'pattern') {
        return <small className="sg-error">{errors[name].message || 'Formato inválido'}</small>
      } else {
        return <small className="sg-error">{errors[name].message}</small>
      }
    }
  };