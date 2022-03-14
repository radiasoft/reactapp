import {SRC} from './sirepo-components.js'

var APP_SCHEMA = {
    header: [
        'source',
        'visualization'
    ]
};

class App {
    render() {
        return SRC.header(APP_SCHEMA.header);
    }
}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))
