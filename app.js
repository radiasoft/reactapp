const appStateSlice = RTK.createSlice({
    name: 'appState',
    initialState: {
      value: 0,
      simState: 'OFF',
      result: false,
      model: {
        visualization: {
            cycles: 4,
            useTwiss: false
        },
        lattice: {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
        }
      }
    },
    reducers: {
      increment: (state) => {
        state.value += 1
      },
      simulation: (state, action) =>{
        if (action.payload) {
            state.result = action.payload.result;
            state.simState = 'OFF';
            return;
        }
        if (state.simState == 'OFF') {
            state.simState = 'ON';
        }
        else {
            state.simState = 'OFF';
        }
      },
      updateValue: (state, action) => {
          console.log(action);
          state.model[action.payload.modelKey][action.payload.fieldName] = action.payload.newVal;
      }
    },
  })

const appState = RTK.configureStore({
    reducer: appStateSlice.reducer,
  })


const e = (type, props, children) => React.createElement(type, props, children)


// function panel(modelKey) {
//     return this.div({
//         props: {className: 'col-sm-12'},
//         children: [
//             this.div({
//                 props: {className: 'panel panel-info'},
//                 children: [
//                     this.panelHeader(modelKey),
//                     this.panelBody(modelKey)
//                 ]
//             })
//         ]
//     })
// }

function runSimulation(state) {
    setTimeout(() => {
        const l = state.model.lattice;
        const r = Number(l.x) + Number(l.y) + Number(l.dx) + Number(l.dy);
        appState.dispatch(appStateSlice.actions.simulation({result: r}));
    }, Number(state.model.visualization.cycles) * 1000);
}

function editorLabel(label) {
    return e(
        'label',
        null,
        e('span', null, label)
    );
}

function EditorValue(props) {
    return e( // ELEMENT(REACT_FUNCTIONAL_COMPONENT_FUNCTION) is what works, so if you want to pass props to functional component you have to wrap like this
        function() {
            const value = ReactRedux.useSelector((state) => state.model[props.modelKey][props.fieldName]);
            const dispatch = ReactRedux.useDispatch();
            return React.createElement(
                'input',
                {
                    type: 'text',
                    onChange: (event) => {
                        dispatch(appStateSlice.actions.updateValue({newVal: event.target.value, modelKey: props.modelKey, fieldName: props.fieldName}));
                        console.log(appState.getState());
                    },
                    value: value
                },
            );
        }
    )
}



function editorField(props) {

    return React.createElement(
        'div',
        null,
        [editorLabel(props.fieldName),
        EditorValue(props)]
    )
}


// editorPane(modelKey) {
//     return this.div({
//         children: this.APP_SCHEMA.view[modelKey].basic.map(
//             (f) => this.editorField(modelKey, f)
//         )
//     });
// }

// panelBody(modelKey) {
//     return this.div({
//         props: {className: 'panel-body'},
//         children: [
//             this.editorPane(modelKey)
//         ]
//     })
// }

// panelHeader(modelKey) {
//     return this.div({
//         props: {className: 'panel-heading'},
//         children: this.h1(this.APP_SCHEMA.view[modelKey].title)

//     })
// }

function Counter() {

    const count = ReactRedux.useSelector((state) => state.value)
    const dispatch = ReactRedux.useDispatch()

    return (
        e('div', null,
            [
                e(
                    'button',
                    {
                        key: 'y',
                        onClick: () => {
                            dispatch(appStateSlice.actions.increment());
                            console.log(appState.getState());
                        }
                    },
                    ['Increment'],
                ),
                e('span', {key: 'x'}, ' ' + count)
            ]
        )
    )
}

function SimulationStartButton() {

    const sim = ReactRedux.useSelector((state) => state.simState)
    const dispatch = ReactRedux.useDispatch()

    return (
        e(
            'button',
            {
                key: '1',
                onClick: () => {
                    dispatch(appStateSlice.actions.simulation());
                    if (appState.getState().simState == 'ON') {
                        runSimulation(appState.getState());
                    }
                    console.log(appState.getState());
                }
            },
            [sim == 'OFF' ? 'Start Simulation' : 'End Simulation']
        )
    )
}

function Spinner() {
   return  e(
       'div',
        {key: '12', className: 'btn btn-lg'},
        [
            e(
                'span',
                {key: '9', className: 'glyphicon glyphicon-refresh spinning'},
            ),
            ['   Running Simulation...']
        ]
    )
}

function SimStatus() {
      const sim = ReactRedux.useSelector((state) => state.simState);
      return (
          e('div', {key: '2'}, [sim == 'ON' ? Spinner() : 'SIM IS NOT RUNNING'])
      )
}

function createModal(props) {
    return function () {
        return e(
            'button',
            null,
            'MODAL CONTENT'
        ) // TODO (gurhar1133): translate this into jsx'less react: (or try CSS modal, might fit better)
          //     * OPTIONS:
          //         - https://sabe.io/tutorials/how-to-create-modal-popup-box
          //         - https://css-tricks.com/considerations-styling-modal/
        //   <button type="button" class="btn btn-primary btn-lg" data-toggle="modal" data-target="#smallShoes">
        //   Click Me
        //   </button>

        //   <!-- The modal -->
        //   <div class="modal fade" id="smallShoes" tabindex="-1" role="dialog" aria-labelledby="modalLabelSmall" aria-hidden="true">
        //   <div class="modal-dialog modal-sm">
        //   <div class="modal-content">

        //   <div class="modal-header">
        //   <button type="button" class="close" data-dismiss="modal" aria-label="Close">
        //   <span aria-hidden="true">&times;</span>
        //   </button>
        //   <h4 class="modal-title" id="modalLabelSmall">Modal Title</h4>
        //   </div>

        //   <div class="modal-body">
        //   Modal content...
        //   </div>

        //   </div>
        //   </div>
        //   </div>

    }
}

function createPanel(title, children) {
    return function Panel() {
        return  e(
                    'div',
                    {key: 'panel', className: 'panel panel-info'},
                    [
                        e(
                            'h1',
                            {key: 'panelHeading', className: 'panel-heading'},
                            [
                                title,
                                e(
                                    'span',
                                    {className: 'pencil', 'data-toggle': 'modal', 'data-target': '#exampleModal'},
                                    ''
                                ),
                                e(
                                    'div',
                                    {id: 'exampleModal', className: 'modal fade', tabindex: '-1', role: 'dialog', 'aria-labelledby': 'exampleModalLabel', 'aria-hidden': 'true'},
                                    e(
                                        'div',
                                        {className: 'modal-dialog modal-sm'},
                                        [
                                            e(
                                                'div',
                                                {className: 'modal-body'},
                                                e(
                                                    'button',
                                                    {className: 'btn btn-primary', 'data-dismiss': 'modal'},
                                                    'Button inside'
                                                )
                                            )
                                        ]

                                    )
                                )
                            ]

                        ),
                        e('div', {className: 'container'}, children),


                    ]
        )
      }
}

function SimResult() {
    const res = ReactRedux.useSelector((state) => state.result)
        return e(
            'div',
            {key: 'result'},
            res || res === 0 ? 'SIM RESULT: ' + res : ''
        )
}



const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    e(
        ReactRedux.Provider,
        {store: appState},
        [
            e(
                'div',
                {className: 'my-grid'},
                [
                    e(
                        createPanel( // Another example of wrapping funcional components to pass props, note how createPanel(elems) returns a function to e()
                            'Visualization',
                            [
                                e(SimStatus, {key: '123'}),
                                editorField({modelKey: 'visualization', fieldName: 'cycles'}),
                                e(SimulationStartButton, {key: '345'}),
                                e(SimResult)
                            ]
                        ),
                    ),
                    e(
                        createPanel(
                            'Lattice',
                            [
                                editorField({modelKey: 'lattice', fieldName: 'x'}),
                                editorField({modelKey: 'lattice', fieldName: 'y'}),
                                editorField({modelKey: 'lattice', fieldName: 'dx'}),
                                editorField({modelKey: 'lattice', fieldName: 'dy'}),
                            ]
                        )
                    )
                ]
            )

        ]
    )


)
