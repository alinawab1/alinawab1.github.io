import React, { memo, useMemo } from 'react';
import { Handle, useStoreState, Position } from 'react-flow-renderer';
import cloneDeep from 'lodash/cloneDeep';
import { isJsonString } from '../../json-builder/json-builder';
import $ from 'jquery';

let nodes = null;
let nodeInEdit = false;
let onSecondNode = false;
const INITIAL_JSON_DIV_ID = '#initial-json';
const SPAN = '_span';
const TEXT_AREA = '_textarea';
const POINTER = 'pointer';
const DEFAULT = 'default';
const TEXT_AREA_PARENT_PADDING_CLASS = 'rectangle-node-textarea-parent-padding';
const SECOND_ACTIONS = 'second-actions';
const CONDITION = 'condition';
const ACTION = 'action';
const CURSOR = 'cursor';
const SOURCE_HANDLE_STYLE = {
    top: '50%',
    borderRadius: 0,
};
const TARGET_HANDLE_STYLE = {
    borderRadius: 0,
};
const onHoverStart = (e) => {
    let initialJSON = getElement(INITIAL_JSON_DIV_ID)?.value;
    if (isDraftAndNotTestable(initialJSON)) {
        e.target.pointerEvents = 'none';
    }
    let text = e.target.title;
    let id = e.target.id;
    id = id ? id.replace(SPAN, '') : '';
    id = id ? id.replace(TEXT_AREA, '') : '';
    let field = text && text.split(':').length > 1 ? text.split(':')[0].trim() : '';
    let value = text && text.split(':').length > 1 ? text.split(':')[1].trim() : '';
    let processed =
        e.target && e.target.children && e.target.children.length > 0 && e.target.children[0].value
            ? e.target.children[0].value
            : false;
    const rowNum = id && id.split('_') && id.split('_').length >= 2 ? id.split('_')[1] : '';
    if (text && rowNum && id) {
        var toolTipData = createToolTipData(text, field, value, rowNum, id, processed);
        window.top.postMessage(toolTipData, '*');
    }
};

const isDraftAndNotTestable = (initialJson) => {
    if (
        isJsonString(initialJson) &&
        JSON.parse(initialJson).draft &&
        !JSON.parse(initialJson)?.isTestable
    ) {
        return true;
    }
    return false;
};

const onMouseIn = (e) => {
    onSecondNode = nodeInEdit;
    const cursor = !onSecondNode ? POINTER : DEFAULT;
    changePointer(e, cursor);
};

const onMouseOut = (e) => {
    onSecondNode = false;
    const cursor = !onSecondNode ? POINTER : DEFAULT;
    changePointer(e, cursor);
};

const nodeClicked = (e) => {
    if (nodeInEdit || onSecondNode) {
        onSecondNode = false;
        const cursor = !onSecondNode ? POINTER : DEFAULT;
        changePointer(e, cursor);
        return;
    }
    let initialJSON = getElement(INITIAL_JSON_DIV_ID)?.value;
    if (isDraftAndNotTestable(initialJSON)) {
        let id = e.target.id;
        id = id ? id.replace(SPAN, '') : '';
        id = id ? id.replace(TEXT_AREA, '') : '';
        if (!id) {
            return;
        }
        getElement('#' + id + SPAN).hidden = true;
        getElement('#' + id).style.cursor = 'text';
        const textarea = getElement('#' + id + TEXT_AREA);
        textarea.hidden = false;
        textarea.focus();
        resetCursor(textarea);
        let node = nodes.find((n) => n.id === id);
        let nodeType = id?.split('_')?.length >= 2 ? id.split('_')[0] : '';
        nodeType == CONDITION && getElement('#' + id + SPAN)?.textContent?.endsWith('...')
            ? (textarea.value = node.data.originalText)
            : '';
        nodeType == ACTION || node.activation_priority
            ? $(textarea).parent().addClass(TEXT_AREA_PARENT_PADDING_CLASS)
            : '';
        nodeInEdit = true;
    }
};

const changePointer = (e, cursor = null) => {
    let id = e.target.id;
    id = id ? id.replace(TEXT_AREA, '') : '';
    id = id ? id.replace(SPAN, '') : '';
    if (!id) {
        return;
    }
    let initialJSON = getElement(INITIAL_JSON_DIV_ID)?.value;
    let pointer = '';
    if (isDraftAndNotTestable(initialJSON)) {
        pointer = POINTER;
    }
    getElement('#' + id).style.cursor = cursor || pointer;
};

const onExit = (e) => {
    let id = e?.target?.id;
    id = id ? id.replace(TEXT_AREA, '') : '';
    id = id ? id.replace(SPAN, '') : '';
    if (!id) {
        return;
    }
    const topLevelAction = 'toplevel-action';
    let nodeID = id ? id.replace(TEXT_AREA, '') : '';
    let rowNum =
        nodeID && nodeID.split('_') && nodeID.split('_').length >= 2 ? nodeID.split('_')[1] : '';
    let nodeType =
        nodeID && nodeID.split('_') && nodeID.split('_').length >= 2 ? nodeID.split('_')[0] : '';
    const textAreaElement = getElement('#' + id + TEXT_AREA);
    let changedText = textAreaElement.value;
    let spanElement = getElement('#' + id + SPAN);
    changedText = changedText.trim();
    let node = nodes.find((n) => n.id === nodeID);
    nodeType == ACTION || node.activation_priority
        ? $(spanElement).parent().removeClass(TEXT_AREA_PARENT_PADDING_CLASS)
        : '';
    if (changedText.trim() && node && node.data && node.data.label != changedText) {
        spanElement.hidden = false;
        spanElement.textContent = changedText;
        spanElement.title = changedText;
        textAreaElement.hidden = true;
        changePointer(e);
        node.data.label = changedText;
        node.data.title = changedText;
        node.data.originalText = changedText;
        if (node && node.activation_priority) {
            const wrapTextCss = changedText.indexOf('\n') <= -1 ? '' : SECOND_ACTIONS;
            $(spanElement).removeClass(SECOND_ACTIONS);
            $(spanElement).addClass(wrapTextCss);
            const nodesTextObj = createNodeText(topLevelAction, node?.data?.id, id);
            nodesTextObj.nodesTextData.newText = changedText;
            let nodeText = JSON.stringify(nodesTextObj);
            window.top.postMessage(nodeText, '*');
        } else {
            // getting initial JSON for second chart
            const initialJsonElement = getElement(INITIAL_JSON_DIV_ID);
            let initialJSON = initialJsonElement.value;
            if (isJsonString(initialJSON)) {
                let message = JSON.parse(initialJSON);
                if (
                    nodeType &&
                    rowNum &&
                    message &&
                    message.assignmentData &&
                    message.assignmentData[rowNum]
                ) {
                    if (nodeType == CONDITION) {
                        createDiamondNode(
                            changedText,
                            spanElement,
                            message,
                            node,
                            nodeType,
                            id,
                            initialJsonElement,
                            rowNum
                        );
                    } else if (nodeType == ACTION) {
                        createActionNode(
                            changedText,
                            spanElement,
                            message,
                            node,
                            nodeType,
                            id,
                            initialJsonElement,
                            rowNum
                        );
                    }
                }
            }
        }
    } else {
        spanElement.hidden = false;
        textAreaElement.hidden = true;
        textAreaElement.value = node.data.label;
        resetCursor(textAreaElement);
        changePointer(e);
    }
    nodeInEdit = false;
};

const createNodeText = (nodeType, tableName, nodeID) => {
    return {
        nodesTextData: {
            nodeType: nodeType,
            tableName: tableName,
            nodeID: nodeID,
        },
    };
};

const createToolTipData = (text, field, value, rowNum, id, processed) => {
    return JSON.stringify({
        toolTipData: {
            text: text,
            field: field,
            value: value,
            rowNum: rowNum,
            nodeID: id,
            processed: processed,
        },
    });
};

const getElement = (selector) => {
    if (selector) {
        return document.querySelector(selector);
    }
    return null;
};

const createDiamondNode = (
    changedText,
    spanElement,
    message,
    node,
    nodeType,
    id,
    initialJsonElement,
    rowNum
) => {
    const diamondTextWrap = 'diamond-text-wrap';
    const wrapTextCss = changedText.indexOf('\n') > -1 ? '' : diamondTextWrap;
    const spanParent = $(spanElement)?.parent();
    if (spanParent) {
        spanParent.removeClass(diamondTextWrap);
        spanParent.addClass(wrapTextCss);
    }
    updateAssignmentData(message, changedText, rowNum);
    node.data.label = spanElement.textContent;
    const nodesTextObj = createNodeText(nodeType, message?.tabName, id);
    nodesTextObj.nodesTextData.csvData = message?.assignmentData;
    postMessage(nodesTextObj, initialJsonElement, message);
};

const createActionNode = (
    changedText,
    spanElement,
    message,
    node,
    nodeType,
    id,
    initialJsonElement,
    rowNum
) => {
    const wrapTextCss = changedText.indexOf('\n') <= -1 ? '' : SECOND_ACTIONS;
    let sectionName = node?.data?.sectionName;
    const spanElemObj = $(spanElement);
    if (spanElemObj) {
        spanElemObj.removeClass(SECOND_ACTIONS);
        spanElemObj.addClass(wrapTextCss);
    }
    updateAssignmentData(message, changedText, rowNum, sectionName);
    const nodesTextObj = createNodeText(nodeType, message?.tabName, id);
    nodesTextObj.nodesTextData.csvData = message?.assignmentData;
    nodesTextObj.nodesTextData.sectionName = sectionName;
    postMessage(nodesTextObj, initialJsonElement, message);
};

const updateAssignmentData = (message, changedText, rowNum, sectionName = null) => {
    const actionFlowLabel = '_action_flow_label';
    const undefined = 'undefined';
    let customFlowLabelField = sectionName ? sectionName.toLowerCase() + actionFlowLabel : null;
    message.assignmentData.forEach(function (row, index) {
        if (index == rowNum) {
            if (customFlowLabelField) {
                row[customFlowLabelField] = changedText;
            } else {
                row.condition_flow_label = changedText;
            }
        } else if (
            (customFlowLabelField && typeof row[customFlowLabelField] == undefined) ||
            (!customFlowLabelField && typeof row.condition_flow_label == undefined)
        ) {
            row.condition_flow_label = '';
        }
    });
};

const postMessage = (nodesTextObj, initialJsonElement, message) => {
    let nodeText = JSON.stringify(nodesTextObj);
    initialJsonElement.value = JSON.stringify(message);
    window.top.postMessage(nodeText, '*');
};

const resetCursor = (txtElement) => {
    const character = 'character';
    if (txtElement.setSelectionRange) {
        txtElement.focus();
        txtElement.setSelectionRange(0, 0);
    } else if (txtElement.createTextRange) {
        var range = txtElement.createTextRange();
        range.moveStart(character, 0);
        range.select();
    }
};

const getPointerFromJSON = () => {
    let initialJSON = getElement(INITIAL_JSON_DIV_ID)?.value;
    let pointer = '';
    if (isDraftAndNotTestable(initialJSON)) {
        pointer = POINTER;
    }
    return pointer;
};

const RectangleNode = ({ data, isConnectable, targetPosition = null, sourcePosition = null }) => {
    const pointer = getPointerFromJSON();
    const rectangleNodeText = 'rectangle-node-text';
    let nodeStyle = cloneDeep(data.style) || {};
    nodeStyle[CURSOR] = pointer;
    nodes = useStoreState((state) => state.nodes);
    const className = data.cssClass ? data.cssClass : rectangleNodeText;
    const value = data.label;
    return (
        <div
            id={data.id}
            onClick={nodeClicked}
            onMouseOver={onMouseIn}
            onMouseOut={onMouseOut}
            className="rectangle-node"
            style={nodeStyle}
        >
            {targetPosition ? (
                <Handle type="target" position={targetPosition} isConnectable={isConnectable} />
            ) : (
                ''
            )}

            <span
                id={data.id + '_span'}
                onMouseOver={onHoverStart}
                title={data.title}
                className={className}
            >
                {value}
            </span>
            <textarea
                id={data.id + '_textarea'}
                hidden="true"
                onBlur={onExit}
                className={'rectangle-node-textarea ' + className}
                style={data.style}
                defaultValue={value}
            ></textarea>
            <input type="hidden" id={data.id + '_processed'} value={false}></input>
            {sourcePosition ? (
                <Handle type="source" position={sourcePosition} isConnectable={isConnectable} />
            ) : (
                ''
            )}
        </div>
    );
};

const RectangleDetailNode = ({ data }) => {
    return (
        <div className="rectangle-detail-node">
            <Handle
                type="target"
                position="left"
                id={`${data.id}.left`}
                style={TARGET_HANDLE_STYLE}
            />
            <div
                id={data.id}
                className="rectangle-detail-node-text"
                onMouseOver={onHoverStart}
                style={{}}
            >
                {data.label}
            </div>
            <div id={data.id} className="rectangle-detail-node-detail">
                {data.label}
            </div>
            <Handle
                type="source"
                position="right"
                id={`${data.id}.right1`}
                style={SOURCE_HANDLE_STYLE}
            />
        </div>
    );
};

const CircleNode = ({ data }) => {
    return (
        <div className="circle-node">
            <Handle
                type="target"
                position="left"
                id={`${data.id}.left`}
                style={TARGET_HANDLE_STYLE}
            />
            <div id={data.id} onMouseOver={onHoverStart}>
                {data.label}
            </div>
            <Handle
                type="source"
                position="right"
                id={`${data.id}.right1`}
                style={SOURCE_HANDLE_STYLE}
            />
        </div>
    );
};

const DiamondNode = ({ data, isConnectable }) => {
    const pointer = getPointerFromJSON();
    const targetHandleStyle = {
        left: '1.5px',
        top: '-1.5px',
    };
    const sourceBottomHandleStyle = {
        left: '98.25%',
        bottom: '-0.5px',
    };
    const sourceRightHandleStyle = {
        top: '1.5px',
        right: '0.5px',
    };
    let nodeStyle = cloneDeep(data.style) || {};
    nodeStyle[CURSOR] = pointer;
    const className = data.cssClass ? data.cssClass : 'diamond-node-text';
    const value = data.label;
    return (
        <div
            id={data.id}
            onClick={nodeClicked}
            onMouseOver={onMouseIn}
            onMouseOut={onMouseOut}
            className="diamond-node"
            style={nodeStyle}
        >
            <Handle
                type="target"
                position="top"
                id={`${data.id}.top`}
                isConnectable={isConnectable}
                style={targetHandleStyle}
            />
            <div id={data.id} className={className}>
                <span id={data.id + '_span'} title={data.title} onMouseOver={onHoverStart}>
                    {value}
                </span>
                <textarea
                    id={data.id + '_textarea'}
                    hidden="true"
                    onBlur={onExit}
                    className="diamond-node-textarea"
                    rows="3"
                    cols="15"
                    defaultValue={value}
                ></textarea>
                <input type="hidden" id={data.id + '_processed'} value={false}></input>
            </div>
            <Handle
                type="source"
                position="bottom"
                id="a"
                isConnectable={isConnectable}
                style={sourceBottomHandleStyle}
            />

            <Handle
                type="source"
                position="right"
                id="b"
                isConnectable={isConnectable}
                style={sourceRightHandleStyle}
            />
        </div>
    );
};

export const nodeTypes = {
    circle: CircleNode,
    rectangle: memo(RectangleNode),
    rectangledetail: RectangleDetailNode,
    diamond: memo(DiamondNode),
};
