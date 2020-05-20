import React from "react";

class FieldMenuFilter extends React.Component {
    render() {
        const placeholder = this.props.placeholder || "Filter...";
        return (
            <div className="field-menu-item">
                <input type="search" className="field-menu-filter" 
                    placeholder = {placeholder} onChange={this.props.onChange} />
            </div>
            
        );
    }
}

// constructor(props) {
//     super(props);
//     this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
//     this.handleInStockOnlyChange = this.handleInStockOnlyChange.bind(this);
//   }

//   handleFilterTextChange(e) {
//     this.props.onFilterTextChange(e.target.value);
//   }

//   handleInStockOnlyChange(e) {
//     this.props.onInStockOnlyChange(e.target.checked);
//   }

//   render() {
//     return (
//       <form>
//         <input type="search" id="search" name="search" placeholder="Search..." 
//           onChange={this.handleFilterTextChange}></input>
//         <p>
//           <input type="checkbox" id="in-stock" name="in-stock"
//             onChange={this.handleInStockOnlyChange}></input>
//           <label htmlFor="in-stock">Only show products in stock</label>
//         </p>
//       </form>
//     );
//   }
export default FieldMenuFilter;