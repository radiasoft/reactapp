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
        /**
         * @param {*} state 
         * @param {{
         *  type: string,
         *  payload: { name: string, value: * }
         * }} action 
         * @returns 
         */
        updateModel: (state, action) => {
            var nextState = {...state};
            var {name, value} = action.payload;
            nextState[name] = value;
            return nextState;
        },
        /**
         * @param {*} state 
         * @param {{
         *  type: string,
         *  payload: { name: string, value: * }
         * }} action 
         * @returns 
         */
        deleteModel: (state, action) => {
            var nextState = {...state};
            var {name} = action.payload;
            delete nextState[name];
            return nextState;
        }
    }
})

const rootReducer = combineReducers({
    models: globalModels.reducer
})

// make sure selector is in context of 'rootReducer' including the name of the slice there
const selectorForModel = (modelName) => (state) => state.models[modelName] || {};

const globalStore = configureStore({
    reducer: rootReducer
});

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
    constructor({ displayName, typeName, description, type, initialValue }) {
        //this.value = initialValue; // todo: eval
        this.rawValue = (initialValue !== undefined && initialValue !== null) ? "" + initialValue : ""
        this.displayName = displayName;
        this.typeName = typeName;
        // form should complete / mark invalid based on initial values too
        this.touched = (initialValue !== undefined && initialValue !== null);
        this.description = description;
        this.type = type;
        this.valid = this.type.validate(this.rawValue);
    }

    onModelDataChanged({value, valid}) {
        this.touched = true;
        this.rawValue = value;
        this.valid = valid;
    };

    onUIDataChanged(event) {
        const nextValue = event.target.value;
        if(this.rawValue != nextValue) {
            this.rawValue = nextValue;
            this.touched = true;
            this.valid = this.type.validate(nextValue);
            //this.value = this.type.convertValueFromUI(nextValue);
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
const createFieldControllersForView = ({viewName, view, types, model}) => {
    return mapProperties(model, (fieldName, fieldSchema) => {
        const [displayName, typeName, defaultValue, description] = fieldSchema;
        const type = types[typeName];
        return new FieldController({
            displayName,
            typeName,
            description,
            type,
            initialValue: defaultValue
        })
    });
}

const SchemaView = (props) => {
    const {viewInfo: {view, viewName, model, modelName}, types, subviewName} = props;

    const [fieldControllers, updateFieldControllers] = useState(() => {
        return createFieldControllersForView({
            viewName: viewName,
            view: view,
            types: types,
            model: model
        })
    });

    const store = useStore();
    const globalModelSelector = selectorForModel(modelName);
    const formState = useSelector(globalModelSelector);
    // helper function to map modelName to all update actions
    const updateModelAction = (newModel) => globalModels.actions.updateModel({ name: modelName, value: newModel });
    
    const updateFieldValueInModel = (fieldName, value) => {
        const nextModel = {...formState};
        nextModel[fieldName] = value;
        const action = updateModelAction(nextModel)
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
                    valid: fieldController.valid
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

const ViewPanel = (props) => {
    const {store, viewInfo, ...otherProps} = props;

    const [advancedModalShown, updateAdvancedModalShown] = useState(false);


    // in here is where all of the checking for the form state in store and creation of save/cancel buttons will be
    // NOT IN SchemaView!!!
    // SchemaView is only for modifying the given 'store' using a form

    const buttonRoot = <Button variant="secondary" onClick={() => updateAdvancedModalShown(true)}>Open Advanced</Button>

    return (
        <Provider store={store}>
            <Panel title={viewInfo.view.title || viewInfo.viewName} buttons={[buttonRoot]}>
                <SchemaView key={viewInfo.viewName} viewInfo={viewInfo} subviewName={'basic'} {...otherProps}></SchemaView>
                <Modal show={advancedModalShown} onHide={() => updateAdvancedModalShown(false)}>
                    <Modal.Header>
                        <Modal.Title>Advanced</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <SchemaView key={viewInfo.viewName} viewInfo={viewInfo} subviewName={'advanced'} {...otherProps}></SchemaView>
                    </Modal.Body>
                </Modal>
            </Panel>
        </Provider>
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

const AppRoot = (props) => {
    const [schema, updateSchema] = useState(undefined);

    useBlockingEffect(() => {
        fetch(props.schemaPath).then(resp => resp.text().then(text => {
            updateSchema(JSON.parse(text))
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
                <ViewPanel store={globalStore} key={viewName} viewInfo={viewInfo} types={types} subviewName={'basic'}></ViewPanel>
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