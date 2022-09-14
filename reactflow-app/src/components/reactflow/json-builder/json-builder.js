import _uniqueId from 'lodash/uniqueId';
import _forEach from 'lodash/forEach';

let priorityOrder = {};
const NEW_LINE = '\n';
const activationPriorityField = 'activation_priority';
const ASSIGN_OWNER = 'AssignOwner';
const CIRCLE_NODE = 'circle-node';
const START_1 = 'start-1';
const SECTIONS = 'sections';
const ACTION = 'action';
const TRUE = 'true';
const META_DATA = 'metaData';
const LABEL = 'label';
const FLOW_LABEL = 'flow_label';
const TITLE = 'title';
const SECOND_ACTIONS = 'second-actions';
const RECTANGLE_NODE_TEXT = 'rectangle-node-text';
const RECTANGLE = 'rectangle';
const NAME = 'name';
const TYPE = 'type';
const PREFIX = 'prefix';
const SUFFIX = 'suffix';
const ACTION_FLOW_LABEL = '_action_flow_label';
const CONDITION_FLOW_LABEL = 'condition_flow_label';
const RIGHT = 'right';
const TOP = 'top';
const SMOOTH_STEP = 'smoothstep';
const YES = 'Yes';

const getStartNode = () => {
    const input = 'input';
    const startFlow = 'Start Flow';
    return {
        id: START_1,
        className: CIRCLE_NODE,
        type: input,
        data: {
            label: startFlow
        }
    };
};

const getEndNode = () => {
    const end1 = 'end-1';
    const output = 'output';
    const endFlow = 'End Flow';
    return {
        id: end1,
        className: CIRCLE_NODE,
        type: output,
        data: {
            label: endFlow
        }
    };
};

const isSubTableNode = (node) => {
    if (!node || !node[SECTIONS]) {
        return false;
    }
    let isSubTable = false;
    const sectionType = 'section_type';
    const actionParameters = 'action_parameters';
    const subTable = 'SubTable';
    node[SECTIONS].forEach((section) => {
        if (isSubTable) {
            return;
        }
        isSubTable =
            section[sectionType]?.toLowerCase() == ACTION &&
            section[actionParameters] &&
            section[actionParameters][subTable]?.toLowerCase() == TRUE;
    });
    return isSubTable;
};

const constructNodes = (rawJson) => {
    if (!rawJson || !rawJson[META_DATA]) {
        return [];
    }

    let nodesData = [];
    let count = 0;
    const tableProperties = 'table_properties';
    rawJson[META_DATA].forEach((node) => {
        const subTableNode = isSubTableNode(node);
        node[LABEL] = generateHumanText(node[LABEL], '', node[LABEL]);
        let flowLabel =
            node[tableProperties] &&
                node[tableProperties][FLOW_LABEL]?.trim()
                ? node[tableProperties][FLOW_LABEL].trim()
                : '';
        node[LABEL] = flowLabel ? flowLabel : node[LABEL];
        node[TITLE] = node[TITLE] || node[LABEL];
        let cssClass =
            node[LABEL] && node[LABEL].indexOf('\n') > -1
                ? RECTANGLE_NODE_TEXT + ' ' + SECOND_ACTIONS
                : RECTANGLE_NODE_TEXT;
        let parsedNode = getFlowChartNode(node, subTableNode, {
            type: RECTANGLE,
            customCss: cssClass
        });
        parsedNode[activationPriorityField] = node[activationPriorityField];

        let j = count - 1;
        while (j >= 0 && nodesData[j][activationPriorityField] < node[activationPriorityField]) {
            nodesData[j + 1] = nodesData[j];
            j = j - 1;
        }
        nodesData[j + 1] = parsedNode;
        count++;
    });
    return nodesData;
};

const generatePriorityOrder = (nodesData) => {
    nodesData.forEach((node) => {
        const priority = '_' + node[activationPriorityField];
        priorityOrder[priority] = priorityOrder[priority] || [];
        priorityOrder[priority].push(node.id);
    });
};

const constructEdges = (nodesData) => {
    if (!nodesData) {
        return [];
    }

    const startNode = getStartNode();
    const endNode = getEndNode();

    let edgeNodes = [];

    priorityOrder = {};
    generatePriorityOrder(nodesData);

    let prevNodeIds = [startNode.id];
    _forEach(priorityOrder, function (value, priority) {
        value.forEach((to) => {
            prevNodeIds.forEach((from) => {
                edgeNodes.push(getFlowChartEdge(from, to));
            });
        });
        prevNodeIds = value;
    });

    prevNodeIds.forEach((from) => {
        edgeNodes.push(getFlowChartEdge(from, endNode.id));
    });

    return edgeNodes;
};

const getFlowChartNode = (
    node,
    subTable,
    props = {
        class: RECTANGLE
    }
) => {
    const background = 'background';
    const borderColor = 'borderColor';
    const chartId = 'chartId';
    const untitled = 'Untitled';
    const nodeMessage = 'Please provide label values in all the tabs';
    const classPrefixNode = '-node ';
    const classPrefixNodeText = '-node-text';
    const originalText = 'originalText';
    const backgroundColor = '#6297cb';
    let nodeStyle = {};
    nodeStyle[background] = subTable ? backgroundColor : '';
    nodeStyle[borderColor] = subTable ? backgroundColor : '';
    node[TITLE] = node[TITLE] || node[LABEL] || '';
    node[chartId] = node[chartId] || node[NAME];
    let nodeText = node[LABEL];
    nodeText = nodeText || node[NAME];
    node[TITLE] =
        nodeText == untitled ? nodeMessage : node[TITLE];

    return {
        id: node[chartId],
        type: props[TYPE] || '',
        className: props.class ? props.class + classPrefixNode + props.class + classPrefixNodeText : '',
        data: {
            label: nodeText,
            title: node[TITLE],
            style: nodeStyle,
            id: node[chartId],
            cssClass: props.customCss,
            sectionName: props.sectionName,
            originalText: node[originalText]
        },
        style: nodeStyle
    };
};

const getFlowChartEdge = (
    from,
    to,
    props = {
        type: 'customStepEdge',
        arrowHeadType: 'arrowClosed',
        label: ''
    }
) => {
    const arrowHeadType = 'arrowHeadType';
    const handler = 'handler';
    return {
        id: _uniqueId('e'),
        type: props[TYPE],
        arrowHeadType: props[arrowHeadType],
        source: from,
        target: to,
        label: props[LABEL] || '',
        sourceHandle: props[handler] || ''
    };
};

const getTextPrefixSuffix = (type, text = '', columnLabel = '', parent) => {
    const actionToHumanTextMapping = {
        queue: {
            prefix: 'Assign to ',
            suffix: ' Queue',
            pre_qualification: {
                prefix: 'member of ',
                suffix: ''
            }
        },
        group: {
            prefix: 'Assign to ',
            suffix: ' group'
        },
        role: {
            prefix: 'Assign to ',
            suffix: ' Role'
        },
        user: {
            prefix: 'Assign to ',
            suffix: ''
        },
        referencerecord: {
            prefix: 'Assign to owner of ',
            suffix: ''
        },
        assignmentmode: {
            prefix: '(',
            suffix: ')'
        },
        settings: {
            prefix: 'Compute ',
            suffix: ''
        },
        countries: {
            prefix: 'Normalize ',
            suffix: ''
        },
        statesandprovinces: {
            prefix: 'Normalize ',
            suffix: ''
        },
        regions: {
            prefix: 'Compute ',
            suffix: ''
        },
        segments: {
            prefix: 'Assign ',
            suffix: ''
        },
        territories: {
            prefix: 'Assign ',
            suffix: ''
        },
        owner: {
            prefix: 'Assign ',
            suffix: ''
        },
        duplicateprofiles: {
            prefix: 'Compute ',
            suffix: ''
        },
        leadprofiles: {
            prefix: 'Compute ',
            suffix: ''
        },
        masterassignment: {
            prefix: 'Compute ',
            suffix: ''
        },
        newstatus: {
            prefix: 'Status->',
            suffix: ''
        },
        newrating: {
            prefix: 'Rating->',
            suffix: ''
        },
        leadprofilesrequired: {
            prefix: 'set Lead Profile to->',
            suffix: ''
        },
        subtable: {
            prefix: 'Assign using subtable ',
            suffix: ''
        },
        updateobject: {
            prefix: 'Update Record',
            suffix: ''
        },
        convertlead: {
            prefix: 'Convert Records',
            suffix: ''
        },
        mergeobject: {
            prefix: 'Merge Records',
            suffix: ''
        },
        createobject: {
            prefix: 'Create Records',
            suffix: ''
        },
        deleteobject: {
            prefix: 'Delete Records',
            suffix: ''
        },
        assignteammember: {
            prefix: 'Assign Team Member',
            suffix: ''
        },
        assigntoterritory: {
            prefix: 'Assign To Territory',
            suffix: ''
        }
    };
    let preSuffix = {
        prefix: '',
        suffix: ''
    };
    const regex = /\s/g;
    type = type.toLowerCase();
    type = type.replace(regex, '');
    text = text.toLowerCase();
    text = text.replace(regex, '');
    let obj = actionToHumanTextMapping[type] || '';
    if (obj == '') {
        Object.entries(actionToHumanTextMapping).forEach(function (o) {
            let m = o && o.length > 0 ? o[0] : '';
            if (m) {
                obj =
                    type.includes(m) && !isNaN(parseInt(type.replace(m, '')))
                        ? actionToHumanTextMapping[m]
                        : obj;
            }
        });
    }
    preSuffix[PREFIX] += obj && obj != '' ? obj[PREFIX] : '';

    obj =
        actionToHumanTextMapping && actionToHumanTextMapping[type]
            ? actionToHumanTextMapping[type][text]
            : '';
    preSuffix[PREFIX] += obj && obj != '' ? obj[PREFIX] : '';
    const assignmentAction = [ASSIGN_OWNER];
    if (preSuffix[PREFIX] == '' && columnLabel && !assignmentAction.includes(parent)) {
        preSuffix[PREFIX] = columnLabel + '->';
    }
    obj = actionToHumanTextMapping[type] || '';
    preSuffix[SUFFIX] += obj && obj != '' ? obj[SUFFIX] : '';
    obj =
        actionToHumanTextMapping && actionToHumanTextMapping[type]
            ? actionToHumanTextMapping[type][text]
            : '';
    preSuffix[SUFFIX] += obj && obj != '' ? obj[SUFFIX] : '';
    return preSuffix;
};

const generateHumanText = (text, fullText, type = '', columnLabel = '', parent = '') => {
    const prefixSuffix = getTextPrefixSuffix(type, text, columnLabel, parent);
    fullText += fullText ? NEW_LINE : '';
    return fullText + prefixSuffix[PREFIX] + text + prefixSuffix[SUFFIX];
};

const generateHumanParentLabel = (type) => {
    const prefixSuffix = getTextPrefixSuffix(type);
    return prefixSuffix[PREFIX] ? prefixSuffix[PREFIX] : '';
};

const extractInfoFromMeta = (metaList, tabName) => {
    let actions = [];
    let actionParent = {};
    let parentLabelPrefix = {};
    let columnLabels = {};
    let actionNames = {};
    const actionName = 'action_name';
    const columns = 'columns';
    const ignoredActions = ['custom_action', CONDITION_FLOW_LABEL, 'flow_label'];
    metaList.forEach((meta) => {
        if (meta[NAME] == tabName) {
            meta[SECTIONS].forEach((row) => {
                if (!row[ACTION]) {
                    row[columns].forEach((col) => {
                        columnLabels[col[NAME]] = col[LABEL];
                    });
                    return;
                }
                row[columns].forEach((col) => {
                    // changed assigned 'action_name' to 'name'
                    actionParent[col[NAME]] = row[NAME];
                    actionNames[col[NAME]] = row[actionName];
                    parentLabelPrefix[row[NAME]] = generateHumanParentLabel(row[NAME]);
                    columnLabels[col[NAME]] = col[LABEL];
                    !ignoredActions.includes(col[NAME]) &&
                        col[NAME] != row[NAME].toLowerCase() + ACTION_FLOW_LABEL
                        ? actions.push(col[NAME])
                        : '';
                });
            });
        }
    });

    return {
        actions: actions,
        actionParents: actionParent,
        parentLabels: parentLabelPrefix,
        columnLabels: columnLabels,
        actionNames: actionNames
    };
};

const parseLabelAndToolTip = (row, parsedMeta) => {
    let actionNodeLabel = {};
    let actionNodeText = {};
    let actionNameForCondition = {};
    let actionTextIsCustom = {};
    let conditionNodeLabel = '';
    let conditionNodeText = '';
    const actionParents = 'actionParents';
    const actions = 'actions';
    const parentLabels = 'parentLabels';
    const falseString = 'false';
    Object.keys(row).map(function (key) {
        let value = row[key];

        const parent = parsedMeta[actionParents][key] || '';
        let customActionColumn = parent.toLowerCase() + ACTION_FLOW_LABEL;
        if (parsedMeta[actions].includes(key)) {
            actionNameForCondition[parent] = parsedMeta?.actionNames[key] == ASSIGN_OWNER ? 1 : 0;
            // action Node
            if (key !== CONDITION_FLOW_LABEL) {
                actionNodeLabel[parent] = actionNodeLabel[parent] || '';
                actionNodeLabel[parent] += actionNodeLabel[parent] && value ? NEW_LINE : '';

                actionNodeLabel[parent] = value
                    ? actionNodeLabel[parent] + key + ': ' + value
                    : actionNodeLabel[parent];
                actionNodeLabel[parent] = row[customActionColumn]
                    ? row[customActionColumn]
                    : actionNodeLabel[parent];
                actionTextIsCustom[parent] = row[customActionColumn] ? true : false;

                actionNodeText[parent] = actionNodeText[parent] || '';
                actionNodeText[parent] =
                    value && !actionNodeText[parent]
                        ? parsedMeta[parentLabels][parent]
                        : actionNodeText[parent];
                actionNodeText[parent] = value
                    ? generateHumanText(
                        value,
                        actionNodeText[parent],
                        key,
                        parsedMeta.columnLabels[key],
                        parent
                    )
                    : actionNodeText[parent];
                actionNodeText[parent] = row[customActionColumn]
                    ? row[customActionColumn]
                    : actionNodeText[parent];
            }
        } else if (key !== customActionColumn) {
            // condition node
            conditionNodeLabel += conditionNodeLabel && value ? NEW_LINE : '';
            conditionNodeLabel = value
                ? conditionNodeLabel + key + ': ' + value
                : conditionNodeLabel;
            conditionNodeLabel = row[CONDITION_FLOW_LABEL]
                ? row[CONDITION_FLOW_LABEL]
                : conditionNodeLabel;

            conditionNodeText += conditionNodeText && value ? NEW_LINE : '';
            let newValue =
                value &&
                    (value.trim() == TRUE ||
                        value.trim() == falseString ||
                        value == false ||
                        value == true)
                    ? parsedMeta.columnLabels[key]
                    : value;
            conditionNodeText = value
                ? conditionNodeText + newValue.replace(/\?/g, '') + '?'
                : conditionNodeText;
            conditionNodeText = row[CONDITION_FLOW_LABEL]
                ? row[CONDITION_FLOW_LABEL]
                : conditionNodeText;
        }
    });
    return [
        conditionNodeLabel,
        conditionNodeText,
        actionNodeLabel,
        actionNodeText,
        actionTextIsCustom,
        actionNameForCondition
    ];
};

const getConditionalNode = (conditionNodeLabel, conditionNodeText, nodesIds) => {
    let node = null;
    const otherwise = 'Otherwise';
    const diamondNodeText = 'diamond-node-text';
    const diamondTextWrap = ' diamond-text-wrap';
    const condition = 'condition_';
    const diamond = 'diamond';
    const nextAction = conditionNodeLabel && conditionNodeText;
    conditionNodeText = nextAction ? conditionNodeText : otherwise;
    // As ellipsis is not supported for multiline. Temp fix this needs to be updated

    let originalText = conditionNodeText.trim();

    const wrapTextCss =
        conditionNodeText.indexOf('\n') > -1
            ? diamondNodeText
            : diamondNodeText + diamondTextWrap;
    node = getFlowChartNode(
        {
            chartId: condition + nodesIds,
            label: conditionNodeText,
            title: conditionNodeLabel,
            originalText: originalText
        },
        false,
        {
            type: diamond,
            customCss: wrapTextCss
        }
    );
    node.sourcePosition = RIGHT;
    node.targetPosition = TOP;
    return node;
};

const getConditionalEdge = (prevNodeId, node) => {
    const no = 'No';
    let edge = null;
    let edgeLabel = node.targetPosition == TOP ? no : YES;
    edgeLabel = prevNodeId == START_1 ? '' : edgeLabel;
    edge = getFlowChartEdge(prevNodeId, node.id, {
        type: SMOOTH_STEP,
        arrowHeadType: 'arrowClosed',
        handler: 'a',
        label: edgeLabel
    });
    return edge;
};

const createActionNodes = (actionProps) => {
    let [
        actionNodeLabel,
        actionNodeText,
        nodesIds,
        parallelActions,
        assignmentChartNodes,
        prevActionNode,
        actionTextIsCustom,
        actionNameForCondition
    ] = actionProps;
    const none = '(none)';
    const left = 'left';
    _forEach(actionNodeLabel, function (label, parentAction) {
        let nodeText = actionNodeText[parentAction];
        const emptyAction =
            !nodeText || nodeText == NEW_LINE || nodeText.toLowerCase() == NEW_LINE + none;
        if (!emptyAction) {
            let customClass =
                actionNameForCondition[parentAction] == 1
                    ? RECTANGLE_NODE_TEXT
                    : RECTANGLE_NODE_TEXT + ' ' + SECOND_ACTIONS;
            customClass =
                actionTextIsCustom[parentAction] && nodeText.indexOf('\n') <= -1
                    ? RECTANGLE_NODE_TEXT
                    : customClass;
            customClass =
                actionTextIsCustom[parentAction] && nodeText.indexOf('\n') > -1
                    ? RECTANGLE_NODE_TEXT + ' ' + SECOND_ACTIONS
                    : customClass;
            const props = {
                type: RECTANGLE,
                customCss: customClass,
                sectionName: parentAction
            };

            let node = getFlowChartNode(
                {
                    chartId: 'action_' + nodesIds + '_' + parallelActions,
                    label: nodeText,
                    title: label
                },
                false,
                props
            );
            node.targetPosition = left;
            node.sourcePosition = RIGHT;
            assignmentChartNodes.push(node);

            let edgeLabel2 = parallelActions == 0 ? YES : '';
            let edgeProps = {
                type: SMOOTH_STEP,
                arrowHeadType: 'arrowClosed',
                label: edgeLabel2,
                handler: 'b'
            };
            let edge = getFlowChartEdge(prevActionNode.id, node.id, edgeProps);
            assignmentChartNodes.push(edge);
            prevActionNode = node;
            parallelActions++;
        }
    });
    return [
        actionNodeLabel,
        actionNodeText,
        nodesIds,
        parallelActions,
        assignmentChartNodes,
        prevActionNode
    ];
};

const constructAssignmentNodes = (rawJson) => {
    const assignmentData = 'assignmentData';
    const tabName = 'tabName';
    if (!rawJson[assignmentData]) {
        return [];
    } else if (!rawJson[tabName]) {
        return [];
    }

    const parsedMeta = extractInfoFromMeta(rawJson[META_DATA], rawJson[tabName]);
    let assignmentChartNodes = [];
    let prevNodeId = getStartNode().id;
    let nodesIds = 0;
    rawJson[assignmentData].forEach((row) => {
        let [
            conditionNodeLabel,
            conditionNodeText,
            actionNodeLabel,
            actionNodeText,
            actionTextIsCustom,
            actionNameForCondition
        ] = parseLabelAndToolTip(row, parsedMeta);
        let node = getConditionalNode(conditionNodeLabel, conditionNodeText, nodesIds);
        assignmentChartNodes.push(node);
        let edge = getConditionalEdge(prevNodeId, node);
        assignmentChartNodes.push(edge);
        prevNodeId = node.id;

        let parallelActions = 0;
        let prevActionNode = node;
        [
            actionNodeLabel,
            actionNodeText,
            nodesIds,
            parallelActions,
            assignmentChartNodes,
            prevActionNode
        ] = createActionNodes([
            actionNodeLabel,
            actionNodeText,
            nodesIds,
            parallelActions,
            assignmentChartNodes,
            prevActionNode,
            actionTextIsCustom,
            actionNameForCondition
        ]);
        prevActionNode.sourcePosition = null;
        if (parallelActions == 0) {
            const preEdge = assignmentChartNodes.pop();
            if (preEdge) {
                prevNodeId = preEdge.source;
                assignmentChartNodes.pop();
            }
        }
        nodesIds++;
    });
    let edgeProps = {
        type: SMOOTH_STEP,
        arrowHeadType: 'arrowClosed',
        handler: 'a'
    };
    let edge = getFlowChartEdge(prevNodeId, getEndNode().id, edgeProps);
    assignmentChartNodes.push(edge);
    return assignmentChartNodes;
};

export const convertRawJson = (rawJson, defaultChart = true) => {
    if (rawJson[0] && rawJson[0].id == getStartNode().id) {
        return rawJson;
    }
    if (defaultChart) {
        const nodesData = constructNodes(rawJson);
        const edgeNodes = constructEdges(nodesData);
        return [getStartNode(), ...nodesData, ...edgeNodes, getEndNode()];
    }
    const assignmentChartNodes = constructAssignmentNodes(rawJson);
    return [getStartNode(), ...assignmentChartNodes, getEndNode()];
};

export const isJsonString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};
