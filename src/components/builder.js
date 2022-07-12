import { useContext, useSelector } from 'react';

class ComponentBuilder {
    constructor(componentFunction) {
        this.componentFunction = componentFunction;
        this.hookDependencies = [];
        this.valueDependencies = [];   
    }

    needsValue(valueFn, propName) {
        this.valueDependencies.push({
            evaluator: valueFn,
            propName
        })
    }

    needsContext(contextFn, propName) {
        this.hookDependencies.push({
            hookFn: useContext,
            propName,
            evaluator: contextFn
        })
    }   

    needsSelector(selectorFn, propName) {
        this.hookDependencies.push({
            hookFn: useSelector,
            propName,
            evaluator: selectorFn
        })
    }

    toComponent() {
        return (props) => {
            let newProps = {...props};
            for(var dependency of this.hookDependencies) {
                let { hookFn, propName, evaluator } = dependency;
                if(hookFn){
                    let hookedValue = hookFn(evaluator(props));
                    newProps[propName] = hookedValue;
                } else {
                    throw new Error('could not parse dependency in component: ' + dependency);
                }
            }
            for(var dependency of this.valueDependencies) {
                let { evaluator, propName } = dependency;
                newProps[propsName] = evaluator(props);
            }
            let Component = this.componentFunction;
            return (
                <Component {...newProps}>{props.children}</Component>
            )
        }
    }
}