// import { React }
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
//import { cloneDeep } from 'lodash';

function fetchData() {
    // simulate a delay when requesting data from the server
    return new Promise((resolve) =>
        setTimeout(() => resolve({
            data: {
                "dog": {
                    "breed": "Great Dane " + Math.random(),
                    "disposition": "friendly",
                    "favoriteTreat": "",
                    "gender": "male",
                    "height": 81.28,
                    "weight": 70.25
                },
                "heightWeightReport": {},
                "simFolder": {},
                "simulation": {
                    "documentationUrl": "",
                    "folder": "/",
                    "isExample": true,
                    "lastModified": 1655830938253,
                    "name": "Scooby Doo",
                    "notes": "",
                    "outOfSessionSimulationId": "",
                    "simulationId": "vK42jokQ",
                    "simulationSerial": 1655830938253185
                },
            },
        }), 500)
    );
}

export const loadModelData = createAsyncThunk(
    'loadModelData',
    async () => (await fetchData()).data,
);

export const modelsSlice = createSlice({
    name: 'modelsSlice',
    initialState: {
        isLoaded: false,
        models: {},
    },
    reducers: {
        updateModel: (state, {payload: {name, value}}) => {
            //state.models[action.payload.name] = cloneDeep(action.payload.value);
            state.models = {...state.models};
            state.models[name] = {...state.models[name]};
            state.models[name] = value;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadModelData.fulfilled, (state, {payload}) => {
                state.models = payload;
                state.isLoaded = true;
            });
    },
});

//export const { cancelChanges, saveChanges, updateField } = modelsSlice.actions;
export const { updateModel } = modelsSlice.actions;

export const selectIsLoaded = (state) => {
    return state[modelsSlice.name].isLoaded;
}

export const selectModels = state => {
    return state[modelsSlice.name].models;
}

export const selectModel = name => {
    return state => state[modelsSlice.name].models[name];
}
