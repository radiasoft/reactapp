import { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// TODO: maintain call order
export class ComponentBuilder {
    constructor(componentFunction) {
        this.componentFunction = componentFunction;
        this.hookDependencies = [];
        this.valueFuncs = [];
        this.dispatch = undefined;
    }
    
    needsDispatch(propName) {
        this.dispatch = propName;
        return this;
    }

    withValues(valuesFn) {
        this.valueFuncs.push(valuesFn);
        return this;
    }

    withValue(propName, valueFn) {
        return this.withValues((props) => {
            let _ret = {};
            _ret[propName] = valueFn(props);
            return _ret;
        });
    }

    withContext(propName, contextFn) {
        this.hookDependencies.push({
            hookFn: useContext,
            propName,
            evaluator: contextFn
        })
        return this;
    }   

    withSelector(propName, selectorFn) {
        this.hookDependencies.push({
            hookFn: useSelector,
            propName,
            evaluator: selectorFn
        })
        return this;
    }

    toComponent() {
        return (props) => {
            let newProps = {...props};
            if(this.dispatch) {
                let _temp = useDispatch;
                newProps[this.dispatch] = _temp();
            }
            for(var dependency of this.hookDependencies) {
                let { hookFn, propName, evaluator } = dependency;
                if(hookFn){
                    let hookedValue = hookFn(evaluator(newProps));
                    newProps[propName] = hookedValue;
                } else {
                    throw new Error('could not parse dependency in component: ' + dependency);
                }
            }
            for(var valueFunc of this.valueFuncs) {
                let values = valueFunc(newProps);
                for(var [ propName, value ] of Object.entries(values)) {
                    newProps[propName] = value;
                }
            }
            let Component = this.componentFunction;
            return (
                <Component {...newProps}>{newProps.children || props.children}</Component>
            )
        }
    }
}