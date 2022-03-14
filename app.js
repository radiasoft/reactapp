import {SRBase} from './sirepo-components.js'

var APP_SCHEMA = {
    header: [
        'source',
        'visualization'
    ]
};

class App extends SRBase {
    render() {
        return this.app(
            this.header(APP_SCHEMA.header)
        );
    }
}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))
