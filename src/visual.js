import { Zoom } from '@visx/zoom';
import { Axis, ClipPath, Scale, Shape } from '@visx/visx';

/**
 * 
 * @param {{
 *  plots: [
 *      { color, label, points: [{ x: float, y:float }] }
 *  ],
 *  xRange, 
 *  yRange,
 *  xLabel,
 *  yLabel
 * }} props 
 * @returns 
 */
export let Graph2d = (props) => {
    let { width, height, plots, xRange, yRange, xLabel, yLabel } = props;

    let xAxisSize = 30;
    let yAxisSize = 30;

    let margin = 10;

    let graphHeight = height - xAxisSize - margin * 2;
    let graphWidth = width - yAxisSize - margin * 2;

    let xScale = Scale.scaleLinear({
        domain: [xRange.min, xRange.max],
        range: [0, graphWidth],
        round: true
    });

    let yScale = Scale.scaleLinear({
        domain: [yRange.min, yRange.max],
        range: [0, graphHeight],
        round: true
    });

    let toPath = (plot, index) => {
        return (
        <Shape.LinePath key={index} data={plot.points} x={d => xScale(d.x)} y={d => yScale(d.y)} stroke={plot.color}>
            
        </Shape.LinePath>
        )
    }

    let paths = plots.map((plot, i) => toPath(plot, i));

    // TODO: make legend

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