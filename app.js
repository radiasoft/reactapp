import {SRComponentBase} from './sirepo-components.js'

class App extends SRComponentBase {
    constructor(props) {
        super(props);
        this.handleSSNClick = this.handleSSNClick.bind(this)
        this.APP_SCHEMA = {
            header: [
                'source',
                'visualization',
                'lattice'
            ],
            model: {
                modelA: {
                    foo: ['Enter SSN', 'String', '']
                },
                modelB: {
                    foo: ['Enter Credit Card Number', 'String', '']
                },
            },
            view: {
                modelA: {
                    title: 'Sirepo Signup',
                    basic: [
                        'foo',
                    ]
                },
                modelB: {
                    title: 'Model B',
                    basic: [
                        'foo',
                    ]
                }
            },
        }
        this.APP_STATE = {
            model: {
                modelA: {
                    foo: 'a default value for foo'
                },
                modelB: {
                    foo: 'this is a default value for modelB'
                }
            }
        };


    }


    handleSSNClick =  () => {
        console.log('Changing default SSN');
        this.APP_STATE.model.modelA.foo = 'New SSN val';

        console.log('updated model:', this.APP_STATE.model)
        this.render()
    }

    render() {
        return this.app(

                this.panel('modelA', {
                    children: [
                        this.editorField('modelB', 'foo'),
                        React.createElement(
                                'button',
                                { onClick: () => console.log('Starting Simualation') },
                                'Start Simulation'
                        ),
                        this.button({props:{onClick: ()=>{
                            console.log('Ending Simulation')
                        }}, text:'End Simulation'}),
                    ]
                }),

            );
    }
}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))