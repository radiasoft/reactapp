// import {React}
import { Fragment, useEffect, useState } from "react";
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

const SchemaView = (props) => {
    const {viewInfo: {view, viewName, modelSchema, modelName}, types, subviewName} = props;
    const fieldControllers = createFieldControllersForView(
        {
            viewName,
            view,
            types,
            modelSchema,
        },
        useSelector(selectFormState(modelName)),
    );
    const dispatch = useDispatch();
    // build view binding inputs to field controllers purely
    const fieldElements = mapProperties(fieldControllers, (fieldName, fieldController) => {
        const onChange = (event) => {
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
    const inputElementsOfSubview = (subview) => subview.map(fieldName => fieldElements[fieldName]);
    const subview = view[subviewName];
    const childRoot = (
        <>
            {subview && inputElementsOfSubview(subview)}
        </>
    )
    return (
        <Form key={viewName}>
            {childRoot}
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

const ViewPanel = (props) => {
    const {viewName, schema} = props;
    const view = schema.view[viewName];
    const modelName = view.model || viewName;
    const modelSchema = schema.model[modelName];
    const viewInfo = {
        modelName,
        modelSchema,
        view,
        viewName: viewName
    }
    const types = new Types(schema);
    const dispatch = useDispatch();
    const model = useSelector(selectModel(viewInfo.modelName));
    useEffect(() => {
        dispatch(updateFormState({ name: modelName, value: formStateFromModel(model, modelSchema, types) }));
    }, []);
    const formState = useSelector(selectFormState(viewInfo.modelName));
    return (formState &&
        <ViewPanelInner
            {...props}
            types={types}
            viewInfo={viewInfo}
        >
        </ViewPanelInner>
    )
}

const ViewPanelInner = (props) => {
    const { viewInfo, types } = props;
    const [advancedModalShown, updateAdvancedModalShown] = useState(false);
    const [panelBodyShown, updatePanelBodyShown] = useState(true);
    const dispatch = useDispatch();
    const formState = useSelector(selectFormState(viewInfo.modelName));
    const model = useSelector(selectModel(viewInfo.modelName));

    // in here is where all of the checking for the form state in store and creation of save/cancel buttons will be
    // NOT IN SchemaView!!!
    // SchemaView is only for modifying the given 'store' using a form

    const isModelDirty = () => Object.entries(formState).map(([fieldName, {value, valid, touched}]) => touched).includes(true);
    const isModelValid = () => !Object.entries(formState).map(([fieldName, {value, valid, touched}]) => valid).includes(false);
    const cancelChanges = () => {
        dispatch(updateFormState({ name: viewInfo.modelName, value: formStateFromModel(model, viewInfo.modelSchema, types) }));
        updateAdvancedModalShown(false);
    }
    const saveModel = () => {
        console.log("Congrats, you saved a model:", formState);
        const m = {};
        for (const k in model) {
            m[k] = formState[k] ? formState[k].value : model[k];
        }
        dispatch(updateModel({ name: viewInfo.modelName, value: m }));
        dispatch(updateFormState({ name: viewInfo.modelName, value: formStateFromModel(m, viewInfo.modelSchema, types) }));
        updateAdvancedModalShown(false);
    }

    const headerButtons = (
        <Fragment>
            <a className="ms-2" onClick={() => updateAdvancedModalShown(true)}><FontAwesomeIcon icon={Icon.faPencil} fixedWidth /></a>
            <a className="ms-2" onClick={() => updatePanelBodyShown(! panelBodyShown)}><FontAwesomeIcon icon={panelBodyShown ? Icon.faChevronUp : Icon.faChevronDown} fixedWidth /></a>
        </Fragment>
    );
    const actionButtons = <ViewPanelActionButtons canSave={isModelValid()} onSave={saveModel} onCancel={cancelChanges}></ViewPanelActionButtons>
    const dirty = isModelDirty();
    return (
        <Panel title={viewInfo.view.title || viewInfo.viewName} buttons={headerButtons} viewInfo={viewInfo} panelBodyShown={panelBodyShown}>
            <SchemaView key={viewInfo.viewName} subviewName={'basic'} {...props}></SchemaView>

            <Modal show={advancedModalShown} onHide={() => cancelChanges()} size="lg">
                <Modal.Header className="lead bg-info bg-opacity-25">
                    { viewInfo.view.title }
                </Modal.Header>
                <Modal.Body>
                    <SchemaView key={viewInfo.viewName} subviewName={'advanced'} {...props}></SchemaView>
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
    useBlockingEffect(() => {
        fetch(props.schemaPath).then(resp => resp.text().then(text => {
            updateSchema(JSON.parse(text));
        }))
    })
    return (schema &&
        <Provider store={formStateStore}>
            <AppRootInner
                {...props}
                schema={schema}
            >
            </AppRootInner>
        </Provider>
    )
}

const AppRootInner = (props) => {
    const {schema} = props;
    const isLoaded = useSelector(selectIsLoaded);
    const dispatch = useDispatch();
    let viewPanels = [];
    if (schema) {
        if (isLoaded) {
            viewPanels = Object.keys(schema.view).map(viewName => {
                return (
                    <Col md={6} className="mb-3" key={viewName}>
                        <ViewPanel
                            key={viewName}
                            schema={schema}
                            viewName={viewName}
                        />
                    </Col>
                )
            });
        }
        else {
            return (
                <Col className="mt-3 ms-3">
                    <Button onClick={() => dispatch(loadModelData())}>Load Data</Button>
                </Col>
            )
        }
    }
    return (
        <Container fluid className="mt-3">
            <Row>
                {viewPanels}
            </Row>
        </Container>
    )
}

export default AppRoot;
