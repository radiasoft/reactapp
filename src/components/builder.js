import { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// TODO: separate upstream props from generated values?
export class ComponentBuilder {
    constructor(componentFunction) {
        this.componentFunction = componentFunction;
        this.propMutations = [];
    }
    
    withDispatch(propName) {
        this.propMutations.push((props) => {
            props[propName] = useDispatch();
        })
        return this;
    }

    withValues(valuesFn) {
        this.propMutations.push((props) => {
            let values = valuesFn(props);
            Object.assign(props, values);
        })
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
        this.propMutations.push((props) => {
            let _temp = useContext;
            props[propName] = _temp(contextFn(props));
        })
        return this;
    }   

    withSelector(propName, selectorFn) {
        this.propMutations.push((props) => {
            let _temp = useSelector;
            props[propName] = _temp(selectorFn(props));
        })
        return this;
    }

    toComponent() {
        return (props) => {
            let newProps = {...props};
            for(let propMutation of this.propMutations) {
                propMutation(newProps);
            }
            let Component = this.componentFunction;
            return (
                <Component {...newProps}>{newProps.children || props.children}</Component>
            )
        }
    }
}