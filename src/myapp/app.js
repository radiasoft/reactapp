// import {React}
import { Fragment, useEffect, useRef, useState } from "react";
import { Button, Card, Col, Container, Form, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { configureStore } from "@reduxjs/toolkit";
import { Types } from "./types";
import { useDispatch, Provider, useSelector } from "react-redux";
import * as Icon from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    modelsSlice,
    selectModel,
    loadModelData,
    selectIsLoaded,
    updateModel,
    selectModels,
} from "./models";
import {
    formStatesSlice,
    selectFormState,
    updateFormState,
    updateFormFieldState,
} from "./formState";

import "./myapp.scss"

/**
 * Implements useEffect with the ability to block until the returned callback is called. Will run the
 * callback the first time it is encountered
 * @param {() => void} callback a callback to run if this hook is not blocked
 * @param {[*]} reqs list of reqs to pass to internal useEffect
 * @returns {() => void} a callback function that causes the component to re-render and run the callback
 */
const useBlockingEffect = (callback, reqs) => {
    const [lock, updateLock] = useState(false);
    useEffect(() => {
        if(!lock) {
            updateLock(true);
            callback();
        }
    }, [lock, ...(reqs || [])])
    return () => updateLock(false);
}

const useSetup = (shouldRun, callback) => {
    const [hasSetup, updateHasSetup] = useState(false);
    const [callbackStarted] = useState({value: false});
    useEffect(() => {
        if(shouldRun && !hasSetup && !callbackStarted.value) {
            callbackStarted.value = true;
            callback();
        }
    });
    const finish = () => {
        updateHasSetup(true);
    }
    return [hasSetup, finish];
}

const useRenderCount = (name) => {
    const renderCount = useRef(0);
    const domRenderCount = useRef(0);
    ++renderCount.current;
    useEffect(() => {
        ++domRenderCount.current;
        console.log(`DOM render ${name} ${domRenderCount.current} (${renderCount.current})`);
    })
    console.log(`Render ${name} ${(++renderCount.current)}`);
}

/**
 * Helper function to create an object of the same shape as the input by mapping property values to a new value
 * @param {{[name: string]: T}} obj
 * @param {(name: string, value: T) => *} mapFunc
 * @returns {T} An object with the same fields having mapFunc applied
 */
const mapProperties = (obj, mapFunc) => {
    return Object.fromEntries(
        Object.entries(obj).map(([propName, propValue]) => {
            return [propName, mapFunc(propName, propValue)]
        })
    )
}

function FieldControllerInput(props) {
    const {fieldController, onChange, ...otherProps} = props;
    return fieldController.type.componentFactory({
        valid: fieldController.valid,
        value: fieldController.rawValue,
        touched: fieldController.touched,
        onChange
    })(otherProps);
}

class FieldController {
    /**
     * @param { {
     *  displayName: string,
     *  typeName: string,
     *  description: string,
     *  type: *
     * } }
     */
    constructor({ displayName, typeName, description, type }, {value, valid, touched}) {
        this.rawValue = (value !== undefined && value !== null) ? value : ""
        this.displayName = displayName;
        this.typeName = typeName;
        this.touched = touched;
        this.description = description;
        this.type = type;
        this.valid = valid;
    }

    onUIDataChanged(event) {
        const nextValue = event.target.value;
        if(this.rawValue != nextValue) {
            this.rawValue = nextValue;
            this.touched = true;
            this.valid = this.type.validate(nextValue);
            return true;
        }
        return false;
    }
}

/**
 * @param {{
 *  viewName: string,
 *  view: { title: string?, basic: [string], advanced: [string] },
 *  types: {[typeName: string]: *},
 *  model: {[modelName: string]: {[fieldName:string]: [*]}}
 * }}
 * @returns {{ [fieldName: string]: FieldController }}
 */
const createFieldControllersForView = ({viewName, view, types, modelSchema}, formState) => {
    return mapProperties(modelSchema, (fieldName, fieldSchema) => {
        const [displayName, typeName, , description] = fieldSchema;
        return new FieldController({
            displayName,
            typeName,
            description,
            type: types.fieldTypeFromName(typeName),
        }, formState[fieldName]);
    });
}

const LabelTooltip = (props) => {
    const renderTooltip = (childProps) => (
        <Tooltip id="label-tooltip" {...childProps}>
            {props.text}
        </Tooltip>
    );
    return (
        <OverlayTrigger
            placement="bottom"
            delay={{ show: 250, hide: 400 }}
            overlay={renderTooltip}
        >
            <span> <FontAwesomeIcon icon={Icon.faInfoCircle} fixedWidth /></span>
        </OverlayTrigger>
    );
}

const createInputElementsForFieldControllers = (fieldControllers, onFieldUpdated) => {
    return Object.entries(fieldControllers).map(([fieldName, fieldController]) => {
        const onChange = (event) => {
            onFieldUpdated(fieldName, fieldController, event);
        }
        return (
            <Form.Group size="sm" as={Row} className="mb-2" key={fieldName}>
                <Form.Label column="sm" sm={5} className="text-end">
                    {fieldController.displayName}
                    {fieldController.description &&
                     <LabelTooltip text={fieldController.description} />
                    }
                </Form.Label>
                <FieldControllerInput
                    fieldController={fieldController}
                    onChange={onChange}
                />
            </Form.Group>
        )
    })
}

const EditorForm = (props) => {
    return (
        <Form>
            {props.children}
        </Form>
    );
}

const ViewPanelActionButtons = (props) => {
    const {canSave, onSave, onCancel, ...otherProps} = props;
    return (
        <Col className="text-center" sm={12}>
            <Button onClick={onSave} disabled={! canSave } variant="primary">Save Changes</Button>
            <Button onClick={onCancel} variant="light" className="ms-1">Cancel</Button>
        </Col>
    )
}

const EditorPanel = (props) => {
    useRenderCount("ViewPanel");
    const {viewInfo: {view, viewName, modelSchema, modelName}, types} = props;
    
    const formState = useSelector(selectFormState(modelName));
    const model = useSelector(selectModel(modelName));

    const dispatch = useDispatch();

    const [advancedModalShown, updateAdvancedModalShown] = useState(false);
    const [panelBodyShown, updatePanelBodyShown] = useState(true);


    const isModelDirty = () => Object.entries(formState).map(([fieldName, {value, valid, touched}]) => touched).includes(true);
    const isModelValid = () => !Object.entries(formState).map(([fieldName, {value, valid, touched}]) => valid).includes(false);
    const cancelChanges = () => {
        dispatch(updateFormState({ name: modelName, value: formStateFromModel(model, modelSchema, types) }));
        updateAdvancedModalShown(false);
    }
    const saveModel = () => {
        console.log("Congrats, you saved a model:", formState);
        const m = {};
        for (const k in model) {
            m[k] = formState[k] ? formState[k].value : model[k];
        }
        dispatch(updateModel({ name: modelName, value: m }));
        dispatch(updateFormState({ name: modelName, value: formStateFromModel(m, modelSchema, types) }));
        updateAdvancedModalShown(false);
    }

    const fieldControllers = createFieldControllersForView(
        {
            viewName,
            view,
            types,
            modelSchema,
        },
        useSelector(selectFormState(modelName)),
    );

    const headerButtons = (
        <Fragment>
            <a className="ms-2" onClick={() => updateAdvancedModalShown(true)}><FontAwesomeIcon icon={Icon.faPencil} fixedWidth /></a>
            <a className="ms-2" onClick={() => updatePanelBodyShown(! panelBodyShown)}><FontAwesomeIcon icon={panelBodyShown ? Icon.faChevronUp : Icon.faChevronDown} fixedWidth /></a>
        </Fragment>
    );
    const actionButtons = <ViewPanelActionButtons canSave={isModelValid()} onSave={saveModel} onCancel={cancelChanges}></ViewPanelActionButtons>
    const dirty = isModelDirty();

    const onFieldUpdated = (fieldName, fieldController, event) => {
        if (fieldController.onUIDataChanged(event)) {
            dispatch(updateFormFieldState({
                name: modelName,
                field: fieldName,
                value: {
                    value: fieldController.rawValue,
                    valid: fieldController.valid,
                    touched: fieldController.touched
                },
            }));
        }
    }

    const createFieldElementsForSubview = (subviewName) => createInputElementsForFieldControllers(Object.fromEntries((view[subviewName] || []).map(fieldName => [fieldName, fieldControllers[fieldName]])), onFieldUpdated);

    return (
        <Panel title={view.title || viewName} buttons={headerButtons} panelBodyShown={panelBodyShown}>
            <EditorForm key={viewName}>
                {createFieldElementsForSubview('basic')}
            </EditorForm>

            <Modal show={advancedModalShown} onHide={() => cancelChanges()} size="lg">
                <Modal.Header className="lead bg-info bg-opacity-25">
                    { view.title }
                </Modal.Header>
                <Modal.Body>
                    <EditorForm key={viewName}>
                        {createFieldElementsForSubview('advanced')}
                    </EditorForm>
                    {dirty &&
                     <Fragment>
                         {actionButtons}
                     </Fragment>
                    }
                </Modal.Body>
            </Modal>
            {dirty && actionButtons}
        </Panel>
    )
}

const Panel = (props) => {
    const {title, buttons, viewInfo, panelBodyShown, ...otherProps} = props;
    return (
        <Card>
            <Card.Header className="lead bg-info bg-opacity-25">
                {title}
                <div className="float-end">
                    {buttons}
                </div>
            </Card.Header>
            {panelBodyShown &&
             <Card.Body>
                 {props.children}
             </Card.Body>
            }
        </Card>
    );
}

const formStateFromModel = (model, modelSchema, types) => mapProperties(modelSchema, (fieldName, [ , typeName]) => {
    const type = types.fieldTypeFromName(typeName);
    const valid = type.validate(model[fieldName])
    return {
        valid: valid,
        value: valid ? model[fieldName] : "",
        touched: false,
    }
})

const AppRoot = (props) => {
    const [schema, updateSchema] = useState(undefined);
    const formStateStore = configureStore({
        reducer: {
            [modelsSlice.name]: modelsSlice.reducer,
            [formStatesSlice.name]: formStatesSlice.reducer,
        },
    });
    const [hasSchema, finishInitSchema] = useSetup(true,
        () => fetch(props.schemaPath).then(resp => resp.text().then(text => {
            updateSchema(JSON.parse(text));
            finishInitSchema();
        }))
    )
    return (hasSchema &&
        <Provider store={formStateStore}>
            <AppRootInner
                {...props}
                schema={schema}
            >
            </AppRootInner>
        </Provider>
    )
}

const AppRootInner = ({schema}) => {
    useRenderCount("AppRootInner");
    const isLoaded = useSelector(selectIsLoaded);
    const dispatch = useDispatch();
    const types = new Types(schema);

    const viewInfos = mapProperties(schema.view, (viewName, view) => {
        const modelName = view.model || viewName;
        const modelSchema = schema.model[modelName];
        return {
            modelName,
            modelSchema,
            view,
            viewName: viewName
        }
    })

    const models = useSelector(selectModels);

    // one time initialize form state for each view on model
    const [hasInitFormState, finishInitFormState] = useSetup(isLoaded, () => {
        for(const viewInfo of Object.values(viewInfos)) {
            dispatch(updateFormState({ name: viewInfo.modelName, value: formStateFromModel(models[viewInfo.modelName], viewInfo.modelSchema, types) }));
        }
        finishInitFormState();
    })
    
    if (isLoaded && hasInitFormState) {
        const viewPanels = Object.keys(viewInfos).map(viewName => {
            return (
                <Col md={6} className="mb-3" key={viewName}>
                    <EditorPanel
                        key={viewName}
                        viewInfo={viewInfos[viewName]}
                        types={types}
                    />
                </Col>
            )
        });
        return (
            <Container fluid className="mt-3">
                <Row>
                    {viewPanels}
                </Row>
            </Container>
        )
    }
    return (
        <Col className="mt-3 ms-3">
            <Button onClick={() => dispatch(loadModelData())}>Load Data</Button>
        </Col>
    )
}

export default AppRoot;
