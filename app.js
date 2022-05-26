const appStateSlice = RTK.createSlice({
    name: 'appState',
    initialState: {
      value: 0,
      simState: 'OFF',
      visualization: {
          x: 0
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
      updateValue: (state, modelKey, fieldName, newVal) => {
          state[modelKey][fieldName] = newVal;
      }
    },
  })
const appState = RTK.configureStore({
    reducer: appStateSlice.reducer,
  })
const APP_SCHEMA = {
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

function editorLabel(label) {
    return e(
        'label',
        null,
        e('span', null, label)
    );
}

function editorValue(modelKey, fieldName) {
    const Component = () => {
        const value = ReactRedux.useSelector((state) => state);
        const dispatch = ReactRedux.useDispatch();

        return [
            'input',
            {
                type: 'text',
                onChange: (event) => {
                    dispatch(appStateSlice.actions.updateValue(modelKey, fieldName, event.target.value));
                    console.log(appState.getState());
                },
                value: value
            },
        ]




    }
    return Component;
}



// editorField(modelKey, fieldName) {
//     const m = this.APP_SCHEMA.model[modelKey][fieldName];
//     return this.div({
//         children: [
//             this.editorLabel(m[0]),
//             this.editorValue(modelKey, fieldName)
//         ]
//     })
// }

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

  function Panel() {
    return  e(
                'div',
                {key: 'panel', className: 'panel panel-info'},
                [
                    e(
                        'h1',
                        {key: 'panelHeading', className: 'panel-heading'},
                        'Visualization'
                    ),
                    e(SimStatus, {key: '123'}),
                    e(SimulationStartButton, {key: '345'})
                ]
    )
  }


  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
      e(
          ReactRedux.Provider,
          {store: appState},
          e(Panel),
        //   e(editorValue('visualization', 'x')),
        //   editorLabel('hello world')

        )
  )
