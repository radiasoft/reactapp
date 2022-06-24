import { Fragment, useEffect, useState } from "react";
import { Form, Modal, Button } from "react-bootstrap";
import { combineReducers, configureStore, createSlice } from "@reduxjs/toolkit";
import { bakeEnums, globalTypes } from "./types";
import { Provider, useStore, useSelector } from "react-redux";

import "./myapp.scss"

const globalModels = createSlice({
    name: 'models',
    initialState: {},
    reducers: {
        updateModel: (state, action) => {
            var nextState = {...state};
            var {name, model} = action.payload;
            nextState[name] = model;
            return nextState;
        }
    }
})

const selectorForModel = (modelName) => (state) => state.models[modelName] || {}
const selectorForModels = (state) => state.models || {}

const updateModelAction = (modelName, model) => globalModels.actions.updateModel({name: modelName, model});

const globalModelStore = configureStore({
    reducer: combineReducers({
        models: globalModels.reducer
    })
})

function createFormStateStore() {
    const formStates = createSlice({
        name: 'formStates',
        initialState: {},
        reducers: {
            /**
             * @param {*} state 
             * @param {{
             *  type: string,
             *  payload: { name: string, value: * }
             * }} action 
             * @returns 
             */
            updateFormState: (state, action) => {
                var nextState = {...state};
                var {name, value} = action.payload;
                nextState[name] = value;
                return nextState;
            }
        }
    })
    
    const rootReducer = combineReducers({
        formStates: formStates.reducer
    })
    
    // make sure selector is in context of 'rootReducer' including the name of the slice there
    const selectorForFormState = (name) => (state) => state.formStates[name] || {};
    
    const updateFormStateAction = (name, newFormState) => formStates.actions.updateFormState({ name, value: newFormState });
    
    const formStateStore = configureStore({
        reducer: rootReducer
    });

    return {
        store: formStateStore,
        selectorForFormState,
        updateFormStateAction
    }
}

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
    const {valid, value, touched, onChange, type, ...otherProps} = props;
    return type.componentFactory({
        valid,
        value,
        touched,
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
        //this.value = initialValue; // todo: eval
       // const tempInitialValue = (initialValue !== undefined && initialValue !== null) ? "" + initialValue : "";
        this.rawValue = (value !== undefined && value !== null) ? value : ""
        this.displayName = displayName;
        this.typeName = typeName;
        this.touched = touched;
        this.description = description;
        this.type = type;
        this.valid = valid;
    }

    onModelDataChanged({value, valid, touched}) {
        this.touched = touched;
        this.rawValue = value;
        this.valid = valid;
    };

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
const createFieldControllersForView = ({viewName, view, types, model}, formState) => {
    return mapProperties(model, (fieldName, fieldSchema) => {
        const [displayName, typeName, defaultValue, description] = fieldSchema;
        const type = types[typeName];
        return new FieldController({
            displayName,
            typeName,
            description,
            type
        },formState[fieldName])
    });
}

const SchemaView = (props) => {
    const {viewInfo: {view, viewName, model, modelName}, types, subviewName, formStateSelector, updateFormStateAction} = props;

    const store = useStore();
    const formState = useSelector(formStateSelector);

    const fieldControllers = createFieldControllersForView({
        viewName: viewName,
        view: view,
        types: types,
        model: model
    }, formState);
    
    const updateFieldValueInModel = (fieldName, value) => {
        const nextModel = {...formState};
        nextModel[fieldName] = value;
        const action = updateFormStateAction(nextModel)
        store.dispatch(action);
    }

    // TODO: rendering should not have side effects but is this considered a side effect since its just state?
    for(const [fieldName, fieldController] of Object.entries(fieldControllers)) {
        if(formState[fieldName] && fieldController.rawValue !== formState[fieldName].value) {
            fieldController.onModelDataChanged(formState[fieldName]);
        }
    }

    // build view binding inputs to field controllers purely
    const fieldElements = mapProperties(fieldControllers, (fieldName, fieldController) => {
        const onChange = (event) => {
            if(fieldController.onUIDataChanged(event)) {
                updateFieldValueInModel(fieldName, {
                    value: fieldController.rawValue,
                    valid: fieldController.valid,
                    touched: fieldController.touched
                })
            }
        }

        return (
            <Fragment key={fieldName}>
                <Form.Label className="sr-panel-view-input-title">{fieldController.displayName}</Form.Label>
                <FieldControllerInput
                    className="sr-panel-view-input"
                    key={fieldName} 
                    value={fieldController.rawValue}
                    valid={fieldController.valid}
                    touched={fieldController.touched}
                    onChange={onChange}
                    type={fieldController.type}/>
            </Fragment>
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
        <div className="sr-panel-view-action-buttons" {...otherProps}>
            {canSave && <Button onClick={onSave} variant="primary" className="sr-panel-view-action-button sr-panel-view-action-button-save">Save Changes</Button>}
            <Button onClick={onCancel} variant="secondary" className="sr-panel-view-action-button sr-panel-view-action-button-cancel">Cancel</Button>
        </div>
    )
}

const ViewPanel = (props) => {
    const {formStateStore, ...otherProps} = props;
    return (
        <Provider store={formStateStore}>
            <ViewPanelInner {...otherProps}>

            </ViewPanelInner>
        </Provider>
    )
}

const ViewPanelInner = (props) => {
    const { viewInfo, types, formStateSelector, updateFormStateAction, ...otherProps} = props;
    const passedProps = {
        viewInfo,
        types,
        formStateSelector,
        updateFormStateAction,
        ...otherProps
    };
    
    const [advancedModalShown, updateAdvancedModalShown] = useState(false);

    const store = useStore();
    const formState = useSelector(formStateSelector);

    // in here is where all of the checking for the form state in store and creation of save/cancel buttons will be
    // NOT IN SchemaView!!!
    // SchemaView is only for modifying the given 'store' using a form

    const isModelDirty = () => Object.entries(formState).map(([fieldName, {value, valid, touched}]) => touched).includes(true);
    const isModelValid = () => !Object.entries(formState).map(([fieldName, {value, valid, touched}]) => valid).includes(false);
    const clearFormState = () => {
        store.dispatch(updateFormStateAction(buildModelDefaultFormState(viewInfo.model, types))); // TODO: this does not work because the form initializes blindly, need better form init
    };
    const saveModel = () => {
        console.log("Congrats, you saved a model.");
        console.log(formState);
        clearFormState();
    }

    const buttonRoot = <Button variant="secondary" onClick={() => updateAdvancedModalShown(true)}>Open Advanced</Button>
    const actionButtons = <ViewPanelActionButtons canSave={isModelValid()} onSave={saveModel} onCancel={clearFormState}></ViewPanelActionButtons>
    const dirty = isModelDirty();

    return (
        <Panel title={viewInfo.view.title || viewInfo.viewName} buttons={[buttonRoot]}>
            <SchemaView key={viewInfo.viewName} subviewName={'basic'} {...passedProps}></SchemaView>
            <Modal show={advancedModalShown} onHide={() => updateAdvancedModalShown(false)}>
                <Modal.Header>
                    <Modal.Title>Advanced</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <SchemaView key={viewInfo.viewName} subviewName={'advanced'} {...passedProps}></SchemaView>
                </Modal.Body>
                {dirty && <Modal.Footer>
                    {actionButtons}
                </Modal.Footer>}
            </Modal>
            {dirty && actionButtons}
        </Panel>
    )
}

const Panel = (props) => {
    const {title, buttons, ...otherProps} = props;

    return (
        <div className="sr-panel" {...otherProps}>
            <div className="sr-panel-header">
                <div className="sr-panel-title">
                    {title}
                </div>
                <div className="sr-panel-buttons">
                    {buttons}
                </div>
            </div>
            <div className="sr-panel-body">
                {props.children}
            </div>
        </div>
    )
}

const buildModelDefaultFormState = (model, types) => mapProperties(model, (fieldName, [displayName, typeName, initialValue, description]) => {
    const hasInitialValue = initialValue !== undefined && initialValue !== null;
    const type = types[typeName];
    return {
        valid: hasInitialValue ? type.validate(initialValue) : false,
        value: hasInitialValue ? initialValue : "",
        touched: false
    }
})

const AppRoot = (props) => {
    return (
        <Provider store={globalModelStore}>
            <AppRootInner {...props}></AppRootInner>
        </Provider>
    )
}

const AppRootInner = (props) => {
    const [schema, updateSchema] = useState(undefined);

    const [{store: formStateStore, updateFormStateAction, selectorForFormState}, updateFormStateStore] = useState(() => createFormStateStore());

    const models = useSelector(selectorForModels);

    useBlockingEffect(() => {
        fetch(props.schemaPath).then(resp => resp.text().then(text => {
            const schema = JSON.parse(text);
            if(schema.model) {
                const types = bakeEnums(globalTypes, schema.enum);
                Object.entries(schema.model).forEach(([modelName, model]) => {
                    const initialFormState = buildModelDefaultFormState(model, types); // this is where model state would be used to initialize form values if that were possible in this example
                    formStateStore.dispatch(updateFormStateAction(modelName, initialFormState));
                })
            }
            updateSchema(schema);
        }))
    })

    var viewPanels = [];
    if(schema) {
        const types = bakeEnums(globalTypes, schema.enum);
        viewPanels = Object.entries(schema.view).map(([viewName, view]) => {
            var modelName = viewName;
            if(view.model) {
                modelName = view.model;
            }
            const model = schema.model[modelName];
            const viewInfo = {
                modelName,
                model,
                view,
                viewName
            }

            return (
                <ViewPanel 
                    formStateStore={formStateStore} 
                    updateFormStateAction={(nextState) => updateFormStateAction(modelName, nextState)}
                    formStateSelector={selectorForFormState(modelName)}
                    key={viewName} 
                    viewInfo={viewInfo} 
                    types={types}/>
            )
        })
    }

    return (
        <div className="sr-simulation-outer">
            {viewPanels}
        </div>
    )
}

export default AppRoot;