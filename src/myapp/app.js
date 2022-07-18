// import {React}
import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, Provider, useSelector, useStore } from "react-redux";
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
import Schema from './schema'

let formStateFromModel = (model, modelSchema) => mapProperties(modelSchema, (fieldName, { type }) => {
    const valid = type.validate(model[fieldName])
    return {
        valid: valid,
        value: valid ? model[fieldName] : "",
        touched: false,
    }
})

const ContextReduxFormActions = React.createContext();
const ContextReduxFormSelectors = React.createContext();
const ContextReduxModelActions = React.createContext();
const ContextReduxModelSelectors = React.createContext();

const ReduxFormActionsContextWrapper = new ContextWrapperComponentBuilder()
    .providingContext(ContextReduxFormActions, () => {
        return {
            updateFormState,
            updateFormFieldState
        }
    })

const ReduxFormSelectorsContextWrapper= new ContextWrapperComponentBuilder()
    .providingContext(ContextReduxFormSelectors, () => {
        return {
            selectFormState
        }
    })

const ReduxModelActionsContextWrapper = new ContextWrapperComponentBuilder()
    .providingContext(ContextReduxModelActions, () => {
        return {
            updateModel
        }
    })

const ReduxModelSelectorsContextWrapper = new ContextWrapperComponentBuilder()
    .providingContext(ContextReduxModelSelectors, () => {
        return {
            selectModel,
            selectModels
        }
    })

const RequiresIsLoadedBuilder = new ConditionalComponentBuilder()
    .usingSelector('isLoaded', () => selectIsLoaded)
    .usingConditional(({ isLoaded }) => isLoaded)

class DependencyService { // TODO
    constructor() {

    }
}

class FormController {
    constructor() {
        this.fields = [];
    }

    getModelNames = () => {
        return [...new Set(this.fields.map(({ modelName }) => modelName))];
    }

    fieldComparator = (toFind) => ({ modelName, fieldName }) => modelName == toFind.modelName 
    && fieldName == toFind.fieldName

    find = (toFind) => {
        return this.fields.find(
            this.fieldComparator(toFind)
        );
    }

    createField = (modelName, fieldName) => {
        let field = {
            modelName,
            fieldName
        }
        let existingFields = this.find(field).length;
        if(existingFields == 0) {
            this.fields.push(field);
            return field;
        }
        return existingFields[0];
    }

    hookFields = ({
        formSelectors: {
            selectFormState
        },
        formActions: {
            updateFormFieldState,
            updateFormState
        },
        modelSelectors: {
            selectModel,
            selectModels
        },
        modelActions: {
            updateModel
        }
    }) => {
        let makeModelSelector = ({ modelName }) => selectModel(modelName);
        let makeFormStateSelector = ({ modelName }) => selectFormState(modelName);

        let selectorFn = useSelector;
        let dispatchFn = useDispatch;

        let dispatch = dispatchFn();

        let hookedModels = Object.fromEntries(
            this.getModelNames().map(modelName => {
                return [
                    modelName,
                    {
                        model: selectorFn(makeModelSelector(modelName)),
                        formState: selectorFn(makeFormStateSelector(modelName)),
                        updateModel: (value) => dispatch(updateModel({ name: modelName, value }))
                    }
                ]
            })
        )

        let hookedFields = this.fields.map(({ modelName, fieldName }) => {
            let hookedModel = hookedModels[modelName];
            let { formState } = hookedModel;
            let { valid, value, touched } = formState[fieldName];
            return {
                modelName,
                fieldName,
                valid,
                value,
                touched,
                hookedModel,
                updateValue: (value) => dispatch(updateFormFieldState({
                    name: modelName,
                    field: fieldName,
                    value: {
                        value,
                        valid: true, // todo
                        touched: true
                    }
                }))
            }
        })

        return hookedFields;
    }

    useFormController = (selectorsAndActions) => {
        let hookedFields = this.hookFields(selectorsAndActions);
        let hookedFieldFor = toFind => hookedFields.find(this.fieldComparator(toFind));
        let isFormStateDirty = Object.values(hookedFields).map(({ touched }) => touched).includes(true);
        let isFormStateValid = !Object.values(hookedFields).map(({ valid }) => valid).includes(false); // TODO: check completeness

        return {
            hookedFieldFor,
            isFormStateDirty,
            isFormStateValid
        }
    }
}

// TODO: build this call from schema
const SchemaEditorPanel = ({ schema }) => ({ view, viewName }) => {
    let formController = new FormController();
    let mapDeps = (dep) => {
        let [modelName, fieldName] = dep.split('.').filter(s => s && s.length > 0);
        return {
            modelName,
            fieldName
        }
    }
    let fields = {
        advanced: view.config.advancedFields
        .map(mapDeps)
        .map(dep => formController.createField(dep)),

        basic: view.config.basicFields
        .map(mapDeps)
        .map(dep => formController.createField(dep))
    }

    let SchemaEditorPanelComponent = (props) => {
        let formActions = useContext(ContextReduxFormActions); // TODO: make these generic
        let formSelectors = useContext(ContextReduxFormSelectors);
        let modelActions = useContext(ContextReduxModelActions);
        let modelSelectors = useContext(ContextReduxModelSelectors);
        
        let instFormController = formController.useFormController({
            formActions,
            formSelectors,
            modelActions,
            modelSelectors
        })

        let onFieldUpdated = (fieldName, fieldState, event) => {
            let nextValue = event.target.value;
            if (fieldState.value != nextValue) {
                dispatch(updateFormFieldState({
                    name: modelName,
                    field: fieldName,
                    value: {
                        value: nextValue,
                        valid: modelSchema[fieldName].type.validate(nextValue),
                        touched: true
                    },
                }));
            }
        }
    
        let createFieldElementsForSubview = (subviewName) => {
            return (fields[subviewName] || []).map(fieldInfo => {
                let hookedField = instFormController.hookedFieldFor(fieldInfo)
                //let fieldState = formState[fieldName];
                //let modelField = modelSchema[fieldName];
                let schemaField = schema[fieldInfo.modelName][fieldName];
                const onChange = (event) => {
                    let nextValue = event.target.value;
                    if(hookedField.value != nextValue) {
                        hookedField.updateValue(nextValue);
                    }
                    //onFieldUpdated(fieldName, fieldState, event);
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

        let formProps = {
            submit: () => {
                console.log("Congrats, you saved a model:", formState);
                let m = {};
                for (let k in model) {
                    m[k] = formState[k] ? formState[k].value : model[k];
                }
                dispatch(updateModel({ name: modelName, value: m }));
                dispatch(updateFormState({ name: modelName, value: formStateFromModel(m, modelSchema) }));
            },
            cancel: () => {
                dispatch(updateFormState({ name: modelName, value: formStateFromModel(model, modelSchema) }));
            },
            showButtons: isModelDirty,
            formValid: isModelValid,
            mainChildren: createFieldElementsForSubview('basic'),
            modalChildren: createFieldElementsForSubview('advanced'),
            title: view.title || viewName,
            id: viewName
        }

        return (
            <EditorPanel {...formProps}>
            </EditorPanel>
        )
    }
    return SchemaEditorPanelComponent;
} 

const FormStateInitializer = ({ viewInfos }) => (child) => {
    let FormStateInitializerComponent = (props) => {
        let dispatch = useDispatch();
        let store = useStore();
        let models = selectModels(store.getState());
        let hasInit = useSetup(true, (finishInitFormState) => {
            for(const viewInfo of Object.values(viewInfos)) {
                dispatch(updateFormState({ name: viewInfo.modelName, value: formStateFromModel(models[viewInfo.modelName], viewInfo.modelSchema) }));
            }
            finishInitFormState();
        })
        let ChildComponent = child;
        return hasInit && <ChildComponent {...props}/>;
    }
    return FormStateInitializerComponent;
}

class AppViewBuilder{
    constructor (appInfo) { 
        this.components = {
            'editor': SchemaEditorPanel(appInfo)
        }
    }

    buildComponentForView = (viewInfo) => {
        return this.components[viewInfo.visual?.type || 'editor'](viewInfo);
    }
}

function buildAppComponentsRoot(schema) {
    let viewInfos = mapProperties(schema.views, (viewName, view) => {
        //const modelName = view.model || viewName;
        //const modelSchema = schema.models[modelName];
        return {
            //modelName,
            //modelSchema,
            view,
            viewName: viewName
        }
    })

    let viewBuilder = new AppViewBuilder({ schema });
    
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
        ReduxModelActionsContextWrapper.toComponent(
            ReduxModelSelectorsContextWrapper.toComponent(
                ReduxFormActionsContextWrapper.toComponent(
                    ReduxFormSelectorsContextWrapper.toComponent(
                        FormStateInitializer({ viewInfos })(
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
}


const AppRoot = (props) => {
    const [schema, updateSchema] = useState(undefined);
    const formStateStore = configureStore({
        reducer: {
            [modelsSlice.name]: modelsSlice.reducer,
            [formStatesSlice.name]: formStatesSlice.reducer,
        },
    });

    /*const hasSchema = useSetup(true,
        (finishInitSchema) => fetch(props.schemaPath).then(resp => resp.text().then(text => {
            updateSchema(JSON.parse(text));
            finishInitSchema();
        }))
    )*/

    const hasSchema = useSetup(true,
        (finishInitSchema) => {
            updateSchema(Schema);
            finishInitSchema();
        }
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

export default AppRoot;
