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
        updateModel: (state, action) => {
            console.log('updateModel:', action.payload);
            //state.models[action.payload.name] = cloneDeep(action.payload.value);
            state.models[action.payload.name] = action.payload.value;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadModelData.fulfilled, (state, action) => {
                state.models = action.payload;
                state.isLoaded = true;
            });
    },
});

//export const { cancelChanges, saveChanges, updateField } = modelsSlice.actions;
export const { updateModel } = modelsSlice.actions;

const modelSelectorCache = {};

export const selectIsLoaded = (state) => {
    return state[modelsSlice.name].isLoaded;
}

export const selectModel = name => {
    if (! modelSelectorCache[name]) {
        modelSelectorCache[name] = state => state[modelsSlice.name].models[name];
    }
    return modelSelectorCache[name];
}
