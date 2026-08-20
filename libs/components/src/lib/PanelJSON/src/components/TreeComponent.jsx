import React, { useMemo } from "react";
import { Button, Group } from '@mantine/core';
import { TreeView, useTree, getTreeExpandedState, IconPlus, IconMinus } from '@scalargis/ui';

import RenderComponent from './RenderComponent';

/*
Data example
[
    {
        key: "0",
        label: 'Installation',
        children: [
            { key: "0-0", label: 'Getting Started', url: 'https://reactjs.org/docs/getting-started.html' },
            { key: "0-1", label: 'Add React', url: 'https://reactjs.org/docs/add-react-to-a-website.html' }
        ]
    }
];
*/

// Prime nodeTemplate parity: embedded content wins, then a link when the node
// has a url, then the bold label; node className/style ride the wrapper.
function renderNodeLabel(node) {
    if (node?.content?.length > 0) {
        return (
            <div>
                {node.content.map((config, i) => (
                    <React.Fragment key={i}>{RenderComponent(config)}</React.Fragment>
                ))}
            </div>
        );
    }

    let label = <b>{node.label}</b>;

    if (node.url) {
        label = <a href={node.url} {...node.props}>{node.label}</a>;
    }

    return (
        <span className={node.className || undefined} style={node.style}>
            {label}
        </span>
    );
}

function toTreeData(nodes) {
    return (nodes || []).map((node) => ({
        value: String(node.key),
        label: renderNodeLabel(node),
        children: node.children?.length ? toTreeData(node.children) : undefined,
    }));
}

export const TreeComponent = (props) => {

    // toTreeData mints fresh JSX labels on every call, so a new identity each
    // render fed Mantine's Tree, whose useEffect(initialize, [data]) fires
    // setState -> render -> new array -> infinite loop. Key the memo on the raw
    // value (the JSX labels are circular; no deep compare would survive them).
    const data = useMemo(() => toTreeData(props?.value), [props?.value]);

    const tree = useTree({
        initialExpandedState: getTreeExpandedState(
            data,
            props?.options?.expandAll
                ? '*'
                : (props?.options?.expandedKeys || []).map((k) => String(k))
        ),
    });

    return (
        <div>
            {props?.options?.showExpandButtons && <Group justify="center" gap="xs" mb="md">
                <Button type="button" size="xs" variant="outline"
                    leftSection={<IconPlus />}
                    onClick={() => tree.expandAllNodes()}>
                    Abrir todos
                </Button>
                <Button type="button" size="xs" variant="outline"
                    leftSection={<IconMinus />}
                    onClick={() => tree.collapseAllNodes()}>
                    Fechar todos
                </Button>
            </Group>}
            <TreeView
                data={data}
                tree={tree}
                bordered={false}
                expandOnClick={false}
            />
        </div>
    )
}

export default TreeComponent;
