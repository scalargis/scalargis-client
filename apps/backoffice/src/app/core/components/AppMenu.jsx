import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { Collapse, UnstyledButton } from '@mantine/core';
import classNames from 'classnames';

const AppSubmenu = (props) => {

    const [activeIndex, setActiveIndex] = useState(null)

    const onMenuItemClick = (event, item, index) => {
        //avoid processing disabled items
        if (item.disabled) {
            event.preventDefault();
            return true;
        }

        if (item.link) {
            if (item.target) {
                event.preventDefault();
                window.open(item.link, '_blank');
                return true;
            } else {
                window.location = item.link;
            }
        }

        if (index === activeIndex)
            setActiveIndex(null);
        else
            setActiveIndex(index);

        if (props.onMenuItemClick) {
            props.onMenuItemClick({
                originalEvent: event,
                item: item
            });
        }
    }

    const renderLinkContent = (item) => {
        const submenuIcon = item.items && <i className="pi pi-fw pi-angle-down menuitem-toggle-icon" aria-hidden="true"></i>;
        const badge = item.badge && <span className="menuitem-badge">{item.badge}</span>;

        return (
            <React.Fragment>
                <i className={item.icon} aria-hidden="true"></i>
                <span>{item.label}</span>
                {submenuIcon}
                {badge}
            </React.Fragment>
        );
    }

    const renderLink = (item, i) => {
        const content = renderLinkContent(item);

        if (item.to) {
            return (
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to={item.to} onClick={(e) => onMenuItemClick(e, item, i)} target={item.target}>
                    {content}
                </NavLink>
            )
        }

        if (item.url || item.link) {
            return (
                <a href={item.url} onClick={(e) => onMenuItemClick(e, item, i)} target={item.target}>
                    {content}
                </a>
            );
        }

        // Submenu toggles have no destination: a real button, so keyboard
        // activation and the announced role work (the old href-less <a>
        // was mouse-only and invisible to the tab order).
        return (
            <UnstyledButton onClick={(e) => onMenuItemClick(e, item, i)} aria-expanded={activeIndex === i}>
                {content}
            </UnstyledButton>
        );
    }

    const items = props.items && props.items.map((item, i) => {
        const active = activeIndex === i;
        const styleClass = classNames(item.badgeStyleClass, { 'active-menuitem': active && !item.to });

        return (
            <li className={styleClass} key={i}>
                {item.items && props.root === true && <div className='arrow'></div>}
                {renderLink(item, i)}
                {item.items && (
                    <Collapse in={active}>
                        <AppSubmenu items={item.items} onMenuItemClick={props.onMenuItemClick} />
                    </Collapse>
                )}
            </li>
        );
    });

    return items ? <ul className={props.className}>{items}</ul> : null;
};

export const AppMenu = (props) => {
    return (
        <div className="layout-menu-container">
            <AppSubmenu items={props.model} className="layout-menu" onMenuItemClick={props.onMenuItemClick} root={true} />
        </div>
    );
}
