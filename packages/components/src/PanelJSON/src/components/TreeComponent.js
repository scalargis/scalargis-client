import React, { useState, useEffect } from "react";
import { Tree } from 'primereact/tree';
import { Button } from 'primereact/button';

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

    const [expandedKeys, setExpandedKeys] = useState({});

    const expandAll = () => {
        let _expandedKeys = {};
        for (let node of props?.value || []) {
            expandNode(node, _expandedKeys);
        }

        setExpandedKeys(_expandedKeys);
    }

    const collapseAll = () => {
        setExpandedKeys({});
    }

    const expandNode = (node, _expandedKeys) => {
        if (node.children && node.children.length) {
            _expandedKeys[node.key] = true;

            for (let child of node.children) {
                expandNode(child, _expandedKeys);
            }
        }
    }    

    useEffect(() => {
        if (!!props?.options?.expandAll) {
            expandAll();
            return;
        }

        if (props?.options?.expandedKeys?.length) {
            const keys = {};
            props.options.expandedKeys.forEach(k => {
                keys[k] = true;
            });
            setExpandedKeys(keys);
        }
    }, []);


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
            label = <a href={node.url} {...node.props}>{node.label}</a>;
        }

        return (
            <span className={`${options.className || ''} ${node.className || ''}`} style={{...options.style, ...node.style}}>
                {label}
            </span>
        )
    }

    return (
        <div>
            {props?.options?.showExpandButtons && <div className="p-mb-3 p-text-center">
                <Button type="button" icon="pi pi-plus" label="Abrir todos" onClick={expandAll} className="p-button-sm p-button-outlined p-mr-2" />
                <Button type="button" icon="pi pi-minus" label="Fechar todos" onClick={collapseAll} className="p-button-sm p-button-outlined p-mr-2" />
            </div>}
            <Tree 
                value={props.value}
                nodeTemplate={nodeTemplate}
                expandedKeys={expandedKeys}
                onToggle={e => setExpandedKeys(e.value)}
            />
        </div>
    )
}

export default TreeComponent;