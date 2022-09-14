import $ from "jquery";
import { isNode } from 'react-flow-renderer';
import _forEach from 'lodash/forEach';

const randomWidth = 25;
let prevEl = {
    id: '',
    sourcePosition: '',
    targetPosition: '',
    position: {
        x: 0,
        y: 0
    }
};

export const wrapElements = (dagre, dagreGraph, elements, isHorizontal = true, nodeWidth = 200, nodeHeight = 30) => {
    prevEl = {
        id: '',
        activation_priority: '-1',
        sourcePosition: '',
        targetPosition: '',
        position: {
            x: 0,
            y: 0
        }
    };
    const node = $('.container-fluid');    
    const containerWidth = (node.width()<= 1480)? node.width() : 1480 ;        
    elements = (isHorizontal) ? wrapElementsHorizontally(dagreGraph, elements, nodeWidth, nodeHeight, containerWidth)
        : wrapElementsVertically(dagreGraph, elements, nodeWidth, nodeHeight, containerWidth);    
    dagre.layout(dagreGraph);
    return elements;
}

const wrapElementsHorizontally = (dagreGraph, elements, nodeWidth, nodeHeight, containerWidth) => {   
    const startEndNodeAdj = 17;

    let maxParrallelNodes = 1;
    let parrallelNodes = {};
    elements.map((el) => {
        if (isNode(el)) {
            parrallelNodes[el.activation_priority] = parrallelNodes[el.activation_priority] || [];
            parrallelNodes[el.activation_priority].push(el);
        }
        return el;
    });

    _forEach(parrallelNodes, function (value, priority) {
        maxParrallelNodes = (value.length > maxParrallelNodes) ? value.length : maxParrallelNodes;
    });

    const gapBetweenRows = (nodeHeight * maxParrallelNodes * 5);
    const yGapAdjustmentFactor = 1.6;

    let alignedElements = elements.map((el) => {
        if (isNode(el)) {
            el.targetPosition = 'left';
            el.sourcePosition = 'right';

            let x = 0;
            let y = 0;
            let sameYAxis = false;
            let greaterYAxis = false;
            let xAxisGtrContainer = false;
            let infiniteLoopControl = 100;
            let count = 0;
            do {
                y = (xAxisGtrContainer) ? y + gapBetweenRows : y;
                greaterYAxis = (prevEl.position.y > y);
                y = (xAxisGtrContainer && greaterYAxis) ? prevEl.position.y + (nodeHeight * yGapAdjustmentFactor) : y;
                y = (!xAxisGtrContainer && greaterYAxis) ? prevEl.position.y : y;
                y = (xAxisGtrContainer && el.id == 'end-1') ? prevEl.position.y : y;

                sameYAxis = (prevEl.position.y == y);
                xAxisGtrContainer = (x > containerWidth || x + nodeWidth / 2 > containerWidth);
                greaterYAxis = (prevEl.position.y > y);

                prevEl.sourcePosition = (xAxisGtrContainer && !greaterYAxis) ? 'right' : prevEl.sourcePosition;
                prevEl.sourcePosition = (xAxisGtrContainer && sameYAxis) ? 'right' : prevEl.sourcePosition;
                el.targetPosition = (xAxisGtrContainer && !greaterYAxis) ? 'left' : el.targetPosition;
                el.targetPosition = (xAxisGtrContainer && sameYAxis) ? 'left' : el.targetPosition;

                x = xAxisGtrContainer ? 0 : x;
                x = (sameYAxis && x == 0 && el.id != 'start-1') ? prevEl.position.x + nodeWidth + randomWidth : x;

                x = (prevEl.activation_priority == el.activation_priority) ? prevEl.position.x : x;

                xAxisGtrContainer = (x > containerWidth || x + nodeWidth / 2 > containerWidth);
                count++;
            } while (xAxisGtrContainer && count < infiniteLoopControl);

            el.position = {
                x: x,
                y: y,
            };
            prevEl = el;
        }
        return el;
    });


    let maxNodesOnAxis = {};
    let maxNodesOnEachRow = {};
    let allNodesOnEachRow = {};
    let startingXAxis = 0;
    let LastXAxis = 0;

    prevEl = alignedElements[0];
    alignedElements.map((el) => {
        if (isNode(el)) {
            el.originalY = el.position.y;
            const axis = el.position.x + '_' + el.position.y;
            startingXAxis = (el.position.x < startingXAxis) ? el.position.x : startingXAxis;
            LastXAxis = (Math.abs(startingXAxis - el.position.x) > LastXAxis && el.id != 'end-1') ? Math.abs(startingXAxis - el.position.x) : LastXAxis;
            maxNodesOnAxis[axis] = maxNodesOnAxis[axis] || [];
            maxNodesOnAxis[axis].push(el);
            maxNodesOnEachRow[el.position.y] = maxNodesOnEachRow[el.position.y] || 0;
            maxNodesOnEachRow[el.position.y] = (maxNodesOnEachRow[el.position.y] < maxNodesOnAxis[axis].length) ? maxNodesOnAxis[axis].length : maxNodesOnEachRow[el.position.y];
            allNodesOnEachRow[el.position.y] = allNodesOnEachRow[el.position.y] || [];
            allNodesOnEachRow[el.position.y].push(el);            
            prevEl = el;
        }
        return el;
    });

    let highestAndLowestNodeOfEachRow = {};
    _forEach(parrallelNodes, function (value, priority) {
        let yAxis = value[0].position.y;
        if (priority == 'undefined' || value.length < 2) {
            highestAndLowestNodeOfEachRow[yAxis] = highestAndLowestNodeOfEachRow[yAxis] || {highest: value[0], lowest: value[0]};
            highestAndLowestNodeOfEachRow[yAxis].highest = (value[0].position.y < highestAndLowestNodeOfEachRow[yAxis].highest.position.y) ? value[0] : highestAndLowestNodeOfEachRow[yAxis].highest;
            highestAndLowestNodeOfEachRow[yAxis].lowest = (value[0].position.y > highestAndLowestNodeOfEachRow[yAxis].lowest.position.y) ? value[0] : highestAndLowestNodeOfEachRow[yAxis].lowest;
            if (priority == 'undefined') {
                yAxis = value[1].position.y;
                highestAndLowestNodeOfEachRow[yAxis] = highestAndLowestNodeOfEachRow[yAxis] || {highest: value[1], lowest: value[1]};
                highestAndLowestNodeOfEachRow[yAxis].highest = (value[1].position.y < highestAndLowestNodeOfEachRow[yAxis].highest.position.y) ? value[1] : highestAndLowestNodeOfEachRow[yAxis].highest;
                highestAndLowestNodeOfEachRow[yAxis].lowest = (value[1].position.y > highestAndLowestNodeOfEachRow[yAxis].lowest.position.y) ? value[1] : highestAndLowestNodeOfEachRow[yAxis].lowest;                    
            }
            return;
        }
        let nodeDiff = gapBetweenRows / (maxParrallelNodes * yGapAdjustmentFactor);
        let yAdj = (value.length % 2 == 0) ? ((nodeHeight * 2) / yGapAdjustmentFactor) + 10 : 0;
        let addToggle = true;
        const sourcePosition = value[value.length - 1].sourcePosition;
        const targetPosition = value[0].targetPosition;
        value.forEach((node, index) => {
            node.sourcePosition = sourcePosition;
            node.targetPosition = targetPosition;
            node.position.y += (addToggle) ? yAdj : -yAdj;
            
            yAdj = (value.length % 2 == 0 && (index == 0)) ? -yAdj : yAdj;
            addToggle = ((value.length % 2 == 0 && (index == 1))) ? !addToggle : addToggle; 
            yAdj += (addToggle) ? nodeDiff : 0;
            addToggle = !addToggle;        
            
            highestAndLowestNodeOfEachRow[yAxis] = highestAndLowestNodeOfEachRow[yAxis] || {highest: node, lowest: node};            
            highestAndLowestNodeOfEachRow[yAxis].highest = (node.position.y < highestAndLowestNodeOfEachRow[yAxis].highest.position.y) ? node : highestAndLowestNodeOfEachRow[yAxis].highest;
            highestAndLowestNodeOfEachRow[yAxis].lowest = (node.position.y > highestAndLowestNodeOfEachRow[yAxis].lowest.position.y) ? node : highestAndLowestNodeOfEachRow[yAxis].lowest;
        });
    }); 
    
    _forEach(highestAndLowestNodeOfEachRow, function (nodes, yAxis) {
        let axis = startingXAxis + '_' + yAxis;
        let startNodeY = 0;
        let highLowNodes = null;        
        if (maxNodesOnAxis[axis] && maxNodesOnAxis[axis].length > 1) {            
            let startNodeY = maxNodesOnAxis[axis][0].position.y;            
            highLowNodes = getHighestLowestFromRow(maxNodesOnAxis[axis]);
            maxNodesOnAxis[axis][0].position.y = highLowNodes['highest'].position.y;
            (highLowNodes['highest'].id == nodes.highest.id) ? nodes.highest = maxNodesOnAxis[axis][0] : '';
            highLowNodes['highest'].position.y = startNodeY;  
        }
        
        axis = LastXAxis + '_' + yAxis;
        if (!maxNodesOnAxis[axis] || maxNodesOnAxis[axis].length < 1) {
            return;
        }
        startNodeY = maxNodesOnAxis[axis][0].position.y;        
        highLowNodes = getHighestLowestFromRow(maxNodesOnAxis[axis]);
        maxNodesOnAxis[axis][0].position.y = highLowNodes['lowest'].position.y;
        (nodes && highLowNodes['lowest'].id == nodes.lowest.id) ? nodes.lowest = maxNodesOnAxis[axis][0] : '';
        highLowNodes['lowest'].position.y = startNodeY;     
    });

    let prevYAxis = 0;
    let yAdj = 0;
    _forEach(allNodesOnEachRow, function (nodes, yAxis) {
        let oldValue = (highestAndLowestNodeOfEachRow && highestAndLowestNodeOfEachRow[prevYAxis] && highestAndLowestNodeOfEachRow && highestAndLowestNodeOfEachRow[yAxis] )?  highestAndLowestNodeOfEachRow[prevYAxis].lowest.position.y - highestAndLowestNodeOfEachRow[yAxis].highest.position.y : 0;
        yAdj = (prevYAxis == yAxis) ? 0 : oldValue;        
        yAdj = (prevYAxis == yAxis) ? yAdj : yAdj + ((nodeHeight * 5));
        nodes.forEach((node, index) => {
            node.position.y += yAdj;
        });
        prevYAxis = yAxis;
    });

    if ((alignedElements && alignedElements[0])) {
        alignedElements[0].position.y += startEndNodeAdj;
    }
    if ((alignedElements && alignedElements[alignedElements.length - 1])) {
        alignedElements[alignedElements.length - 1].position.y += startEndNodeAdj;
    }   
    alignedElements.forEach((el) => {
        if (isNode(el)) {
            dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
        } else {
            el.data = {highestAndLowestNodeOfEachRow: highestAndLowestNodeOfEachRow};
            dagreGraph.setEdge(el.source, el.target);
        }
    });
    return alignedElements;
}

const getHighestLowestFromRow = (nodes) => {
    if (nodes.length < 1) {
        return {highest: null, lowest: null};
    }
    let highestLowestNodes = {highest: nodes[0], lowest: nodes[0]}; 
    nodes.forEach((node, index) => {
        highestLowestNodes.highest = (node.position.y < highestLowestNodes.highest.position.y) ? node : highestLowestNodes.highest;
        highestLowestNodes.lowest = (node.position.y > highestLowestNodes.lowest.position.y) ? node : highestLowestNodes.lowest;
    });
    return highestLowestNodes;
}

const wrapElementsVertically = (dagreGraph, elements, nodeWidth, nodeHeight, containerWidth) => {    
    const gapBetweenRows = (nodeHeight * 5.8);
    const gapBetweenNodes = (nodeWidth * 1.25);
    const startNodeAdj = -27.25;
    const endNodeAdj = -26.75;

    let x = 0;
    let y = 0;
    let alignedElements = elements.map((el) => {
        if (isNode(el)) {
            y = (prevEl.id && (prevEl.id.startsWith('action_') || prevEl.id == 'start-1')) ? prevEl.position.y + gapBetweenRows : prevEl.position.y;
            y = (prevEl.id && (prevEl.id.startsWith('action_') && el.id.startsWith('action_'))) ? prevEl.position.y : y;
            y = (prevEl.id && prevEl.id.startsWith('condition_')) ? y + 8 : y;
            
            x = (prevEl.id && prevEl.id.startsWith('condition_')) ? prevEl.position.x + gapBetweenNodes : prevEl.position.x - gapBetweenNodes;
            x = (prevEl.id && prevEl.id == 'start-1') ? x + gapBetweenNodes : x;
            x = (prevEl.id && (prevEl.id.startsWith('action_') && el.id.startsWith('action_'))) ? prevEl.position.x : x;

            el.position = {
                x: x,
                y: y,
            };
            prevEl = el;
        }
        return el;
    });
    
    alignedElements = alignedElements.map((el) => {
        if (isNode(el)) {
            el.position.x = (prevEl.id && (prevEl.id.startsWith('action_') && el.id.startsWith('action_'))) ? prevEl.position.x + gapBetweenNodes : el.position.x;
            prevEl = el;
        }
        return el;
    });

    if ((alignedElements && alignedElements[0])) {
        alignedElements[0].position.x += startNodeAdj;
    }
    if ((alignedElements && alignedElements[alignedElements.length - 1])) {
        alignedElements[alignedElements.length - 1].position.x += endNodeAdj;
    }
    alignedElements.forEach((el) => {
        if (isNode(el)) {
            dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
        } else {
            dagreGraph.setEdge(el.source, el.target);
        }
    });
    return alignedElements;
}
