import {SRC} from './sirepo-components.js'

var APP_SCHEMA = {
    header: [
        'source',
        'visualization'
    ]
};

function app() {
    return SRC.header(APP_SCHEMA.header);
}

const rootElement = app()
ReactDOM.render(rootElement, document.getElementById('root'))
