import React, { Component } from 'react';

class Counter extends Component {
    state = { 
        count: 0
    } 
    render() { 
        return (
            <React.Fragment>
                <h1>{this.state.count}</h1>
                <h1>Function call: {this.functionCount()}</h1>
            </React.Fragment>);
    }

    functionCount(){
        const {count} = this.state;
        return count === 0 ? <h1>Zero</h1> : count;
    }
}
 
export default Counter;