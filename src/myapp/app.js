// import {React}
import React, { useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { configureStore } from "@reduxjs/toolkit";
import { enumTypeOf, globalTypes } from "../types";
import { useDispatch, Provider, useSelector } from "react-redux";
import { useSetup } from "../hooks";
import {
    modelsSlice,
    selectModel,
    loadModelData,
    selectIsLoaded,
    updateModel,
    selectModels,
} from "./models";
import { mapProperties } from '../helper'
import { FormField } from "../components/form";

import {
    selectFormState,
    updateFormState,
    updateFormFieldState,
    formStatesSlice
} from './formState'

import "./myapp.scss"
import { ComponentBuilder, ConditionalComponentBuilder, ContextWrapperComponentBuilder, InitializerComponentBuilder } from "../components/builder";
import { EditorPanel } from "../components/panel";
import { ViewGrid } from "../components/simulation";

let formStateFromModel = (model, modelSchema, types) => mapProperties(modelSchema, (fieldName, [ , typeName]) => {
    const type = types[typeName];
    const valid = type.validate(model[fieldName])
    return {
        valid: valid,
        value: valid ? model[fieldName] : "",
        touched: false,
    }
})

const ContextTypes = React.createContext();
const ContextReduxFormActions = React.createContext();
const ContextReduxFormSelectors = React.createContext();
const ContextReduxModelActions = React.createContext();
const ContextReduxModelSelectors = React.createContext();

const ReduxFormActionsContextWrapperBuilder = new ContextWrapperComponentBuilder()
    .providingContext(ContextReduxFormActions, () => {
        return {
            updateFormState,
            updateFormFieldState
        }
    })

const ReduxFormSelectorsContextWrapperBuilder = new ContextWrapperComponentBuilder()
    .providingContext(ContextReduxFormSelectors, () => {
        return {
            selectFormState
        }
    })

const ReduxModelActionsContextWrapperBuilder = new ContextWrapperComponentBuilder()
    .providingContext(ContextReduxModelActions, () => {
        return {
            updateModel
        }
    })

const ReduxModelSelectorsContextWrapperBuilder = new ContextWrapperComponentBuilder()
    .providingContext(ContextReduxModelSelectors, () => {
        return {
            selectModel,
            selectModels
        }
    })

const RequiresIsLoadedBuilder = new ConditionalComponentBuilder()
    .usingSelector('isLoaded', () => selectIsLoaded)
    .usingConditional(({ isLoaded }) => isLoaded)


// TODO: build this call from schema
const SchemaEditorPanel = (schema) => ({ modelName, modelSchema, view, viewName }) => {
    return new ComponentBuilder()
    .usingDispatch('dispatch')
    .usingContext('types', () => ContextTypes)
    .usingContext('formActions', () => ContextReduxFormActions)
    .usingContext('formSelectors', () => ContextReduxFormSelectors)
    .usingContext('modelActions', () => ContextReduxModelActions)
    .usingContext('modelSelectors', () => ContextReduxModelSelectors)
    .usingSelector('model', ({ modelSelectors: { selectModel } }) => selectModel(modelName))
    .usingSelector('formState', ({ formSelectors: { selectFormState } }) => {
        selectFormState(modelName)
    })
    .usingValues(({ formActions: { updateFormState, updateFormFieldState }, modelActions: { updateModel }, dispatch, formState, model, types }) => {
        let isModelDirty = Object.entries(formState).map(([fieldName, {value, valid, touched}]) => touched).includes(true);
        let isModelValid = !Object.entries(formState).map(([fieldName, {value, valid, touched}]) => valid).includes(false); // TODO: check completeness

        let modelFields = mapProperties(modelSchema, (fieldName, fieldSchema) => {
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

        let onFieldUpdated = (fieldName, fieldState, event) => {
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
    
        let createFieldElementsForSubview = (subviewName) => {
            return (view[subviewName] || []).map(fieldName => {
                let fieldState = formState[fieldName];
                let modelField = modelFields[fieldName];
                const onChange = (event) => {
                    onFieldUpdated(fieldName, fieldState, event);
                }
                let InputComponent = modelField.type.component;
                return (
                    <FormField label={modelField.displayName} tooltip={modelField.description} key={fieldName}>
                        <InputComponent
                            valid={fieldState.valid}
                            touched={fieldState.touched}
                            value={fieldState.value}
                            onChange={onChange}
                        />
                    </FormField>
                )
            })
        }

        return {
            submit: () => {
                console.log("Congrats, you saved a model:", formState);
                let m = {};
                for (let k in model) {
                    m[k] = formState[k] ? formState[k].value : model[k];
                }
                dispatch(updateModel({ name: modelName, value: m }));
                dispatch(updateFormState({ name: modelName, value: formStateFromModel(m, modelSchema, types) }));
            },
            cancel: () => {
                dispatch(updateFormState({ name: modelName, value: formStateFromModel(model, modelSchema, types) }));
            },
            showButtons: isModelDirty,
            formValid: isModelValid,
            mainChildren: createFieldElementsForSubview('basic'),
            modalChildren: createFieldElementsForSubview('advanced'),
            title: view.title || viewName,
            id: viewName
        }
    })
    .toComponent(EditorPanel)
} 

/*const SchemaInitializerBuilder = new InitializerComponentBuilder()
    .usingValueInitializer('schema', ({ schemaPath }, finishInitSchema) => fetch(schemaPath).then(resp => resp.text().then(text => {
        finishInitSchema(JSON.parse(text));
    })))*/

const FormStateInitializerBuilder = new InitializerComponentBuilder()
    .usingDispatch('dispatch')
    .usingSelector('models', () => selectModels)
    .usingContext('types', () => ContextTypes)
    .usingVoidInitializer(({ dispatch, models, types, viewInfos, updateFormState }, finishInitFormState) => {
        for(const viewInfo of Object.values(viewInfos)) {
            dispatch(updateFormState({ name: viewInfo.modelName, value: formStateFromModel(models[viewInfo.modelName], viewInfo.modelSchema, types) }));
        }
        finishInitFormState();
    })



class AppViewBuilder{
    constructor (schema) { 
        this.components = {
            'editor': SchemaEditorPanel(schema)
        }
    }

    buildComponentForView = (viewInfo) => {
        return this.components[viewInfo.report || 'editor'](viewInfo);
    }
}

function buildAppComponentsRoot(schema) {
    let viewInfos = mapProperties(schema.view, (viewName, view) => {
        const modelName = view.model || viewName;
        const modelSchema = schema.model[modelName];
        return {
            modelName,
            modelSchema,
            view,
            viewName: viewName
        }
    })

    const TypesContextWrapperBuilder = new ContextWrapperComponentBuilder()
    .providingContext(ContextTypes, () => {
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
        return types;
    })

    let viewBuilder = new AppViewBuilder(schema);
    
    let viewComponents = mapProperties(viewInfos, (viewName, viewInfo) => viewBuilder.buildComponentForView(viewInfo));

    return RequiresIsLoadedBuilder.usingDispatch('dispatch').elseComponent(
        ({dispatch}) => {
            return (
                <Col className="mt-3 ms-3">
                    <Button onClick={() => dispatch(loadModelData())}>Load Data</Button>
                </Col>
            )
        }
    ).toComponent(
        ReduxModelActionsContextWrapperBuilder.toComponent(
            ReduxModelSelectorsContextWrapperBuilder.toComponent(
                ReduxFormActionsContextWrapperBuilder.toComponent(
                    ReduxFormSelectorsContextWrapperBuilder.toComponent(
                        TypesContextWrapperBuilder.toComponent(
                            FormStateInitializerBuilder.toComponent(
                                () => {
                                    return (
                                        <ViewGrid views={Object.values(viewComponents)}>
                                        </ViewGrid>
                                    )
                                }
                            )
                        )
                    )
                )
            )
        )
    )
}


const AppRoot = (props) => {
    const [schema, updateSchema] = useState(undefined);
    const formStateStore = configureStore({
        reducer: {
            [modelsSlice.name]: modelsSlice.reducer,
            [formStatesSlice.name]: formStatesSlice.reducer,
        },
    });
    const hasSchema = useSetup(true,
        (finishInitSchema) => fetch(props.schemaPath).then(resp => resp.text().then(text => {
            updateSchema(JSON.parse(text));
            finishInitSchema();
        }))
    )

    if(hasSchema) {
        let AppChild = buildAppComponentsRoot(schema);
        return (
            <Provider store={formStateStore}>
                <AppChild></AppChild>
            </Provider>
        )
    }
}

const AppRootInner = ({schema}) => {
    //useRenderCount("AppRootInner");
    //const isLoaded = useSelector(selectIsLoaded);
    //const dispatch = useDispatch();

    //const models = useSelector(selectModels);

    // one time initialize form state for each view on model
    /*const hasInitFormState = useSetup(isLoaded, (finishInitFormState) => {
        for(const viewInfo of Object.values(viewInfos)) {
            dispatch(updateFormState({ name: viewInfo.modelName, value: formStateFromModel(models[viewInfo.modelName], viewInfo.modelSchema, types) }));
        }
        finishInitFormState();
    })*/
    
    /*if (isLoaded && hasInitFormState) {
        const viewPanels = Object.keys(viewInfos).map(viewName => {
            return (
                <Col md={6} className="mb-3" key={viewName}>
                    <AppEditorPanel
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
    )*/
}

export default AppRoot;
