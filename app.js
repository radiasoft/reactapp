import {SRBase} from './sirepo-components.js'

class App extends SRBase {
    constructor() {
        super();
        this.APP_SCHEMA = {
            header: [
                'source',
                'visualization'
            ]
        }
    }

    render() {
        return this.app(
            this.header()
        );
    }
}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))
