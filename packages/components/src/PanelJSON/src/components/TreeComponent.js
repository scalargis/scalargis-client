import { Tree } from 'primereact/tree';

import RenderComponent from './RenderComponent';

export const TreeComponent = (props) => {

  /*
  Data example
  [
      {
          key: "0",
          label: 'Installation',
          children: [
              { key: "0-0", label: 'Getting Started', url: 'https://reactjs.org/docs/getting-started.html' },
              { key: "0-1", label: 'Add React', url: 'https://reactjs.org/docs/add-react-to-a-website.html' },
              { key: "0-2", label: 'Create an App', url: 'https://reactjs.org/docs/create-a-new-react-app.html' },
              { key: "0-3", label: 'CDN Links', url: 'https://reactjs.org/docs/cdn-links.html' }
          ]
      },
      {
          key: "1",
          label: 'Main Concepts',
          children: [
              { key: "1-0", label: 'Hello World', url: 'https://reactjs.org/docs/hello-world.html' },
              { key: "1-1", label: 'Introducing JSX', url: 'https://reactjs.org/docs/introducing-jsx.html' },
              { key: "1-2", label: 'Rendering Elements', url: 'https://reactjs.org/docs/rendering-elements.html' },
              { key: "1-3", label: 'Components and Props', url: 'https://reactjs.org/docs/components-and-props.html' },
              { key: "1-4", label: 'State and LifeCycle', url: 'https://reactjs.org/docs/state-and-lifecycle.html' },
              { key: "1-5", label: 'Handling Events', url: 'https://reactjs.org/docs/handling-events.html' }
          ]
      }
  ];
  */

  const nodeTemplate = (node, options) => {
      let label = <b>{node.label}</b>;

      if (node?.content?.length > 0) {
        return (
            <div>
                 {node.content.map(config => RenderComponent(config))}
            </div>
        );
      }

      if (node.url) {
        console.log(node);
        console.log(options);
        label = <a href={node.url} {...node.props}>{node.label}</a>;
      }

      return (
          <span className={`${options.className || ''} ${node.className || ''}`} style={{...options.style, ...node.style}}>
              {label}
          </span>
      )
  }

  return (
      <Tree value={props.value} nodeTemplate={nodeTemplate} />
  )
}

export default TreeComponent;