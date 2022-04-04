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
            }
        };

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
                                        console.log('Starting Simualation');
                                        ReactDOM.render(this.spinner(), document.getElementById('spinnerDiv'));
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
        )
    }

    render() {
        return this.app(
                this.tabSelector(this.APP_SCHEMA.header, 'lattice'),
            );
    }

}

const rootElement = new App().render()
ReactDOM.render(rootElement, document.getElementById('root'))