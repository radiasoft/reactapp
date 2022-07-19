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



class FormController {
    constructor({ formActions, formSelectors }) {
        this.formActions = formActions;
        this.formSelectors = formSelectors;
        this.models = {};
        this.fields = [];
    }

    getModel = (modelName, dependency) => {
        let selectFn = useSelector;
        let dispatchFn = useDispatch;

        let dispatch = dispatchFn();

        let { selectFormState } = this.formSelectors;
        let { updateFormState } = this.formActions;

        if(!(modelName in this.models)) {
            let model = {
                dependency ,
                value: {...selectFn(selectFormState(modelName))}, // TODO evaluate this clone, it feels like its needed to be safe
                updateValue: (v) => dispatch(updateFormState(v))
            }
            this.models[modelName] = model;
        }
        return this.models[modelName];
    }

    getField = (dep) => {
        let dispatchFn = useDispatch;

        let dispatch = dispatchFn();

        let { fieldName, modelName } = dep;
        let { updateFormFieldState } = this.formActions;

        let findField = (modelName, fieldName) => {
            return this.fields.find((o) => {
                return o.modelName == modelName && o.fieldName == fieldName;
            })
        }

        var field = findField(modelName, fieldName);
        if(!field) {
            let model = this.getModel(modelName, dep.model);
            let currentValue = model.value[fieldName];
            field = {
                fieldName,
                modelName,
                model,
                value: currentValue,
                dependency: dep,
                updateValue: (v) => dispatch(updateFormFieldState({
                    name: modelName,
                    field: fieldName,
                    value: { // TODO, value should be defined as the param to the function??
                        value: v,
                        valid: dep.type.validate(v),
                        touched: true,
                        active: currentValue.active
                    }
                })),
                updateActive: (a) => dispatch(updateFormFieldState({
                    name: modelName,
                    field: fieldName,
                    value: { // TODO, value should be defined as the param to the function??
                        ...currentValue,
                        active: a
                    }
                }))
            }
            this.fields.push(field);
        }
        return field;
    }

    hookField = (fieldModelDep) => {
        return this.getField(fieldModelDep);
    }

    submitChanges = () => {
        Object.entries(this.models).forEach(([modelName, model]) => {
            let changesObj = model.value;

            let nextModelValue = {...model.dependency.value};
            Object.assign(nextModelValue, changesObj);

            model.dependency.updateValue(nextModelValue);
            // this should make sure that if any part of the reducers are inconsistent / cause mutations
            // then the form state should remain consistent with saved model copy
            model.updateValue(model.dependency.value); 
        })
    }

    cancelChanges = () => {
        Object.entries(this.models).forEach(([modelName, model]) => {
            model.updateValue(model.dependency.value); 
        })
    }

    isFormStateDirty = () => Object.values(this.fields).map(({ value: { active, touched } }) => active && touched).includes(true);
    isFormStateValid = () => !Object.values(this.fields).map(({ value: { active, valid } }) => !active || valid).includes(false); // TODO: check completeness (missing defined variables?)
}

class DependencyCollector {
    constructor({ modelActions, modelSelectors, schema }) {
        this.models = {};
        this.modelActions = modelActions;
        this.modelSelectors = modelSelectors;
        this.schema = schema
    }

    getModel = (modelName) => {
        let selectFn = useSelector;
        let dispatchFn = useDispatch;

        let dispatch = dispatchFn();

        let { updateModel } = this.modelActions;
        let { selectModel } = this.modelSelectors;

        if (!(modelName in this.models)) {
            let model = {
                schema: this.schema.models[modelName],
                value: {...selectFn(selectModel(modelName))}, // TODO evaluate this clone, it feels like its needed to be safe
                updateValue: (v) => dispatch(updateModel(v))
            }
            this.models[modelName] = model;
        }

        return this.models[modelName];
    }

    hookModelDependency = (depString) => {
        let mapDep = (dep) => {
            let [modelName, fieldName] = dep.split('.').filter(s => s && s.length > 0);
            return {
                modelName,
                fieldName
            }
        }
    
        let { modelName, fieldName } = mapDep(depString);
    
        let model = this.getModel(modelName);
        let fieldSchema = model.schema[fieldName];

        return {
            modelName,
            fieldName,
            model,
            displayName: fieldSchema.name,
            type: fieldSchema.type,
            defaultValue: fieldSchema.defaultValue,
            description: fieldSchema.description,
            value: model.value[fieldName]
        }
    }
}

// TODO: build this call from schema
const SchemaEditorPanel = ({ schema }) => ({ view, viewName }) => {
    let SchemaEditorPanelComponent = (props) => {
        let formActions = useContext(ContextReduxFormActions); // TODO: make these generic
        let formSelectors = useContext(ContextReduxFormSelectors);
        let modelActions = useContext(ContextReduxModelActions);
        let modelSelectors = useContext(ContextReduxModelSelectors);

        let depCollector = new DependencyCollector({ modelActions, modelSelectors, schema });
        let formController = new FormController({ formActions, formSelectors });

        let collectModelField = (depStr) => depCollector.hookModelDependency(depStr);
        let hookFormField = (dep) => formController.hookField(dep);

        let configFields = {
            basic: view.config.basicFields,
            advanced: view.config.advancedFields
        }

        let modelFields = mapProperties(configFields, (subviewName, depStrs) => depStrs.map(collectModelField));
        let formFields = mapProperties(modelFields, (subviewName, deps) => deps.map(hookFormField));
    
        let createFieldElementsForSubview = (subviewName) => {
            return (formFields[subviewName] || []).map(field => {
                const onChange = (event) => {
                    let nextValue = event.target.value;
                    if(field.value.value != nextValue) { // TODO fix field.value.value naming
                        field.updateValue(nextValue);
                    }
                }
                let InputComponent = field.type.component;
                return (
                    <FormField label={field.displayName} tooltip={field.description} key={field.fieldName}>
                        <InputComponent
                            valid={field.value.valid}
                            touched={field.value.touched}
                            value={field.value.value}
                            onChange={onChange}
                        />
                    </FormField>
                )
            })
        }

        let formProps = {
            submit: formController.submitChanges,
            cancel: formController.cancelChanges,
            showButtons: formController.isFormStateDirty,
            formValid: formController.isFormStateValid,
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
