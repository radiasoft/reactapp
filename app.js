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
        appState.dispatch({ type: newSimState });
        renderContent(appState.getState().simState, 'statusBar');
        console.log('STORE STATE', appState.getState());

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
                                        renderContent(this.spinner(), 'spinnerDiv');

                                    }
                                }, text:'Start Simulation'}),

                            this.button({
                                props:
                                {
                                    onClick: ()=> {
                                        this.updateSimState('CANCEL');
                                        renderContent(appState.getState().simState, 'spinnerDiv');
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
        return this.div({props: {id:"statusBar"}},
        // WHAT I WANTED WAS JUST A REFERENCE TO store.getState().simState RIGHT HERE THAT WOULD UPDATE WHEN THE STORE does
        // TODO (gurhar1133): ^ is this possible?
        )
    }

    render() {
        return this.app(
                this.tabSelector(this.APP_SCHEMA.header, 'lattice'),
                this.statusBar()
            );
    }

}

const rootElement = new App().render()
renderContent(rootElement, 'root');