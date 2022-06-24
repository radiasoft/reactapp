import { Fragment, useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { combineReducers, configureStore, createSlice } from "@reduxjs/toolkit";
import { bakeEnums, globalTypes } from "./types";
import { Provider, useStore, useSelector } from "react-redux";

const globalModels = createSlice({
    name: 'models',
    initialState: {},
    reducers: {
        // action.payload: {name: string, value: {}}
        updateModel: (state, action) => {
            var nextState = {...state};
            var {name, value} = action.payload;
            nextState[name] = value;
            return nextState;
        },
        // action.payload: {name: string}
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
const selectorForGlobalModel = (modelName) => (state) => state.models[modelName] || {};

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
        this.value = initialValue; // todo: eval
        this.displayName = displayName;
        this.typeName = typeName;
        this.touched = false;
        this.description = description;
        this.type = type;
        this.valid = this.type.validate(this.value); // todo: initialize
    }

    onModelDataChanged({value, valid}) {
        this.value = value;
        this.valid = valid;
    };

    onUIDataChanged(event) {
        const nextValue = event.target.value;
        this.touched = true;
        this.valid = this.type.validate(nextValue);
        this.value = this.type.convertValueFromUI(nextValue);
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
    const {viewInfo: {view, viewName, model, modelName}, types} = props;

    const [fieldControllers, updateFieldControllers] = useState(undefined);

    const store = useStore();
    const globalModelSelector = selectorForGlobalModel(modelName);
    const formState = useSelector(globalModelSelector);
    // helper function to map modelName to all update actions
    const updateModelAction = (newModel) => globalModels.actions.updateModel({ name: modelName, value: newModel });
    
    const updateFieldValueInModel = (fieldName, value) => {
        const nextModel = {...formState};
        nextModel[fieldName] = value;
        const action = updateModelAction(nextModel)
        store.dispatch(action);
    }

    // make initial field controllers
    useBlockingEffect(() => {
        const nextFieldControllers = createFieldControllersForView({
            viewName: viewName,
            view: view,
            types: types,
            model: model
        })
        updateFieldControllers(nextFieldControllers);
    })

    // TODO: rendering should not have side effects but is this considered a side effect since its just state?
    if(fieldControllers) {
        for(const [fieldName, fieldController] of Object.entries(fieldControllers)) {
            if(formState[fieldName] && fieldController.value !== formState[fieldName].value) {
                fieldController.onModelDataChanged(formState[fieldName]);
            }
        }
    }

    // build view binding inputs to field controllers purely
    var fieldElements = undefined;
    if(fieldControllers) {
        fieldElements = Object.entries(fieldControllers).map(([fieldName, fieldController]) => {
            const onChange = (value) => {
                if(value != fieldController.value) {
                    fieldController.onUIDataChanged(value);
                    updateFieldValueInModel(fieldName, {
                        value: fieldController.value,
                        valid: fieldController.valid
                    })
                }
            }

            return (
                <Fragment key={fieldName}>
                    <Form.Label>{fieldController.displayName}</Form.Label>
                    <FieldControllerInput 
                        key={fieldName} 
                        value={fieldController.value}
                        valid={fieldController.valid}
                        touched={fieldController.touched}
                        onChange={onChange}
                        type={fieldController.type}/>
                </Fragment>
            )
            
        })
    }

    return (
        <div key={viewName}>
            <div>
                {view.title || viewName}
            </div>
            <Form key={viewName}>
                {fieldElements}
            </Form>
        </div>
    );
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
            return <SchemaView key={viewName} viewInfo={viewInfo} types={types}></SchemaView>
        })
    }

    return (
        <Provider store={globalStore}>
            {viewPanels}
        </Provider>
    )
}

export default AppRoot;