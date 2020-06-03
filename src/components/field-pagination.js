import React from "react";
import FieldPaginationButton from "./field-pagination-button";
import FieldPaginationDots from "./field-pagination-dots";

// Previous 1 ... i-2 i-1 i i+1 i+2 ... N Next
function onClickTemp(e) {
    console.log(`Button ${e.target.firstChild.textContent} clicked`);
}

class FieldPagination extends React.Component {
    render() {
        
        return (
            <div className="field-pagination">
                <FieldPaginationButton onClick={onClickTemp} text="Previous" 
                    className="field-pagination-button-prev-next" />
                <FieldPaginationButton onClick={onClickTemp} text="1" />
                <FieldPaginationButton onClick={onClickTemp} text="2" />
                <FieldPaginationDots />
                <FieldPaginationButton onClick={onClickTemp} text="i-2" />
                <FieldPaginationButton onClick={onClickTemp} text="i-1" />
                <FieldPaginationButton onClick={onClickTemp} text="i" />
                <FieldPaginationButton onClick={onClickTemp} text="i+1" />
                <FieldPaginationButton onClick={onClickTemp} text="i+2" />
                <FieldPaginationDots />
                <FieldPaginationButton onClick={onClickTemp} text="N-1" />
                <FieldPaginationButton onClick={onClickTemp} text="N" />
                <FieldPaginationButton onClick={onClickTemp} text="Next" 
                    className="field-pagination-button-prev-next" />
            </div>
        );
    }
}

export default FieldPagination;