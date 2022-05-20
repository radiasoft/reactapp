import {SRComponentBase} from './sirepo-components.js';
const {createStore, compose} = Redux;

const initialState = {
    simState: 'no sim',
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
}

function reducer(state=initialState, action) {
    console.log('reducer', state, action);
    switch(action.type) {
        case 'START':
            return {
                ...appState.getState(),
                simState: 'Simulation Running'
            }
        case 'CANCEL':
            return {
                ...appState.getState(),
                simState: 'Simulation Cancelled'
            }
    }
    return state;
}

function renderContent(content, idOfTarget){
    ReactDOM.render(content, document.getElementById(idOfTarget))
}

const appState = createStore(reducer);

console.log(appState);

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
        this.APP_STATE = { // TODO (gurhar1133) refactor to work with redux store
            ...initialState
        };
    }

    udpateStateAndUI = (actionType, UIcontent, idOfTarget) => {
        appState.dispatch({type: actionType});
        renderContent(UIcontent, idOfTarget);
        this.APP_STATE = appState.getState();
    }

    updateSimState = (newSimState) => {
        this.udpateStateAndUI(newSimState, this.simButton(newSimState), 'simButton');
        console.log('STORE STATE', appState.getState());

    }

    simButton = (simState) => {
        if (simState == 'START') {
            return this.button({
                    props:
                    {
                        onClick: ()=> {
                            this.updateSimState('CANCEL');
                            renderContent(appState.getState().simState, 'spinnerDiv');
                        }
                    }, text:'End Simulation'});
        }
        else if (simState == 'CANCEL' || simState == 'NO SIM') {
                return this.button({
                props:
                {
                    onClick: ()=> {
                        this.updateSimState('START');
                        renderContent(this.spinner(), 'spinnerDiv');

                    }
                }, text:'Start Simulation'});
        }
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
                            this.div({
                                props: {id: 'spinnerDiv'}
                            }),
                            this.div({
                                props: {id: 'simButton'},
                                children: this.simButton('NO SIM')
                            }),
                        ]
                    })
                ]
            }
        )
    }

    render() {
        return this.app(
                this.tabSelector(this.APP_SCHEMA.header, 'lattice')
            );
    }

}

const rootElement = new App().render()
renderContent(rootElement, 'root');