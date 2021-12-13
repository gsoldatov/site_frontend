import React from 'react';
import ReactDOM from 'react-dom';
import { WrappedApp }from "./components/top-level/app";
import StyleRoot from "./styles/root.css"

// TODO get preferred locale and set it for moment before rendering the app
// import moment from "moment";
// import "moment/locale/ru";
// moment.updateLocale("ru");

ReactDOM.render(<WrappedApp />, document.getElementById("root"));
