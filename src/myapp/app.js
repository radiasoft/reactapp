// import {React}
import React, { Fragment, useContext, useState } from "react";
import { Button, Card, Col, Container, Form, Modal, Row } from "react-bootstrap";
import { configureStore } from "@reduxjs/toolkit";
import { enumTypeOf, globalTypes } from "../types";
import { useDispatch, Provider, useSelector } from "react-redux";
import * as Icon from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSetup } from "../hooks";
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
import { mapProperties } from '../helper'
import { FormField } from "../components/form";

import "./myapp.scss"

function FieldControllerInput(props) {
    let {type, fieldState: {value, valid, touched}, onChange, ...otherProps} = props;
    return type.componentFactory({
        valid,
        value,
        touched,
        onChange
    })(otherProps);
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

function EditorPanel2(props) {
    let {
        viewInfo: {
            view, 
            viewName,
            modelSchema,
            modelName
        },
        types,
        formState,
        model,
        
    } = props;
};

const EditorPanel = (props) => {
    //useRenderCount("ViewPanel");
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

    const modelFields = mapProperties(modelSchema, (fieldName, fieldSchema) => {
        let [displayName, typeName, defaultValue, description] = fieldSchema;
        let type = types[typeName];
        return {
            displayName,
            typeName,
            defaultValue,
            description,
            type
        }
    });

    const headerButtons = (
        <Fragment>
            <a className="ms-2" onClick={() => updateAdvancedModalShown(true)}><FontAwesomeIcon icon={Icon.faPencil} fixedWidth /></a>
            <a className="ms-2" onClick={() => updatePanelBodyShown(! panelBodyShown)}><FontAwesomeIcon icon={panelBodyShown ? Icon.faChevronUp : Icon.faChevronDown} fixedWidth /></a>
        </Fragment>
    );
    const actionButtons = <ViewPanelActionButtons canSave={isModelValid()} onSave={saveModel} onCancel={cancelChanges}></ViewPanelActionButtons>
    const dirty = isModelDirty();

    const onFieldUpdated = (fieldName, fieldState, event) => {
        let nextValue = event.target.value;
        if (fieldState.value != nextValue) {
            dispatch(updateFormFieldState({
                name: modelName,
                field: fieldName,
                value: {
                    value: nextValue,
                    valid: modelFields[fieldName].type.validate(nextValue),
                    touched: true
                },
            }));
        }
    }

    const createFieldElementsForSubview = (subviewName) => {
        return (view[subviewName] || []).map(fieldName => {
            let fieldState = formState[fieldName];
            let modelField = modelFields[fieldName];
            const onChange = (event) => {
                onFieldUpdated(fieldName, fieldState, event);
            }
            return (
                <FormField label={modelField.displayName} tooltip={modelField.description} key={fieldName}>
                    <FieldControllerInput
                        fieldState={fieldState}
                        type={modelField.type}
                        onChange={onChange}
                    />
                </FormField>
            )
        })
    }

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
    const type = types[typeName];
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
    //useRenderCount("AppRootInner");
    const isLoaded = useSelector(selectIsLoaded);
    const dispatch = useDispatch();
    const schemaTypes = mapProperties(schema.enum, (enumName, enumSchema) => {
        return enumTypeOf(
            enumSchema.map(v => {
                const [value, displayName] = v;
                return {
                    value,
                    displayName
                }
            })
        );
    });
    const types = {
        ...globalTypes,
        ...schemaTypes
    }

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
