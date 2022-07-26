import { Zoom } from '@visx/zoom';
import { localPoint } from '@visx/event';
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { v4 as uuid4v } from 'uuid'
import { Axis, ClipPath, Point, Scale, Shape } from '@visx/visx';

function makeRandomData(width, height) {
    return Array(width * height).fill(0).map(() => Math.random());
}

/**
 * Zooms "towards" given point
 * @param {d3.ZoomTransform} currentTransform existing zoom transform
 * @param {[number, number]} point point to zoom around
 * @param {number} newScale next zoom scale
 * @return {d3.ZoomTransform} next zoom transform
 */
/*function applyZoomScaleAroundPoint(currentTransform, [ x, y ], newScale) {
    let scaleDiff = newScale - currentTransform.k
    currentTransform = currentTransform.translate(
        -(x * scaleDiff),
        -(y * scaleDiff)
    )
    currentTransform = currentTransform.scale(newScale);
    return currentTransform;
}

// TODO separate zooming math from <g> formatting component
let VisualZoom = (props) => {
    let { scrollFactor } = props;

    let [zoomTransform, updateZoomTransform] = useState(zoomIdentity);

    let calculateNextViewScale = (currentScale, scrollFactor, delta) => {
        return currentScale * (1 - (scrollFactor * delta));
    }

    const scroll = event => {
        const nextViewScale = calculateNextViewScale(zoomTransform.k, scrollFactor, event.deltaY);
        updateZoomTransform(zoomTransform.scale(nextViewScale));
    }

    let transform = `
        translate(${zoomTransform.x} ${zoomTransform.y})
        scale(${zoomTransform.k} ${zoomTransform.k})
    `

    return (
        <g onWheel={scroll} transform={transform}>
            {props.children}
        </g>
    )
}*/

function Child(props) {
    let [r, updateR] = useState(() => uuid4v())

    return (
        <>
            <text x={0} y={150}>
                {props.children}
            </text>
            <text x={0} y={300}>
                {r}
            </text>
        </>
    )
}

/**
 * 
 * @param {{
 *   x: [number],
 *   y: [number] | [[number]]
 * }} props 
 * @returns 
 */
export let Graph2d = (props) => {
    let { width, height, x, y } = props;

    let xAxisSize = 30;
    let yAxisSize = 30;

    let margin = 10;

    let graphHeight = height - xAxisSize - margin * 2;
    let graphWidth = width - yAxisSize - margin * 2;

    if(!Array.isArray(y)) {
        y = [];
    } else if(y.length > 0 && !Array.isArray(y[0])) {
        y = [y];
    }

    let min = (prev, current) => Math.min(prev, current);
    let max = (prev, current) => Math.max(prev, current);

    let xMin = x.reduce(min)
    let xMax = x.reduce(max);

    let yMin = y.map(subArr => subArr.reduce(min)).reduce(min)
    let yMax = y.map(subArr => subArr.reduce(max)).reduce(max)

    let xScale = Scale.scaleLinear({
        domain: [xMin, xMax],
        range: [0, graphWidth],
        round: true
    });

    let yScale = Scale.scaleLinear({
        domain: [yMin, yMax],
        range: [0, graphHeight],
        round: true
    });

    let toPath = (x, y, index) => {
        let data = x.map((v, i) => {return {x:v, y:y[i]}})
        return (
        <Shape.LinePath key={index} data={data} x={d => xScale(d.x)} y={d => yScale(d.y)} stroke={"red"}>
            
        </Shape.LinePath>
        )
    }

    let paths = y.map((subArr, i) => toPath(x, subArr, i));

    let graphX = yAxisSize + margin;
    let graphY = margin;

    return (
        
            <Zoom
            
            height={height} 
            width={width}
            scaleXMax={2}
            scaleXMin={1/2}
            scaleYMax={2}
            scaleYMin={1/2}
            
            
            >
                {(zoom) => {
                    return (
                        <svg
                        height={height}
                        width={width}
                        ref={zoom.containerRef}
                        style={{'textSelect': 'none', 'cursor': 'default'}}
                        >
                            <ClipPath.RectClipPath id={"graph-clip"} width={graphWidth} height={graphHeight}/>
                            <g transform={`translate(${graphX} ${graphY})`} width={graphWidth} height={graphHeight}>
                                <Axis.AxisBottom
                                    stroke={"#888"}
                                    tickStroke={"#888"}
                                    scale={xScale}
                                    top={graphHeight}
                                />
                                <Axis.AxisLeft
                                    stroke={"#888"}
                                    tickStroke={"#888"}
                                    scale={yScale}
                                />
                                <g clipPath="url(#graph-clip)">
                                    <g transform={zoom.toString()} >
                                        {paths}
                                    </g>
                                </g>
                            </g>
                        </svg>
                    )
                }}
            </Zoom>
    )
}