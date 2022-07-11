//import { React }
import { Col, Form } from "react-bootstrap";

export class rsType {
    constructor({ colSize, isRequired }) {
        this.colSize = this.hasValue(colSize) ? colSize : 5;
        this.isRequired = this.hasValue(isRequired) ? isRequired : true;
    }
    componentFactory({
        value,
        valid,
        touched,
        onChange
    }) {
        return (props) => {
            return (
                <Col sm={this.colSize}>
                    {
                        this.uiComponent({
                            ...props,
                            value: this.hasValue(value) ? value : "",
                            isInvalid: ! valid && touched,
                            onChange,
                        })
                    }
                </Col>
            )
        }
    }
    dbValue(value) {
        return value;
    }
    hasValue(value) {
        return value !== undefined && value != null;
    }
    validate(value) {
        return true;
    }
}

export class rsString extends rsType {
    constructor(props) {
        super(props);
        this.align = "text-start";
    }
    uiComponent(props) {
        return (
            <Form.Control size="sm" className={this.align} type="text" {...props}></Form.Control>
        )
    }
    validate(value) {
        if (this.isRequired) {
            return this.hasValue(value) && value.length > 0;
        }
        return true;
    }
}

export class rsNumber extends rsString {
    constructor(props) {
        super(props);
        this.align = "text-end";
        this.colSize = 3;
    }
}

export class rsFloat extends rsNumber {
    static REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))([eE][+-]?\d+)?\s*$/;
    dbValue(value) {
        return Number.parseFloat(value);
    }
    validate(value) {
        return this.hasValue(value) && rsFloat.REGEXP.test(value);
    }
}

export const globalTypes = {
    'OptionalString': new rsString({
        isRequired: false,
    }),
    'String': new rsString({}),
    'Float': new rsFloat({}),
}

export function enumTypeOf(allowedValues) {
    return new (class extends rsType {
        uiComponent(props) {
            const options = allowedValues.map(allowedValue => (
                <option key={allowedValue.value} value={allowedValue.value}>{allowedValue.displayName}</option>
            ));
            return <Form.Select size="sm" {...props}>
                {options}
            </Form.Select>
        }
        validate(value) {
            return this.hasValue(value) && allowedValues.filter(av => av.value == value).length > 0;
        };
    })({});
}
