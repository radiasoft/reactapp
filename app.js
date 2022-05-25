import {SRComponentBase} from './sirepo-components.js';

const {createStore, compose} = Redux;
const initialState = {
    simState: 'no sim',
    model: {
        lattice: {},
        visualization: {
            useTwiss: false
        },
    }
}
const appState = createStore(reducer);


function reducer(state=initialState, action) {
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
        case 'SAVE STATE':
            return {
                ...appState.getState(),
                ...newStateData
            }
    }
    return state;
}

function udpateStateAndUI(appState, actionType, UIcontent, idOfTarget) {
    appState.dispatch({type: actionType});
    renderContent(UIcontent, idOfTarget);
    return appState.getState();
}

function renderContent(content, idOfTarget){
    ReactDOM.render(content, document.getElementById(idOfTarget))
}


class App extends SRComponentBase {

    constructor(props) {
        super(props);
        this.state = {simState: 'no sim'}

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
        this.APP_STATE = {
            ...initialState // TODO (gurhar1133): does this and the fact that in reducer handle state=initialState, establish a binding?
        };
    }

    updateSimState = (newSimState) => {
        const newState = udpateStateAndUI(appState, newSimState, this.simButton(newSimState), 'simButton');
        this.APP_STATE = { ...newState};
        console.log('STORE STATE:', appState.getState());
        console.log('this.APP_STATE:', this.APP_STATE);
        // console.log('intialState: ', initialState);
    }

    saveLatticeVals = () => {
        console.log('storeState: ', appState.getState());
        console.log('this.APP_STATE: ', this.APP_STATE);
        // console.log('intialState: ', initialState);
        // alert('changes saved');
    }

    simButton = (simState) => {
        if (simState == 'START') {
            return this.button({
                    props: {
                        onClick: ()=> {
                            this.updateSimState('CANCEL');
                            renderContent(appState.getState().simState, 'spinnerDiv');
                        }
                    },
                    text:'End Simulation'});
        }
        else if (simState == 'CANCEL' || simState == 'NO SIM') {
                return this.button({
                props: {
                     onClick: ()=> {
                        this.updateSimState('START');
                        renderContent(this.spinner(), 'spinnerDiv');

                    }
                },
                text:'Start Simulation'});
        }
    }

    lattice = () => {
        return this.div({
            props: {className: '', id: 'lattice'},
                children: [
                    this.panel('lattice', {
                        children: [
                            this.button({
                                props: {
                                    onClick: () => {
                                        this.saveLatticeVals();
                                    }
                                },
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