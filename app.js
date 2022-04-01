import {SRComponentBase} from './sirepo-components.js'

class App extends SRComponentBase {
    constructor(props) {
        super(props);
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
                simState: {
                    running: false,
                },
            }
        };
    }



    startSim =  () => {
        console.log('Changing default SSN');
        console.log('updated model:', this.APP_STATE.model)
        this.render()
    }

    render() {
        return this.app(

                this.header([
                        this.APP_SCHEMA.header.map(
                            (t) => this.button({text: t, props: {
                                onClick: () => {
                                    console.log('header elems: ', this.APP_SCHEMA.header);
                                    this.APP_SCHEMA.header.forEach((e) => {
                                        if (e == t) {
                                            // TODO (gurhar1133): use something other than doc.getElementByID??
                                            document.getElementById(e).classList.replace('hide','show');
                                            console.log(document.getElementById(e));
                                        } else {
                                            document.getElementById(e).classList.replace('show','hide');
                                            console.log(document.getElementById(e));
                                        }
                                    })
                                }
                            }
                        })
                    )]),

                this.div({
                    props: {className: 'show', id: 'lattice'},
                        children: [
                            this.panel('lattice', {
                                children: [
                                    this.button({
                                        text:'Save Changes'}),
                                ]
                            }),
                        ]
                    }
                ),

                this.div({
                    props: {className: 'hide', id: 'visualization'},
                        children: [
                            this.panel('visualization', {
                                children: [
                                    React.createElement(
                                        'button',
                                        {
                                            onClick: () => {
                                                console.log('Starting Simualation');
                                                ReactDOM.render(this.spinner(), document.getElementById('spinnerDiv'));
                                                this.APP_STATE.model.simState.running = true;
                                                console.log('THIS:', this)
                                            }
                                        },
                                        'Start Simulation'
                                    ),
                                    this.button({
                                        props:{
                                            onClick: ()=> {
                                                console.log('Ending Simulation');
                                                ReactDOM.render('Simulation Cancelled', document.getElementById('spinnerDiv'));
                                                this.APP_STATE.model.simState.running = false;
                                                console.log('THIS:', this)
                                            }
                                        }, text:'End Simulation'}),
                                    this.div({
                                        props: {id: 'spinnerDiv'}
                                    })
                                ]
                            })
                        ]
                    }



            ));
    }
}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))