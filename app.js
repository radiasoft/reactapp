import {SRComponentBase} from './sirepo-components.js'

class App extends SRComponentBase {
    constructor() {
        super();
        this.APP_SCHEMA = {
            header: [
                'source',
                'visualization'
            ],
            model: {
                modelA: {
                    foo: ['Foo var', 'String', '']
                }
            },
            view: {
                modelA: {
                    title: 'Model A',
                    basic: [
                        'foo',
                    ]
                }
            }
        }
        this.APP_STATE = {
            model: {
                modelA: {
                    foo: 'a default value for foo'
                }
            }
        };
    }

    render() {
        return this.app(
            this.panel('modelA'),
        );
    }
}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))
