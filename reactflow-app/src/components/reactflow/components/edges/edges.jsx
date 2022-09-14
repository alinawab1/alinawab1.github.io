import React, { useEffect, memo, useMemo } from 'react';
import { Position, useStoreState, getMarkerEnd, getEdgeCenter } from 'react-flow-renderer';

const bottomLeftCorner = (x, y, size) => `L ${x},${y - size}Q ${x},${y} ${x + size},${y}`;

const leftBottomCorner = (x, y, size) => `L ${x + size},${y}Q ${x},${y} ${x},${y - size}`;
const leftBottomCornerExtraEdge = (x, y, size, width, height) => `L ${x + xAxisAdj}, `;

const bottomRightCorner = (x, y, size) => `L ${x},${y - size}Q ${x},${y} ${x - size},${y}`;
const bottomRightCornerExtraEdge = (x, y, size, width, height) => `L ${x - xAxisAdj}, `;

const rightBottomCorner = (x, y, size) => `L ${x - size},${y}Q ${x},${y} ${x},${y - size}`;

const leftTopCorner = (x, y, size) => `L ${x + size},${y}Q ${x},${y} ${x},${y + size}`;
const leftTopCornerExtraEdge = (x, y, size, width, height) => `L ${x + xAxisAdj}, `;

const topLeftCorner = (x, y, size) => `L ${x},${y + size}Q ${x},${y} ${x + size},${y}`;

const topRightCorner = (x, y, size) => `L ${x},${y + size}Q ${x},${y} ${x - size},${y}`;
const topRightCornerExtraEdge = (x, y, size, width, height) => `L ${x - xAxisAdj}, `;

const rightTopCorner = (x, y, size) => `L ${x - size},${y}Q ${x},${y} ${x},${y + size}`;

let alignEdges = {};
let xAxisAdj = 0;

const getCustomSmoothStepPath = ({
  id,
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
  borderRadius = 5,
  centerX,
  centerY,
  source,
  target,
  data
}) => {
  const nodes = useStoreState((state) => state.nodes);

  const sourceNode = useMemo(() => nodes.find((n) => n.id === source), [source, nodes]);
  const targetNode = useMemo(() => nodes.find((n) => n.id === target), [target, nodes]);
  const undefined = 'undefined';
  const {
    width,
    height,
    position
  } = targetNode.__rf;


  const sourceNodeX = sourceNode?.__rf?.position?.x;
  const targetNodeX = targetNode?.position?.x;
  const targetNodeY = targetNode?.position?.y;

  const highestNodeTarget = data?.highestAndLowestNodeOfEachRow[targetNode?.originalY]?.highest;
  const lowestNodeSource = data?.highestAndLowestNodeOfEachRow[sourceNode?.originalY]?.lowest;

  xAxisAdj = (width / 2.5);

  let [_centerX, _centerY, offsetX, offsetY] = getEdgeCenter({ sourceX, sourceY, targetX, targetY });
  const cornerWidth = Math.min(borderRadius, Math.abs(targetX - sourceX));
  const cornerHeight = Math.min(borderRadius, Math.abs(targetY - sourceY));
  let cornerSize = Math.min(cornerWidth, cornerHeight, offsetX, offsetY);

  const leftAndRight = [Position.Left, Position.Right];
  const cX = typeof centerX !== undefined ? centerX : _centerX;
  const cY = typeof centerY !== undefined ? centerY : _centerY;

  let firstCornerPath = null;
  let secondCornerPath = null;

  let nextLine = false;

  if (sourceX <= targetX) {
    firstCornerPath =
      sourceY <= targetY ? bottomLeftCorner(sourceX, cY, cornerSize) : topLeftCorner(sourceX, cY, cornerSize);
    secondCornerPath =
      sourceY <= targetY ? rightTopCorner(targetX, cY, cornerSize) : rightBottomCorner(targetX, cY, cornerSize);
  } else {
    firstCornerPath =
      sourceY < targetY ? bottomRightCorner(sourceX, cY, cornerSize) : topRightCorner(sourceX, cY, cornerSize);
    secondCornerPath =
      sourceY < targetY ? leftTopCorner(targetX, cY, cornerSize) : leftBottomCorner(targetX, cY, cornerSize);
  }

  if (leftAndRight.includes(sourcePosition) && leftAndRight.includes(targetPosition)) {
    if (sourceX <= targetX) {
      firstCornerPath =
        sourceY <= targetY ? rightTopCorner(cX, sourceY, cornerSize) : rightBottomCorner(cX, sourceY, cornerSize);
      secondCornerPath =
        sourceY <= targetY ? bottomLeftCorner(cX, targetY, cornerSize) : topLeftCorner(cX, targetY, cornerSize);
    } else if (
      (sourcePosition === Position.Right && targetPosition === Position.Left) ||
      (sourcePosition === Position.Left && targetPosition === Position.Right) ||
      (sourcePosition === Position.Left && targetPosition === Position.Left)
    ) {
      // and sourceX > targetX
      nextLine = true;
      firstCornerPath =
        sourceY < targetY ? leftTopCornerExtraEdge(sourceX, cY, cornerSize, width, height) : leftBottomCornerExtraEdge(sourceX, cY, cornerSize, width, height);
      secondCornerPath =
        sourceY < targetY ? bottomRightCornerExtraEdge(targetX, cY, cornerSize, width, height) : topRightCornerExtraEdge(targetX, cY, cornerSize, width, height);
    }
  } else if (leftAndRight.includes(sourcePosition) && !leftAndRight.includes(targetPosition)) {
    if (sourceX <= targetX) {
      firstCornerPath =
        sourceY <= targetY
          ? rightTopCorner(targetX, sourceY, cornerSize)
          : rightBottomCorner(targetX, sourceY, cornerSize);
    } else {
      firstCornerPath =
        sourceY <= targetY
          ? leftTopCorner(targetX, sourceY, cornerSize)
          : leftBottomCorner(targetX, sourceY, cornerSize);
    }
    secondCornerPath = '';
  } else if (!leftAndRight.includes(sourcePosition) && leftAndRight.includes(targetPosition)) {
    if (sourceX <= targetX) {
      firstCornerPath =
        sourceY <= targetY
          ? bottomLeftCorner(sourceX, targetY, cornerSize)
          : topLeftCorner(sourceX, targetY, cornerSize);
    } else {
      firstCornerPath =
        sourceY <= targetY
          ? bottomRightCorner(sourceX, targetY, cornerSize)
          : topRightCorner(sourceX, targetY, cornerSize);
    }
    secondCornerPath = '';
  }
  if (nextLine) {
    const cornerSizeAdj = (sourceY < targetY) ? cornerSize - 5 : 0;
    const lowestY = (sourceY <= lowestNodeSource.position.y) ? lowestNodeSource.position.y : sourceY - (height / 2);
    const highestY = (targetY > highestNodeTarget.position.y) ? highestNodeTarget.position.y : targetY - (height / 2);
    const yOffset = Math.abs(highestY + lowestY) / 2;
    const adjY = height / 2 + yOffset;

    alignEdges[target + targetNodeX] = alignEdges[source + targetNodeX] || alignEdges[target + targetNodeX] || { y: adjY };
    alignEdges[source + targetNodeX] = alignEdges[target + targetNodeX] || alignEdges[source + targetNodeX];

    firstCornerPath += alignEdges[target + targetNodeX].y;
    secondCornerPath += alignEdges[target + targetNodeX].y;
    return `M ${sourceX - cornerSizeAdj},${sourceY}L ${sourceX + xAxisAdj},${sourceY}${firstCornerPath}${secondCornerPath}L ${targetX - xAxisAdj},${targetY} ${targetX + cornerSizeAdj},${targetY}`;
  }
  return `M ${sourceX},${sourceY}${firstCornerPath}${secondCornerPath}L ${targetX},${targetY}`;
}

export const customStepEdge = (props) => {
  let {
    sourceX,
    sourceY,
    targetX,
    targetY,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    style,
    sourcePosition = Position.Bottom,
    targetPosition = Position.Top,
    arrowHeadType,
    markerEndId,
    borderRadius = 5,
    source,
    target,
    id,
    data
  } = props;

  useEffect(() => {
    alignEdges = {};
  });

  const [centerX, centerY] = getEdgeCenter({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  const path = getCustomSmoothStepPath({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius,
    source,
    target,
    data
  });

  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
  const text = label ? (
    <EdgeText
      x={centerX}
      y={centerY}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
    />
  ) : null;
  return (
    <>
      <path style={style} className="react-flow__edge-path" d={path} markerEnd={markerEnd} />
      {text}
    </>
  );
}

export const edgeTypes = {
  customStepEdge: memo(customStepEdge)
};
