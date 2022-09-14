// This line sets up react.
import React from 'react';
// This is an ES2015 Declaration of a function if it looks unfamilar to you, check out http://exploringjs.com/es6/
const TerminalScreen = props => (
    <div className="terminal-window">
        <p>{props.text}</p>
    </div>
);
// This line makes the variable TerminalScreen available to other files.
export default TerminalScreen;