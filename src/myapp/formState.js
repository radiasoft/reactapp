// import { React }
import { createSlice } from '@reduxjs/toolkit';
//import { cloneDeep } from 'lodash';

export const formStatesSlice = createSlice({
    name: 'formStates',
    initialState: {},
    reducers: {
        updateFormState: (state, action) => {
            //state[action.payload.name] = cloneDeep(action.payload.value);
            state[action.payload.name] = action.payload.value;
        },
        updateFormFieldState: (state, action) => {
            state[action.payload.name][action.payload.field] = action.payload.value;
        },
    }
});

export const selectFormState = (name) => (state) => state.formStates[name] || null;

export const { updateFormState, updateFormFieldState } = formStatesSlice.actions;
