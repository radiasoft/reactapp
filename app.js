const appStateSlice = RTK.createSlice({
    name: 'appState',
    initialState: {
      value: 0,
      simState: 'OFF'
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
    },
  })

  const appState = RTK.configureStore({
    reducer: appStateSlice.reducer,
  })

 const e = (type, props, children) => React.createElement(type, props, children)

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
          e(Panel)
        )
  )
