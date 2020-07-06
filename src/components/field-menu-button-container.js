import { connect } from "react-redux";
import FieldMenuButton from "./field-menu-button";

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
