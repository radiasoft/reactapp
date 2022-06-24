import { Form } from "react-bootstrap";

const WithInputDefaults = ({value, valid, touched, onChange, defaultUIValue}, props, callback) => {
    const newProps = {
        ...props,
        value: (value !== undefined && value !== null) ? value : defaultUIValue,
        //isValid: valid && touched,
        isInvalid: !valid && touched,
        onChange
    }
    return callback(newProps);
}

const globalTypes = {
    'OptionalString': new (class {
        constructor() {
            this.defaultUIValue = "";
        }
        convertValueFromUI(str) {
            return (!!str && str.length > 0) ? str : undefined; // keep "", null, undefined consistent
        }
        validate(value) {
            return true;
        }
        componentFactory({
            value,
            valid,
            touched,
            onChange
        }) {
            return (props) => {
                return WithInputDefaults({
                    defaultUIValue: this.defaultUIValue,
                    value,
                    valid,
                    touched,
                    onChange
                }, props, (props) => {
                    return <Form.Control type="text" {...props}></Form.Control>
                });
            }
        }
    })(),
    'String': new (class {
        constructor() {
            this.defaultUIValue = "";
        }
        convertValueFromUI(str) {
            return (!!str && str.length > 0) ? str : undefined; // keep "", null, undefined consistent
        }
        validate(value) {
            return !!value && value.length > 0;
        }
        componentFactory({
            value,
            valid,
            touched,
            onChange
        }) {
            return (props) => {
                return WithInputDefaults({
                    defaultUIValue: this.defaultUIValue,
                    value,
                    valid,
                    touched,
                    onChange
                }, props, (props) => {
                    return <Form.Control type="text" {...props}></Form.Control>
                });
            }
        }
    })(),
    'Float': new (class {
        constructor() {
            this.defaultUIValue = "";
        }
        convertValueFromUI(str) {
            return (!!str && str.length > 0) ? parseFloat(str) : undefined; // handle "", null, undefined consistently
        }
        validate(value) {
            return value !== undefined && value !== null;
        }
        componentFactory({
            value,
            valid,
            touched,
            onChange
        }) {
            return (props) => {
                return WithInputDefaults({
                    defaultUIValue: this.defaultUIValue,
                    value,
                    valid,
                    touched,
                    onChange
                }, props, (props) => {
                    return <Form.Control type="number" {...props}></Form.Control>
                });
            }
        }
    })(),
}

const enumTypeOf = (enumSchema) => {
    const allowedValues = enumSchema.map(v => {
        const [value, displayName] = v;
        return {
            value,
            displayName 
        }
    });
    const enumType = new (class {
        constructor() {
            this.defaultUIValue = "";
        }
        convertValueFromUI(str) {
            return str;
        };
        validate(value) {
            return value !== undefined && value !== null && allowedValues.filter(av => av.value == value).length > 0;
        };
        componentFactory({
            value,
            valid,
            touched,
            onChange
        }) {
            return (props) => {
                const options = allowedValues.map(allowedValue => (
                    <option key={allowedValue.value} value={allowedValue.value}>{allowedValue.displayName}</option>
                ));
                return WithInputDefaults({
                    defaultUIValue: this.defaultUIValue,
                    value,
                    valid,
                    touched,
                    onChange
                }, props, (props) => {
                    return <Form.Select {...props}>
                        {options}
                    </Form.Select>
                });
            }
        }
    })();
    return enumType;
}

const bakeEnums = (typesObj, enums) => {
    if(enums) {
        const temp = {};
        for(const enumTypeName in enums) {
            temp[enumTypeName] = enumTypeOf(enums[enumTypeName]);
        }
        return Object.assign(typesObj, temp);
    }
    return typesObj;
}

export {
    globalTypes,
    bakeEnums
}