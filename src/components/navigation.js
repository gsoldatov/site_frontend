import React from "react";
import { NavLink } from "react-router-dom";

class Navigation extends React.Component {
    render() {
        return (
            <nav>
                <ul className="nav-ul" >
                    <li className="nav-li">
                        <NavLink exact to="/" className="nav-link" activeClassName="active-nav-link">
                            Index
                        </NavLink>
                    </li>
                    <li className="nav-li">
                        <NavLink exact to="/objects" className="nav-link" activeClassName="active-nav-link">
                            Objects
                        </NavLink>
                    </li>
                    <li className="nav-li">
                        <NavLink exact to="/tags" className="nav-link" activeClassName="active-nav-link">
                            Tags
                        </NavLink>
                    </li>
                </ul>
                
                
                
            </nav>
        );
    }
}

export default Navigation;