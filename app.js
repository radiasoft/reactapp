const counterSlice = RTK.createSlice({
    name: 'counter',
    initialState: {
      value: 0,
      simState: 'OFF'
    },
    reducers: {
      increment: (state) => {
        // Redux Toolkit allows us to write "mutating" logic in reducers. It
        // doesn't actually mutate the state because it uses the Immer library,
        // which detects changes to a "draft state" and produces a brand new
        // immutable state based off those changes
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

  const store = RTK.configureStore({
    reducer: counterSlice.reducer,
  })

  function Counter() {
    const count = ReactRedux.useSelector((state) => state.value)
    const dispatch = ReactRedux.useDispatch()

    return (
        React.createElement('div', null,
        [
            React.createElement(
                'button',
                {
                    key: 'y',
                    onClick: () => {
                        dispatch(counterSlice.actions.increment());
                        console.log(store.getState());
                    }
                },
                ['Increment'],
            ),
            React.createElement('span', {key: 'x'}, ' ' + count)
            ]
        )
    )
  }

  function SimulationStartButton() {
    const sim = ReactRedux.useSelector((state) => state.simState)
    const dispatch = ReactRedux.useDispatch()

    return (
        React.createElement(
            'button',
            {
                key: '1',
                onClick: () => {
                    dispatch(counterSlice.actions.simulation());
                    console.log(store.getState());
                }
            },
            [sim == 'OFF' ? 'Start Simulation' : 'End Simulation']
        )
    )
  }

  function Spinner() {
   return  React.createElement(
       'div',
        {key: '12', className: 'btn btn-lg'},
        [
            React.createElement(
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
          React.createElement(
              'div',
              {key: '2'},
              [sim == 'ON' ? Spinner() : 'SIM IS NOT RUNNING']
          )
      )
  }

  function Panel() {
   return  React.createElement(
        'div',
        {key: 'panel', className: 'panel panel-info'},
        [
            React.createElement(
                'h1',
                {key: 'panelHeading', className: 'panel-heading'},
                'Visualization'
            ),
            React.createElement(SimStatus, {key: '123'}),
            React.createElement(SimulationStartButton,  {key: '345'})
        ]
        )
  }


  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
      React.createElement(
          ReactRedux.Provider,
          {store: store},

          React.createElement(Panel)
         )


      )
