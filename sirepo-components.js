export function Counter() {
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

  export function SimulationStartButton() {
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

  export function Spinner() {
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

  export function SimStatus() {
      const sim = ReactRedux.useSelector((state) => state.simState);
      return (
          React.createElement(
              'div',
              {key: '2'},
              [sim == 'ON' ? Spinner() : 'SIM IS NOT RUNNING']
          )
      )
  }

  export function Panel() {
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