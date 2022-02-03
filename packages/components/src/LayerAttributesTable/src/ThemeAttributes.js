import React from 'react';

class ThemeAttributes extends React.Component {
  render() {
    const { theme } = this.props;
    return (
      <div>
        <div className="p-grid">
            <div className="p-col-4">Título</div>
            <div className="p-col-8">{theme.title}</div>
        </div>
      </div>
    );
  }
}

export default ThemeAttributes;