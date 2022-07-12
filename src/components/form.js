import { Form, Row } from "react-bootstrap";
import { LabelTooltip } from "./label";

export function FormField(props) {
    let {label, tooltip} = props;
    return (
        <Form.Group size="sm" as={Row} className="mb-2">
            <Form.Label column="sm" sm={5} className="text-end">
                {label}
                {tooltip &&
                    <LabelTooltip text={tooltip} />
                }
            </Form.Label>
            {props.children}
        </Form.Group>
    )
}