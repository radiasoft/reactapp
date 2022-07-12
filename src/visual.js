import { interpolateInferno } from 'd3'
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react'
import ReactDOM from 'react-dom'
import { v4 as uuid4v } from 'uuid'

function makeRandomData(width) {
    return Array(width * width).fill(0).map(() => Math.random());
}

function calculateNextViewScale(viewScale, scrollFactor, deltaY) {
    viewScale += (scrollFactor * deltaY);
    return Math.max(.1, Math.min(1, viewScale));
}

const usePortal = (getElementFn, children) => {
    const [element, updateElement] = useState(undefined);
    useLayoutEffect(() => {
        const tempElement = getElementFn();
        updateElement(tempElement);
    }, [false])
    if(element) {
        ReactDOM.createPortal(children, element);
    }
}

function Visuals(props) {
    const { width } = props;
    const [data, updateData] = useState(() => makeRandomData(width));
    const passedProps = {data, ...props};
    /*return (
        <div>
            <VisualB {...passedProps}>

            </VisualB>
        </div>
    )*/
    return <Root/>
}

function VisualA(props) {
    const { imageWidth, imageHeight, scrollFactor } = props;
    const [viewScale, updateViewScale] = useState(1);
    const scroll = event => {
        const nextViewScale = calculateNextViewScale(viewScale, scrollFactor, event.deltaY);
        updateViewScale(nextViewScale);
    }
    return (
        <div className="sr-visual-outer" style={{
            color: 'red',
            width: `${imageWidth}px`, 
            height: `${imageHeight}px`, 
            border: "1px solid black"
        }} onWheel={scroll}>
            <svg width={imageWidth} height={imageHeight} viewBox={`${0} ${0} ${imageWidth * viewScale} ${imageHeight * viewScale}`}>
            <VisualInnerCanvas {...props}></VisualInnerCanvas>
            </svg>
        </div>
    )
}

function ZoomSvgWrapper(props) {
    const { imageWidth, imageHeight, scrollFactor, ...passedProps } = props;
    console.log("ZOOM RENDER");
    const [viewScale, updateViewScale] = useState(1);
    const scroll = event => {
        const nextViewScale = calculateNextViewScale(viewScale, scrollFactor, event.deltaY);
        updateViewScale(nextViewScale);
    }
    return (
        <svg onWheel={scroll} width={imageWidth} height={imageHeight} viewBox={`${0} ${0} ${imageWidth * viewScale} ${imageHeight * viewScale}`} {...passedProps}>
            {props.children}
        </svg>
    )
}

function PortalUser(props) {
    const { containerId } = props;
    usePortal(() => {
        return document.getElementById(containerId);
    }, props.children);

    return <></>
}

function ZoomableSvg(props) {
    const [id, updateId] = useState(() => uuid4v());
    const { imageWidth, imageHeight, scrollFactor } = props;
    return (
        <svg width={imageWidth} height={imageHeight} viewBox={`${0} ${0} ${imageWidth} ${imageHeight}`} xmlns="http://www.w3.org/2000/svg">
            
            <ZoomSvgWrapper id={id} imageWidth={imageWidth} imageHeight={imageHeight} scrollFactor={scrollFactor}>
                {props.children}
            </ZoomSvgWrapper>
        </svg>
    ) 
}

function VisualB(props) {
    const {width,...passedProps} = props;
    const [state, updateState] = useState(undefined);
    useEffect(() => {
        setTimeout(() => {
            updateState({});
        }, 1000)
    })
    return (
        <ZoomableSvg {...passedProps}>
            <VisualInnerCanvas {...props}></VisualInnerCanvas>
        </ZoomableSvg>
    )
}

function VisualInnerRects(props) {
    console.log("VISUAL INNER RENDER");
    const { data, width, imageWidth, imageHeight } = props;
    const u = 1.0 / width;
    const squares = data.map((v, i) => {
        const x = i % width;
        const y = Math.floor(i / width);
        return <rect x={x * u} y={y * u} width={u} height={u} fill={interpolateInferno(v)}></rect>
    })
    return (
        <svg width={imageWidth} height={imageHeight} viewBox={`${0} ${0} ${1} ${1}`}>
            {squares}
        </svg>
    )
}

function VisualInnerCanvas(props) {
    console.log("VISUAL INNER RENDER");
    const { data, width, imageWidth, imageHeight } = props;
    const u = 10;

    const ref = useRef(null);

    useEffect(() => {
        console.log("DRAWING");
        const canvas = ref.current;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        data.forEach((v, i) => {
            const x = i % width;
            const y = Math.floor(i / width);
            ctx.fillStyle = interpolateInferno(v);
            ctx.fillRect(x * u, y * u, u, u);
        });
    }, data);

    return (
        <svg width={imageWidth} height={imageHeight} viewBox={`0 0 ${imageWidth} ${imageHeight}`} xmlns="http://www.w3.org/2000/svg">
            <foreignObject x={0} y={0} width={imageWidth} height={imageHeight}>
                <div style={{position: 'relative', height: '100%', width: '100%'}} xmlns="http://www.w3.org/1999/xhtml">
                    <canvas width={width * u} height={width * u} ref={ref} style={{position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', border: '1px solid #000'}} />
                </div>
                
            </foreignObject>
        </svg>
    )
}

function Root(props) {
    
    console.log("Root render");
    return (
        <X>
            <Y>
                <Z>

                </Z>
            </Y>
        </X>
    )
}

function X(props) {
    const [s, updateS] = useState({});
    useEffect(() => {
        setTimeout(() => {
            updateS({})
        }, 1000)
    })
    console.log("X render");
    return (
        <div>
            <>X Element</>
            {props.children}
        </div>
    )
}

function Y(props) {
    console.log("Y render");
    return (
        <>Y Element</>
    )
}

function Z(props) {
    console.log("Z render");
    return (
        <>Z Element</>
    )
}

export {
    makeRandomData,
    Visuals,
    VisualA,
    VisualB
}