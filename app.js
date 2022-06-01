const appStateSlice = RTK.createSlice({
    name: 'appState',
    initialState: {
      value: 0,
      simState: 'OFF',
      result: '-',
      model: {
        lattice: {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            cycles: 4,
        },
        visualization: {
            useTwiss: false
        },
      }
    },
    reducers: {
      increment: (state) => {
        state.value += 1
      },
      simulation: (state) =>{
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
        const r = l.x + l.y + l.dx + l.dy;
        console.log('sim result: ', r);
        appState.dispatch(appStateSlice.actions.simulation());
    }, Number(state.model.lattice.cycles) * 1000);
}

function editorLabel(label) {
    return e(
        'label',
        null,
        e('span', null, label)
    );
}

function EditorValue(props) {
    return e(
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
    console.log('props: ', props);

    return React.createElement(
        'div',
        null,
        [editorLabel(props.fieldName),
        EditorValue(props)]
    )
}

// // TODO(e-carlin): sort
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
                    runSimulation(appState.getState());
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

  function createPanel(children) {
    return function Panel() {
        return  e(
                    'div',
                    {key: 'panel', className: 'panel panel-info'},
                    [
                        e(
                            'h1',
                            {key: 'panelHeading', className: 'panel-heading'},
                            'Visualization'
                        ),
                        e('div', {className: 'panel-content'}, children),
                    ]
        )
      }
  }



  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
      e(
          ReactRedux.Provider,
          {store: appState},
          [
            e(
                createPanel(
                    [
                        e(SimStatus, {key: '123'}),
                        editorField({modelKey: 'lattice', fieldName: 'x'}),
                        editorField({modelKey: 'lattice', fieldName: 'y'}),
                        editorField({modelKey: 'lattice', fieldName: 'dx'}),
                        editorField({modelKey: 'lattice', fieldName: 'dy'}),
                        editorField({modelKey: 'lattice', fieldName: 'cycles'}),
                        e(SimulationStartButton, {key: '345'}),
                        e('div', null, 'Sim Result:')
                    ]
                )
            ),
          ]

        )
  )
