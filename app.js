import {SRComponentBase} from './sirepo-components.js';

class App extends SRComponentBase {

    constructor(props) {

        super(props);
        this.state = {simState: 'no sim'}

        this.updateSimState = this.updateSimState.bind(this)
        this.APP_SCHEMA = {
            header: [
                'lattice',
                'visualization',
            ],
            model: {
                lattice: {
                    x: ['x: ', 'Number', ''],
                    y: ['y: ', 'Number', ''],
                    dx: ['dx: ', 'Number', ''],
                    dy: ['dy: ', 'Number', ''],
                },
                visualization: {
                    useTwiss: ['Use twiss: ', 'Boolean', false]
                },
            },
            view: {
                lattice: {
                    title: 'Lattice',
                    basic: [
                        'x',
                        'y',
                        'dx',
                        'dy',
                    ]
                },
                visualization: {
                    title: 'Visualization',
                    basic: [
                        'useTwiss'
                    ]
                }
            },
        }
        this.APP_STATE = { // TODO (gurhar1133): figure out how to update UI based on state changes
            model: {
                lattice: {
                    x: 0,
                    y: 0,
                    dx: 1,
                    dy: 1,
                },
                visualization: {
                    useTwiss: false
                },
            }
        };
    }

    updateSimState = (newSimState) => {

        console.log('the new state should be: ', newSimState);
        this.state.simState = newSimState;
        // setSimState(newSimState);
        this.setState({simState: newSimState});
        console.log('this.state:', this.state);
    }

    lattice = () => {
        return this.div({
            props: {className: '', id: 'lattice'},
                children: [
                    this.panel('lattice', {
                        children: [
                            this.button({
                                text:'Save Changes'}),
                        ]
                    }),
                ]
            })
    }


    visualization = () => {
        return this.div({
            props: {className: '', id: 'visualization'},
                children: [
                    this.panel('visualization', {
                        children: [

                            React.createElement(
                                'button',
                                {
                                    onClick: () => {
                                        this.updateSimState('running');
                                        ReactDOM.render(this.spinner(), document.getElementById('spinnerDiv'));
                                    }
                                },
                                'Start Simulation'
                            ),

                            this.button({
                                props:
                                {
                                    onClick: ()=> {
                                        this.updateSimState('cancelled');
                                        ReactDOM.render('Simulation Cancelled', document.getElementById('spinnerDiv'));
                                    }
                                }, text:'End Simulation'}),

                            this.div({
                                props: {id: 'spinnerDiv'}
                            }),

                            // this.button({props: {}, text: this.state.simState})

                        ]
                    })
                ]
            }
        )
    }

    render() {
        // const simState = this.state.simState;
        return this.app(
                this.tabSelector(this.APP_SCHEMA.header, 'lattice'),
                this.div({props: null, children: `${this.state.simState}`}),
            );
    }

}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))