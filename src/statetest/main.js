import { createSlice, configureStore } from '@reduxjs/toolkit';
import { useSelector, Provider } from 'react-redux';

import './main.scss';

export const messageSlice = createSlice({
    name: 'message',
    initialState: {},
    reducers: {
        updateMessage: (state, {payload: {name, value}}) => {
            state[name] = value;
        }
    }
});

export const selectMessage = (name) => (state) => state[messageSlice.name][name] || null;

export const { updateMessage } = messageSlice.actions;

export const store = configureStore({
    reducer: {
        [messageSlice.name]: messageSlice.reducer,
    },
});

export function updateMessageForName(name, message) {
    store.dispatch(updateMessage({name, value:message}));
}

export function Grandparent(props) {
    return (
        <Provider store={store}>
            <Parent></Parent>
        </Provider>
    )
}

export function Parent(props) {
    return (
        <div className="parent">
            <Child name={'child1'}>

            </Child>
            <Child name={'child2'}>

            </Child>
        </div>
    )
}


export function Child(props) {
    let message = useSelector(selectMessage(props.name));
    return (
        <div className="child">
            <div className="child-name">
                {props.name}
            </div>
            <div className="child-message">
                {message || 'No message found...'}
            </div>
        </div>
    )
}

window.updateMessageForName = updateMessageForName;