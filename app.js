const counterSlice = RTK.createSlice({
  name: 'counter',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1
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
        React.createElement(
            'button',
            {onClick: () => dispatch(counterSlice.actions.increment())},
            ['Increment', React.createElement('span', {key: 'x'}, count)],
        )
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    React.createElement(
        ReactRedux.Provider,
        {store: store},
        React.createElement(Counter)
    )
)
