import { connect } from "react-redux";
import FieldMenuButton from "./field-menu-button";

/*
    FieldMenuButton wrapper for connecting to the store.

    Props: 
    * getButtonState - function which returns button state ("inactive", "pressed" or "active") based on the state of the app;
    * getOnClickParams - function which gets params to be passed into button on click handler;
    * title - button title to be displayed on hover;
    * src - URL of the button image;
    * onClick - button on click handler function.
*/
const mapStateToProps = (state, ownProps) => {
    return {
        buttonState: ownProps.getButtonState(state),
        onClickParams: typeof(ownProps.getOnClickParams) === "function" ? ownProps.getOnClickParams(state) : undefined,
        title: ownProps.title,
        src: ownProps.src
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onClick: params => dispatch(params instanceof Array ? ownProps.onClick(...params) 
                                    : typeof(params) === "object" ?  ownProps.onClick(params) : ownProps.onClick())
    };
};

const FieldMenuButtonContainer = connect(mapStateToProps, mapDispatchToProps)(FieldMenuButton);

export default FieldMenuButtonContainer;
