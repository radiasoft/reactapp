import { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSetup } from '../hooks';

// TODO: separate upstream props from generated values?
// TODO: flatten these into single builder
export class ComponentBuilder {
    constructor() {
        this.propMutations = [];
    }
    
    usingDispatch(propName) {
        this.propMutations.push((props) => {
            props[propName] = useDispatch();
        })
        return this;
    }

    usingValues(valuesFn) {
        this.propMutations.push((props) => {
            let values = valuesFn(props);
            Object.assign(props, values);
        })
        return this;
    }

    usingValue(propName, valueFn) {
        return this.usingValues((props) => {
            let _ret = {};
            _ret[propName] = valueFn(props);
            return _ret;
        });
    }

    usingContext(propName, contextFn) {
        this.propMutations.push((props) => {
            let _temp = useContext;
            props[propName] = _temp(contextFn(props));
        })
        return this;
    }   

    usingSelector(propName, selectorFn) {
        this.propMutations.push((props) => {
            let _temp = useSelector;
            props[propName] = _temp(selectorFn(props));
        })
        return this;
    }

    mutateProps = (props) => {
        let newProps = {...props};
        for(let propMutation of this.propMutations) {
            propMutation(newProps);
        }
        return newProps;
    }

    toComponent(componentFunction) {
        return (props) => {
            props = this.mutateProps(props);
            let Component = componentFunction;
            return (
                <Component {...props}>{props.children}</Component>
            )
        }
    }
}

export class InitializerComponentBuilder extends ComponentBuilder {
    constructor() {
        super();
        this.setupFn = undefined;
    }

    usingValueInitializer(propName, initializerFn) {
        this.setupFn = (props) => (finish) => {
            let finishWithResult = (result) => {
                props[propName] = result;
                finish();
            }
            initializerFn(props, finishWithResult);
        }
        return this;
    }

    usingVoidInitializer(initializerFn) {
        this.setupFn = (props) => (finish) => {
            initializerFn(props, finish);
        }
        return this;
    } 

    toComponent(componentFunction) {
        return (props) => {
            props = this.mutateProps(props);
            var hasInit = true;
            if(this.setup) {
                hasInit = useSetup(true, this.setupFn(props));
            }
            let Component = componentFunction;
            
            return (
                hasInit && <Component {...props}/>
            )
        }
    }
}

export class ContextWrapperComponentBuilder extends ComponentBuilder {
    constructor() {
        super();
        this.contextProvided = undefined;
    }

    providingContext(context, valueFn) {
        this.contextProvided = {
            context,
            valueFn
        }
        return this;
    }

    toComponent(componentFunction) {
        return (props) => {
            props = this.mutateProps(props);
            let Component = componentFunction;

            if(this.contextProvided) {
                let { context, valueFn } = this.contextProvided;
                let value = valueFn(props);
                let Context = context;
                return (
                    <Context.Provider value={value}><Component {...props}/></Context.Provider>
                )
            } else {
                return <Component {...props}/>
            }
        }
        
    }
}

export class ConditionalComponentBuilder extends ComponentBuilder {
    constructor() {
        super();
        this.componentConditional = undefined;
        this.defaultComponent = undefined;
    }

    usingConditional(conditional) {
        this.componentConditional = conditional;
        return this;
    }

    elseComponent(component) {
        this.defaultComponent = component;
        return this;
    }

    toComponent(componentFunction) {
        return (props) => {
            props = this.mutateProps(props);
            let Component = componentFunction;
            let ElseComponent = this.defaultComponent;

            var componentShown = true;
            if(this.componentConditional) {
                componentShown = this.componentConditional(props);
            }

            return (<>
                {componentShown && <Component {...props}/>}
                {!componentShown && <ElseComponent {...props}/>}
            </>)
        }
    }
}