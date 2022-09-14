import React, {useEffect} from 'react';
import { useStore, useZoomPanHelper } from 'react-flow-renderer';

const Sidecar = ({loadFunc}) => {
    const startingPointAdj = {x: 200, y: 170};
    const store = useStore();
    const { zoomIn, zoomOut, setCenter, fitView} = useZoomPanHelper();

    useEffect(() => {
        loadFunc.current = focusNode;
    });

    const findHighestAndLeftMostNode = (nodes) => {
        let highestNode = nodes[0];
        let leftMostNode = nodes[0];
        nodes.forEach(node => {
            highestNode = (node.position.y < highestNode.position.y) ? node : highestNode;
            leftMostNode = (node.position.x < leftMostNode.position.x) ? node : leftMostNode;
        });
        return {highest: highestNode, leftmost: leftMostNode};
    };

    function focusNode(assignmentChart) {
        const { nodes } = store.getState();
        if (nodes.length) {
            const node = findHighestAndLeftMostNode(nodes);
            const x = node.leftmost.__rf.position.x + node.leftmost.__rf.width + startingPointAdj.x;
            const y = node.highest.__rf.position.y + node.highest.__rf.height + startingPointAdj.y;
            let screenWidth = screen.availWidth;
            const zoom = screenWidth * 0.00062;
            (assignmentChart) ? setCenter(x, y * 0.998, zoom) : fitView({padding: 0.2});
        }
    }

    return '';
};

export default Sidecar;
