import {SRComponentBase} from './sirepo-components.js';
const {connect, Provider} = ReactRedux;
const {createStore, compose} = Redux;

const initialState = {
    simState: 'no sim',
}

function reducer(state=initialState, action) {
    console.log('reducer', state, action);
    switch(action.type) {
        case 'START':
            return {
                simState: 'Simulation Running'
            }
        case 'CANCEL':
            return {
                simState: 'Simulation Cancelled'
            }
    }
    return state;
}

const store = createStore(reducer);

console.log(store);

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
        // this.state = {simState: newSimState}
        // console.log('the new state should be: ', newSimState);
        store.dispatch({ type: newSimState });
        console.log('STORE STATE', store.getState());

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

                            this.button({
                                props:
                                {
                                    onClick: ()=> {
                                        this.updateSimState('START');
                                        ReactDOM.render(this.spinner(), document.getElementById('spinnerDiv'));
                                    }
                                }, text:'Start Simulation'}),

                            this.button({
                                props:
                                {
                                    onClick: ()=> {
                                        this.updateSimState('CANCEL');
                                        ReactDOM.render('Simulation Cancelled', document.getElementById('spinnerDiv'));
                                    }
                                }, text:'End Simulation'}),

                            this.div({
                                props: {id: 'spinnerDiv'}
                            }),

                        ]
                    })
                ]
            }
        )
    }

    statusBar = () => {
        return this.div({props: null, children: `   current app state: ${this.state.simState}`})
    }

    render() {
        // const simState = this.state.simState;
        return this.app(
                this.tabSelector(this.APP_SCHEMA.header, 'lattice'),
                this.statusBar()
            );
    }

}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))