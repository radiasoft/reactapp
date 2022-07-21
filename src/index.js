import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import MyAppAppRoot from './myapp/myapp';
import { Graph2d } from './visual';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <BrowserRouter>
      <Graph2d scrollFactor={.02}/>
    </BrowserRouter>
);
