import logo from './logo.svg';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import LayoutFlow from './components/reactflow/layoutflow';
import TerminalScreen from './TerminalScreen.js';


class App extends Component {
    
    constructor(props){
        super(props);
        this.state = {
            exampleMessageValue: "Hello from React!"
        }
    }
    
    
    messageRecievedHandler(msg){
        const { name, value } = msg;
        
        console.log("Messaged received.");
        console.log(`Message name: ${name}`);
        console.log(`Message value: ${value}`);
        
        // Add Any Logic that should be handled here.
        
        switch (name) {
            case "example":
                console.log('Handle Example Messgage')
                break;
            default:
                console.log('Do Nothing');
        }
    }
    
    
    
    sendMessageExample(){
        // You can wrap the send message function to easily send specific message types.
        
        this.sendMessage(
            {
                name: "example",
                value: this.state.exampleMessageValue
            }
        );
    }
    
    // The Render Functiion is what defines the markup of our component.
    render(){
        return (
           <div className="App">            
                <LayoutFlow/>
                <TerminalScreen text=""/>
            </div>
        );
    }
}

export default App;
