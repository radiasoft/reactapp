import {SRComponentBase} from './sirepo-components.js'

class App extends SRComponentBase {
    constructor(props) {

        super(props);

        this.state = {
            simState: 'no sim'
        }

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

    componentWillMount() {
        this.updateSimState = this.updateSimState.bind(this);
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

    updateSimState = (newState) => {
        console.log('setting new simState!');
        this.setState({simState: newState});
        // this.state.simState = newState;
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
                                        ReactDOM.render(this.spinner(), document.getElementById('spinnerDiv'));
                                        this.updateSimState('running');
                                    }
                                },
                                'Start Simulation'
                            ),

                            this.button({
                                props:
                                {
                                    onClick: ()=> {
                                        ReactDOM.render('Simulation Cancelled', document.getElementById('spinnerDiv'));
                                        this.updateSimState('cancelled');
                                    }
                                }, text:'End Simulation'}),

                            this.div({
                                props: {id: 'spinnerDiv'}
                            })
                        ]
                    })
                ]
            }
        )
    }

    render() {
        return this.app(
                this.tabSelector(this.APP_SCHEMA.header, 'lattice'),
                React.createElement('div', null, [this.state.simState])
            );
    }

}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))