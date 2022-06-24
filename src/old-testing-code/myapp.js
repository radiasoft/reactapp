import React, { useState, useSelector, Fragment, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, Link, BrowserRouter, useResolvedPath, useMatch, useParams, useRoutes, Outlet } from 'react-router-dom';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import './myapp.scss'
import { Row, Col, Container } from 'react-bootstrap';

const simulationPath = createSlice({
    name: 'simulationPath',
    initialState: [],
    reducers: {
        navigateForward: (state, action) => {
            return state.concat([action.payload]);
        },
        navigateBackward: (state) => {
            return state.slice(0, state.length > 0 ? (state.length - 1) : 1);
        },
        navigateToPath: (state, action) => {
            return action.payload;
        } 
    }
})

const selectSimulationPath = (state) => state.simulationPath.value;

const rootReducer = combineReducers({
    simulationPath: simulationPath.reducer
});

const store = configureStore({
    reducer: rootReducer
});

const GenericAppBar = (props) => {

}

const createSimulationPathSubtreeView = (treeRoot, path) => {
    const createTreeFolderView = (item) => {
        const fullPath = "/simulations/" + path + "/" + item.name;
        return (
            <Link to={fullPath} key={fullPath}>{item.name}</Link>
        )
    }

    const createTreeSimulationView = (item) => {
        const fullPath = "/source/" + item.name
        return (
            <div>
                <Link to={fullPath} key={fullPath}>{item.name}</Link>
            </div>
        )
    }

    const isFolder = (item) => {
        return item.children;
    }

    if(!isFolder(treeRoot)) {
        return createTreeSimulationView(treeRoot);
    } else {
        const subPath = path ? path + "/" + treeRoot.name : treeRoot.name;
        const els = treeRoot.children.map(child => createSimulationPathSubtreeView(child, subPath));
        return (
            <>
                {createTreeFolderView(treeRoot)}
                <div className="sr-path-subtree">
                    {els}
                </div>
            </>
        )
    }
}

const SimulationPathTreeView = (props) => {
    return (
        <div className={props.className}>
            {createSimulationPathSubtreeView(props.tree, props.path)}
        </div>
    )
}

const SimulationPathIconView = (props) => {
    const els = props.tree.children.map(child => (
        <Col>
            <Link to={props.path ? props.path + "/" + child.name : child.name}>
                <div className="sr-simulation-browser-thumbnail">
                    <div className="sr-simulation-browser-thumbnail-title">
                        {child.name}
                    </div>
                    <div className="sr-simulation-browser-thumbnail-footer">
                        {child.children ? 'Folder' : 'Item'}
                    </div>
                </div>
            </Link>
        </Col>
    ))

    return (
        <Container className={(props.className && "") + " container-fluid"}>
            <Row className="row-cols-4">
                {els}
            </Row>
        </Container>
    )
}

const tempTree = {
    name: 'home',
    children: [
        {
            name: 'a',
            children: [
                {
                    name: "a1",
                    children: [
                        {
                            name: "a11",
                            children: [
                                {
                                    name: 'X'
                                }
                            ]
                        },
                        {
                            name: "a12",
                            children: [
                                {
                                    name: 'Y'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: 'b',
            children: [
                {
                    name: 'b1',
                    children: [
                        {
                            name: 'A'
                        },
                        {
                            name: 'B'
                        },
                        {
                            name: 'C'
                        }
                    ]
                },
                {
                    name: 'b1',
                    children: [
                        {
                            name: 'D'
                        },
                        {
                            name: 'E'
                        },
                        {
                            name: 'F'
                        }
                    ]
                }
            ]
        }
    ]
}

const SimulationBrowserOuter = (props) => {
    const subtreeRoute = (subtree, path) => {
        var subpath = path ? path + "/" + subtree.name : subtree.name;
        const element = <SimulationBrowser tree={subtree} path={path}></SimulationBrowser>
        if(subtree.children) {
            return {
                path: subtree.name,
                children: [
                    {
                        index: true,
                        element
                    },
                    ...(subtree.children.map(child => subtreeRoute(child, subpath)))
                ]
            }
        }
        return {
            path: subtree.name,
            element
        }
    }
    const routes = [
        subtreeRoute(tempTree), 
        {
            path: "/",
            element: <SimulationBrowser tree={tempTree} path=""></SimulationBrowser>
        },
        {
            path: "*",
            element: <>Not Found!</>
        }
    ]
    let el = useRoutes(routes);
    return el
}

const SimulationBrowser = (props) => {
    return (
        <Container className="sr-simulation-browser">
            <Row sm={2}>
                <Col sm={4}>
                    <SimulationPathTreeView className="sr-simulation-browser-tree" tree={props.tree} path={props.path}></SimulationPathTreeView>
                </Col>
                <Col sm={8}>
                    <SimulationPathIconView className="sr-simulation-browser-thumbnails" tree={props.tree} path={props.path}></SimulationPathIconView>
                </Col>
            </Row>
        </Container>
    )
}

const Swapper = (props) => {
    let [val, setValue] = useState(0);
    let [v2, setV2] = useState(1);
    useEffect(() => {
        //setValue(val + 1);
        console.log(v2);
    })
    setTimeout(() => {
        setValue(val + 1);
    }, 10000)

    const ele = (val % 2 === 0 ? [] : [<div>B</div>]).concat(props.children)
    return (
        <div key={'x'}>
            <div>Swapper version is {val}</div>
            {ele}
        </div>
    )
}

const SomeElement = (props) => {
    console.log("Rendering inner");
    let [val, setValue] = useState(0);
    setTimeout(() => {
        setValue(val + 1);
    }, 4000);
    return (
        <div>
            {props.name} element version is {val}
        </div>
    )
}

const createApp = (app) => {
    const AppBar = app.AppBar || GenericAppBar
    return (props) => (
        <div className="app-outer">
            <Routes>
                <Route path="/" exact element={<Navigate to="/simulations"></Navigate>}></Route>
                <Route path="simulations/*" element={<SimulationBrowserOuter></SimulationBrowserOuter>}></Route>
                <Route path="source/*" element={
                    <Swapper>
                        <SomeElement key={1} name="D"></SomeElement>
                        <Swapper key={2}>
                            <SomeElement key={1} name="A"></SomeElement>
                        </Swapper>
                    </Swapper>
                }></Route>
            </Routes>
            <AppBar></AppBar>
        </div>
    )
}

export default createApp