import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    removeElements,
    isNode,
    MiniMap,
    Controls,
    Background
} from 'react-flow-renderer';
import dagre from 'dagre';
import { Dropdown, FormGroup, Button, ButtonToggle, DropdownMenu, DropdownItem, Label, Input, Container, Row, Col } from 'reactstrap';
import initialElements from './initial-elements';
import './layoutflow.css';
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
import _uniqueId from 'lodash/uniqueId';

import { convertRawJson, isJsonString } from './json-builder/json-builder';
import { wrapElements } from './helpers/layout-helper';

import { nodeTypes } from "./components/node/nodes.jsx";

import { edgeTypes } from "./components/edges/edges.jsx";

import "./styles.css";

import Sidebar from './sidebar';

const nodeWidth = 200;
const nodeHeight = 30;

let assignmentChart = false;

let reactFlowKey = Math.random();

const getLayoutedElements = (elements, direction = 'LR') => {
    direction = (assignmentChart) ? 'TB' : direction;
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, width: '500', height: '500' });
    return wrapElements(dagre, dagreGraph, elements, isHorizontal, nodeWidth, nodeHeight);
};

let reactFlowInstance = null;

const onLoad = (reactFlowInst) => {
    const jsonData =  localStorage.getItem('jsonData');
    const initialJsonElement = document.querySelector('#initial-json');
    if (!initialJsonElement.value && jsonData) {
        document.querySelector('#noter-text-area').value = jsonData;
        initialJsonElement.value = jsonData;
        localStorage.removeItem("jsonData");
        document.querySelector('#loadjson').click();
    }
    reactFlowInstance = reactFlowInst
    const timer = setTimeout(() => {
        if (loadFunc) {
            loadFunc.current(assignmentChart);
            let jsonInputNew = document.getElementById('noter-text-area').value;
            if (isJsonString(jsonInputNew)) {
                var graphLoaded = JSON.stringify({
                    graphLoaded: true,
                });
                window.top.postMessage(graphLoaded, '*');
            }
        }
    }, 0);
    return () => clearTimeout(timer);
};

const onFitView = () => {
    reactFlowInstance.fitView({ padding: 0.2 });
}

const layoutedElements = getLayoutedElements(initialElements);
let loadFunc = null;
const LayoutFlow = () => {
    loadFunc = React.useRef(null);
    const [parentNode, setParentNode] = useState('');
    const [elements, setElements] = useState(layoutedElements);
    const [jsonInput, setJsonInput] = useState('No file selected');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isDraggable, setIsDraggable] = useState(true);
    const [dropdownOpen2, setDropdownOpen2] = useState(false);
    const [nodeName, setNodeName] = useState('Edit Label');
    const [nodeBg, setNodeBg] = useState('#eee');
    const [nodeHidden, setNodeHidden] = useState(false);
    const [dropDownX, setDropDownX] = useState(0);
    const [dropDownY, setDropDownY] = useState(0);
    const [dropDown2X, setDropDown2X] = useState(0);
    const [dropDown2Y, setDropDown2Y] = useState(0);

    const setDropdownClose = (event, node) => {
        setDropdownOpen(false);
    }
    const toggleDropdown2 = (event, node) => {
        setDropdownOpen2(!dropdownOpen2);
    }
    const toggleDropdown = (event, node) => {
        setDropdownOpen(!dropdownOpen);
    }
    const setDropdownClose2 = (event, node) => {
        setDropdownOpen2(false);
    }
    const cutHandler = (event, node) => {
        setNodeHidden(true);
    }
    const copyHandler = (event, node) => {
        const jsonInputNew = document.getElementById('noter-text-area').value;
        let sourceNodeID = event.target.name;
        let sourceNode = elements.find(item => item.id === sourceNodeID);
        let newNode = { "id": _uniqueId(''), "type": sourceNode.type, "data": { "label": sourceNode.data.label + "-Copy" } };
        if (isJsonString(jsonInputNew)) {
            let updatedInput = JSON.parse(jsonInputNew);
            updatedInput.push(newNode);
            setJsonInput(JSON.stringify(updatedInput));
            const array = getLayoutedElements(updatedInput);
            setElements(array);
        } else {            
            alert("Load Graph JSON to enable copy of nodes!");
        }
    }

    const lockHandler = (event, node) => {
        event.preventDefault();
        setIsDraggable(false);
    }
    const deleteHandler = (event, node) => {
        event.preventDefault();
        setNodeHidden(true);
    }
    const onNodeDoubleClick = (event, node) => {
        setDropDownX(event.clientX);
        setDropDownY(event.clientY);
        setParentNode(event.target.dataset.id);
        setDropdownOpen(true);
    }

    const onNodeContextMenu = (event, node) => {
        event.preventDefault();
        setParentNode(event.target.dataset.id);
        setDropDown2X(event.clientX);
        setDropDown2Y(event.clientY);
        setDropdownOpen(false);
        setDropdownOpen2(!dropdownOpen2);
    }
    const onConnect = (params) =>
        setElements((els) =>
            addEdge({ ...params, type: 'smoothstep', animated: true }, els)
        );
    const onElementsRemove = (elementsToRemove) =>
        setElements((els) => removeElements(elementsToRemove, els));
    const onLayout = useCallback(
        (direction) => {
            const layoutedElements = getLayoutedElements(elements, direction);
            setElements(layoutedElements);
        },
        [elements]
    );
    const handleFileSelected = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            // The file's text will be printed here
            setJsonInput(event.target.result);
            const array = getLayoutedElements(JSON.parse(event.target.result));
            setElements(array);
        };
        reader.readAsText(file);
    }
    const loadJsonNow = () => {
        let jsonInputNew = document.getElementById('noter-text-area').value;
        if (!isJsonString(jsonInputNew)) {
            return;
        }
        jsonInputNew = JSON.parse(jsonInputNew);
        const isAssignmentChartJson = (jsonInputNew.flowType && jsonInputNew.flowType == "2");
        assignmentChart = isAssignmentChartJson;
        jsonInputNew = convertRawJson(jsonInputNew, !isAssignmentChartJson);
        setJsonInput(JSON.stringify(jsonInputNew));
        if (jsonInputNew) {
            const parsedJSON = getLayoutedElements(jsonInputNew);
            setJsonInput(JSON.stringify(parsedJSON));
            reactFlowKey = Math.random();
            setElements(parsedJSON);
        }        
        //let m =  {iframeComplete: true };
        //window.top.postMessage(jsonInputNew, '*');
        setIsDraggable(false);        
    };
    const saveJsonNow = () => {
        const jsonInputNew = document.getElementById('noter-text-area').value;
        if (jsonInputNew) {
            window.top.postMessage(jsonInputNew, '*');
        }
    };
    const textAreaValue = (event) => {
        setJsonInput(event.target.value);
    }

    useEffect(() => {

        setElements((els) =>
            els.map((el) => {
                if (el.id === parentNode) {
                    // it's important that you create a new object here
                    // in order to notify react flow about the change
                    el.data = {
                        ...el.data,
                        label: nodeName,
                    };
                }

                return el;
            })
        );
    }, [nodeName, setElements]);
    useEffect(() => {
        setElements((els) =>
            els.map((el) => {
                if (el.id === parentNode) {
                    // it's important that you create a new object here
                    // in order to notify react flow about the change
                    el.style = { ...el.style, backgroundColor: nodeBg };
                }

                return el;
            })
        );
    }, [nodeBg, setElements]);
    useEffect(() => {
        setElements((els) =>
            els.map((el) => {
                if (el.id === parentNode) {
                    // when you update a simple type you can just update the value                   
                    el.isHidden = nodeHidden;
                }

                return el;
            })
        );
    }, [nodeHidden, setElements]);
    return (
        <div>
            <div className="layoutflow">
                <ReactFlowProvider>
                    <Container fluid>
                        <Row>
                            <ReactFlow
                                key={reactFlowKey}
                                elements={elements}
                                onConnect={onConnect}
                                onLoad={onLoad}
                                onElementsRemove={onElementsRemove}
                                nodesDraggable={isDraggable}
                                connectionLineType="smoothstep"
                                snapToGrid={true}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                snapGrid={[50, 50]}
                                defaultZoom={1}
                            >
                              <Controls showInteractive={false} onFitView={onFitView}/>
                                {assignmentChart ? <MiniMap /> : ''}
                                <Background color="#858585" gap={32} size={0.75} />
                            </ReactFlow>
                            <Sidebar loadFunc={loadFunc} />

                        </Row>
                        <Row className="options">

                            <Col>
                                <Button color="primary" id="loadjson" hidden="true" onClick={loadJsonNow}> Load Below JSON</Button>
                            </Col>
                            <Col>
                                <Button color="primary" id="savedata" hidden="true" onClick={saveJsonNow}> Save JSON</Button>
                            </Col>
                        </Row>
                        <Row>
                            <FormGroup>
                                <form id="noter-save-form" method="POST">
                                    <textarea hidden="true" className="inputtextArea" id="noter-text-area" name="textarea" value={jsonInput} onChange={textAreaValue} />
                                    <textarea hidden="true" className="inputtextArea" id="initial-json" name="initial-json"  />
                                </form>
                            </FormGroup>
                        </Row>
                    </Container>
                    <div className="dropdownClass" style={{
                        left: dropDownX,
                        top: dropDownY,
                    }}>
                        <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>

                            <DropdownMenu>
                                <div style={{ padding: '10px' }}>
                                    <Label>label:</Label>
                                    <Input
                                        value={nodeName}
                                        onChange={(evt) => setNodeName(evt.target.value)}
                                        defaultValue=""
                                        id="testingInput"
                                    />

                                    <Label >background:</Label>
                                    <Input value={nodeBg} onChange={(evt) => setNodeBg(evt.target.value)} />

                                    <div>
                                        <Label>hidden:</Label>
                                        <Input
                                            type="checkbox"
                                            checked={nodeHidden}
                                            onChange={(evt) => setNodeHidden(evt.target.checked)}
                                        />
                                    </div>
                                </div>
                                <ButtonToggle style={{ marginLeft: "42px" }} color="success">SAVE</ButtonToggle>
                                <ButtonToggle style={{ marginLeft: "42px" }} color="cancel" onClick={(evt) => setDropdownClose(evt.target.value)}>Close</ButtonToggle>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                    <div className="dropdownClass" style={{
                        left: dropDown2X,
                        top: dropDown2Y,
                    }}>
                        <Dropdown isOpen={dropdownOpen2} toggle={toggleDropdown2}>

                            <DropdownMenu >
                                <input type="hidden" id="parentID" value={parentNode} />
                                <ButtonToggle style={{ marginLeft: "120px" }} color="success" onClick={(evt) => setDropdownClose2(evt.target.value)}>X</ButtonToggle>
                                <DropdownItem divider />
                                <DropdownItem onClick={cutHandler} name={parentNode}>CUT</DropdownItem>
                                <DropdownItem onClick={copyHandler} name={parentNode}>COPY</DropdownItem>
                                <DropdownItem onClick={deleteHandler} name={parentNode}>DELETE</DropdownItem>                                
                            </DropdownMenu>

                        </Dropdown>
                    </div>
                </ReactFlowProvider>
            </div>


        </div>
    );
};
export default LayoutFlow;
