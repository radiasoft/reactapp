import { Zoom } from '@visx/zoom';
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { v4 as uuid4v } from 'uuid'

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

export let Graph2d = (props) => {
    let { scrollFactor } = props;

    let calculateNextViewScaleFactor = (scrollFactor, delta) => {
        console.log("calc");
        return 1 + (scrollFactor * delta);
    }

    return (
        
            <Zoom
            
            height={500} 
            width={500}
            scaleXMax={2}
            scaleXMin={1/2}
            scaleYMax={2}
            scaleYMin={1/2} 
            >
                {(zoom) => (
                    <svg style={{ cursor: zoom.isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                    ref={zoom.containerRef} viewBox='0 0 500 500'>
                        <Child>{zoom.toString()}</Child>
                    </svg>
                )}
            </Zoom>
    )
}