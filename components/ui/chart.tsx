"use client"

import * as React from "react"
import {
    createChart,
    createSeriesMarkers,
    IChartApi,
    ISeriesApi,
    ISeriesMarkersPluginApi,
    LineSeries,
    AreaSeries,
    BaselineSeries,
    HistogramSeries,
    CandlestickSeries,
    ColorType,
    CrosshairMode,
    LineStyle,
    LineWidth,
    SeriesMarker,
    Time,
    LineSeriesOptions,
    AreaSeriesOptions,
    BaselineSeriesOptions,
    HistogramSeriesOptions,
    CandlestickSeriesOptions,
    DeepPartial,
    ChartOptions,
} from "lightweight-charts"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme-context"

// Theme colors for charts
const THEMES = {
    light: {
        background: "transparent",
        text: "#0f172a",
        grid: "#e2e8f0",
        tooltip: "#ffffff",
        tooltipText: "#0f172a",
    },
    dark: {
        background: "transparent",
        text: "#f8fafc",
        grid: "#334155",
        tooltip: "#1e293b",
        tooltipText: "#f8fafc",
    },
} as const

export type ChartConfig = {
    [k in string]: {
        label?: React.ReactNode
        color?: string
        theme?: {
            light?: string
            dark?: string
        }
    }
}

type ChartContextProps = {
    config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
    const context = React.useContext(ChartContext)
    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />")
    }
    return context
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    config: ChartConfig
    children: React.ReactElement
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
    ({ id, className, children, config, ...props }, ref) => {
        return (
            <ChartContext.Provider value={{ config }}>
                <div
                    ref={ref}
                    className={cn(
                        "flex w-full h-full justify-center text-xs",
                        className
                    )}
                    {...props}
                >
                    {children}
                </div>
            </ChartContext.Provider>
        )
    }
)
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
    const colorConfig = Object.entries(config).filter(
        ([_, config]) => config.theme || config.color
    )

    if (!colorConfig.length) {
        return null
    }

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(
                        ([mode, colors]) => `
${colorConfig
                                .map(([key, itemConfig]) => {
                                    const color =
                                        itemConfig.theme?.[mode as keyof typeof itemConfig.theme] ||
                                        itemConfig.color
                                    return color ? `--color-${key}: ${color};` : null
                                })
                                .join("\n")}
`
                    )
                    .join("\n"),
            }}
        />
    )
}

interface ChartTooltipProps {
    active?: boolean
    payload?: any[]
    label?: string
    formatter?: (value: number, name: string, item: any, index: number, payload: any) => React.ReactNode
    labelFormatter?: (label: string, payload: any) => React.ReactNode
    labelKey?: string
    nameKey?: string
}

const ChartTooltip = ({
    active,
    payload,
    label,
    formatter,
    labelFormatter,
    labelKey,
    nameKey,
}: ChartTooltipProps) => {
    const { config } = useChart()

    if (!active || !payload?.length) {
        return null
    }

    const tooltipLabel = labelKey ? payload[0]?.payload?.[labelKey] : label

    return (
        <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
            <div className="font-medium">
                {labelFormatter
                    ? labelFormatter(tooltipLabel, payload)
                    : tooltipLabel}
            </div>
            <div className="flex flex-col gap-0.5">
                {payload.map((item, index) => {
                    const key = nameKey ? item.payload?.[nameKey] : item.name
                    const itemConfig = config[key as string]
                    const value = item.value as number

                    return (
                        <div
                            key={index}
                            className="flex items-center gap-1.5"
                        >
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{
                                    backgroundColor: itemConfig?.color || item.color,
                                }}
                            />
                            <span className="text-muted-foreground">
                                {itemConfig?.label || key}:
                            </span>
                            <span className="font-medium">
                                {formatter
                                    ? formatter(value, key, item, index, payload)
                                    : value.toLocaleString()}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Line Chart Component using lightweight-charts directly
interface LineChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Array<{ time: Time; value: number }>
    showGrid?: boolean
    showXAxis?: boolean
    showYAxis?: boolean
    lineWidth?: number
    color?: string
    title?: string
    buySignals?: Array<{ time: Time; price: number; shares?: number; grid_level?: number }>
    sellSignals?: Array<{ time: Time; price: number; shares?: number; grid_level?: number }>
}

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
    (
        {
            data,
            showGrid = true,
            showXAxis = true,
            showYAxis = true,
            lineWidth = 2,
            color,
            title,
            buySignals = [],
            sellSignals = [],
            className,
            ...props
        },
        ref
    ) => {
        const chartContainerRef = React.useRef<HTMLDivElement>(null)
        const chartRef = React.useRef<IChartApi | null>(null)
        const seriesRef = React.useRef<ISeriesApi<'Line'> | null>(null)
        const markersRef = React.useRef<ISeriesMarkersPluginApi<Time> | null>(null)
        const { theme } = useTheme()

        // 根据主题确定线条颜色：暗主题白色，亮主题黑色
        const lineColor = color ?? (theme === 'dark' ? '#ffffff' : '#000000')

        // 根据主题确定网格和文字颜色
        const gridColor = theme === 'dark' ? '#334155' : '#e5e7eb'
        const textColor = theme === 'dark' ? '#94a3b8' : '#6b7280'

        // 合并同一天的买卖信号，买入和卖出分开显示
        // 买入标记显示在下方（红色箭头向上），卖出标记显示在上方（绿色箭头向下）
        const allMarkers: SeriesMarker<Time>[] = React.useMemo(() => {
            // 按日期统计买入次数
            const buyCountByDay: Map<string, number> = new Map()
            buySignals.forEach(signal => {
                const timeKey = String(signal.time)
                buyCountByDay.set(timeKey, (buyCountByDay.get(timeKey) || 0) + 1)
            })

            // 按日期统计卖出次数
            const sellCountByDay: Map<string, number> = new Map()
            sellSignals.forEach(signal => {
                const timeKey = String(signal.time)
                sellCountByDay.set(timeKey, (sellCountByDay.get(timeKey) || 0) + 1)
            })

            // 生成买入标记
            const buyMarkers: SeriesMarker<Time>[] = Array.from(buyCountByDay.entries()).map(([time, count]) => ({
                time: time as Time,
                position: 'belowBar' as const,
                color: '#ef4444', // 红色
                shape: 'arrowUp' as const,
                text: count > 1 ? `买x${count}` : '买',
            }))

            // 生成卖出标记
            const sellMarkers: SeriesMarker<Time>[] = Array.from(sellCountByDay.entries()).map(([time, count]) => ({
                time: time as Time,
                position: 'aboveBar' as const,
                color: '#22c55e', // 绿色
                shape: 'arrowDown' as const,
                text: count > 1 ? `卖x${count}` : '卖',
            }))

            // 合并所有标记并按时间排序
            return [...buyMarkers, ...sellMarkers].sort((a, b) => {
                const timeA = typeof a.time === 'string' ? a.time : String(a.time)
                const timeB = typeof b.time === 'string' ? b.time : String(b.time)
                return timeA.localeCompare(timeB)
            })
        }, [buySignals, sellSignals])

        // Create chart and series
        React.useEffect(() => {
            if (!chartContainerRef.current) return

            // Create chart
            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: textColor,
                    fontSize: 10,
                },
                grid: showGrid ? {
                    vertLines: { color: gridColor, style: LineStyle.Solid },
                    horzLines: { color: gridColor, style: LineStyle.Solid },
                } : {
                    vertLines: { visible: false },
                    horzLines: { visible: false },
                },
                rightPriceScale: {
                    visible: showYAxis,
                    borderVisible: false,
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.1,
                    },
                },
                timeScale: {
                    visible: showXAxis,
                    borderVisible: false,
                    timeVisible: true,
                    secondsVisible: false,
                    // 中式日期格式：年-月-日
                    tickMarkFormatter: (time: Time) => {
                        // time可能是字符串格式(如"2024-01-15")或Unix时间戳
                        let date: Date
                        if (typeof time === 'string') {
                            // 已经是日期字符串格式，直接返回
                            return time
                        } else if (typeof time === 'number') {
                            date = new Date(time * 1000)
                        } else {
                            // BusinessDay对象
                            date = new Date(time.year, time.month - 1, time.day)
                        }
                        const year = date.getFullYear()
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const day = String(date.getDate()).padStart(2, '0')
                        return `${year}-${month}-${day}`
                    },
                },
                crosshair: {
                    mode: CrosshairMode.Magnet,
                    vertLine: {
                        color: '#666',
                        width: 1 as LineWidth,
                        style: LineStyle.Dashed,
                        labelBackgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                    },
                    horzLine: {
                        color: '#666',
                        width: 1 as LineWidth,
                        style: LineStyle.Dashed,
                        labelBackgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                    },
                },
                handleScale: {
                    mouseWheel: true,
                    pinch: true,
                    axisPressedMouseMove: true,
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: true,
                },
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            })

            // Create line series
            const lineSeries = chart.addSeries(LineSeries, {
                color: lineColor,
                lineWidth: (lineWidth >= 1 && lineWidth <= 4 ? lineWidth : 2) as LineWidth,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
                priceLineVisible: false,
                lastValueVisible: false,
            })

            // Set data
            lineSeries.setData(data)

            // Set markers using createSeriesMarkers
            if (allMarkers.length > 0) {
                markersRef.current = createSeriesMarkers(lineSeries, allMarkers)
            }

            // Fit content
            chart.timeScale().fitContent()

            // Store refs
            chartRef.current = chart
            seriesRef.current = lineSeries

            // Handle resize
            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight,
                    })
                }
            }

            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
                chart.remove()
                chartRef.current = null
                seriesRef.current = null
                markersRef.current = null
            }
        }, [data, showGrid, showXAxis, showYAxis, lineColor, lineWidth, allMarkers, gridColor, textColor, theme])

        const config: ChartConfig = {
            nav: {
                label: title || "净值",
                color: lineColor,
            },
        }

        return (
            <ChartContainer config={config} className={className} ref={ref} {...props}>
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </ChartContainer>
        )
    }
)
LineChart.displayName = "LineChart"

// Area Chart Component using lightweight-charts directly
interface AreaChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Array<{ time: Time; value: number }>
    showGrid?: boolean
    showXAxis?: boolean
    showYAxis?: boolean
    lineWidth?: number
    color?: string
    fillOpacity?: number
}

const AreaChart = React.forwardRef<HTMLDivElement, AreaChartProps>(
    (
        {
            data,
            showGrid = true,
            showXAxis = true,
            showYAxis = true,
            lineWidth = 2,
            color = "#3b82f6",
            fillOpacity = 0.4,
            className,
            ...props
        },
        ref
    ) => {
        const chartContainerRef = React.useRef<HTMLDivElement>(null)
        const chartRef = React.useRef<IChartApi | null>(null)

        React.useEffect(() => {
            if (!chartContainerRef.current) return

            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#6b7280',
                    fontSize: 12,
                },
                grid: showGrid ? {
                    vertLines: { color: '#e5e7eb', style: LineStyle.Solid },
                    horzLines: { color: '#e5e7eb', style: LineStyle.Solid },
                } : {
                    vertLines: { visible: false },
                    horzLines: { visible: false },
                },
                rightPriceScale: {
                    visible: showYAxis,
                    borderVisible: false,
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.1,
                    },
                },
                timeScale: {
                    visible: showXAxis,
                    borderVisible: false,
                },
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            })

            const areaSeries = chart.addSeries(AreaSeries, {
                topColor: color,
                bottomColor: `${color}00`,
                lineColor: color,
                lineWidth: (lineWidth >= 1 && lineWidth <= 4 ? lineWidth : 2) as LineWidth,
                priceLineVisible: false,
                lastValueVisible: false,
            })

            areaSeries.setData(data)
            chart.timeScale().fitContent()

            chartRef.current = chart

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight,
                    })
                }
            }

            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
                chart.remove()
                chartRef.current = null
            }
        }, [data, showGrid, showXAxis, showYAxis, color, lineWidth, fillOpacity])

        const config: ChartConfig = {
            value: {
                label: "Value",
                color: color,
            },
        }

        return (
            <ChartContainer config={config} className={className} ref={ref} {...props}>
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </ChartContainer>
        )
    }
)
AreaChart.displayName = "AreaChart"

// Bar Chart Component using lightweight-charts directly
interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Array<{ time: Time; value: number; color?: string }>
    showGrid?: boolean
    showXAxis?: boolean
    showYAxis?: boolean
    color?: string
}

const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
    (
        {
            data,
            showGrid = true,
            showXAxis = true,
            showYAxis = true,
            color = "#3b82f6",
            className,
            ...props
        },
        ref
    ) => {
        const chartContainerRef = React.useRef<HTMLDivElement>(null)
        const chartRef = React.useRef<IChartApi | null>(null)

        React.useEffect(() => {
            if (!chartContainerRef.current) return

            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#6b7280',
                    fontSize: 12,
                },
                grid: showGrid ? {
                    vertLines: { color: '#e5e7eb', style: LineStyle.Solid },
                    horzLines: { color: '#e5e7eb', style: LineStyle.Solid },
                } : {
                    vertLines: { visible: false },
                    horzLines: { visible: false },
                },
                rightPriceScale: {
                    visible: showYAxis,
                    borderVisible: false,
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.1,
                    },
                },
                timeScale: {
                    visible: showXAxis,
                    borderVisible: false,
                },
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            })

            const histogramSeries = chart.addSeries(HistogramSeries, {
                color: color,
                priceLineVisible: false,
                lastValueVisible: false,
            })

            histogramSeries.setData(data)
            chart.timeScale().fitContent()

            chartRef.current = chart

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight,
                    })
                }
            }

            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
                chart.remove()
                chartRef.current = null
            }
        }, [data, showGrid, showXAxis, showYAxis, color])

        const config: ChartConfig = {
            value: {
                label: "Value",
                color: color,
            },
        }

        return (
            <ChartContainer config={config} className={className} ref={ref} {...props}>
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </ChartContainer>
        )
    }
)
BarChart.displayName = "BarChart"

// Baseline Chart Component
interface BaselineChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Array<{ time: Time; value: number }>
    showGrid?: boolean
    showXAxis?: boolean
    showYAxis?: boolean
    baseValue?: number
    topColor?: string
    bottomColor?: string
    lineWidth?: number
}

const BaselineChart = React.forwardRef<HTMLDivElement, BaselineChartProps>(
    (
        {
            data,
            showGrid = true,
            showXAxis = true,
            showYAxis = true,
            baseValue = 0,
            topColor = "#22c55e",
            bottomColor = "#ef4444",
            lineWidth = 2,
            className,
            ...props
        },
        ref
    ) => {
        const chartContainerRef = React.useRef<HTMLDivElement>(null)
        const chartRef = React.useRef<IChartApi | null>(null)

        React.useEffect(() => {
            if (!chartContainerRef.current) return

            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#6b7280',
                    fontSize: 12,
                },
                grid: showGrid ? {
                    vertLines: { color: '#e5e7eb', style: LineStyle.Solid },
                    horzLines: { color: '#e5e7eb', style: LineStyle.Solid },
                } : {
                    vertLines: { visible: false },
                    horzLines: { visible: false },
                },
                rightPriceScale: {
                    visible: showYAxis,
                    borderVisible: false,
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.1,
                    },
                },
                timeScale: {
                    visible: showXAxis,
                    borderVisible: false,
                },
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            })

            const baselineSeries = chart.addSeries(BaselineSeries, {
                baseValue: { type: 'price', price: baseValue },
                topFillColor1: topColor,
                topFillColor2: `${topColor}00`,
                bottomFillColor1: bottomColor,
                bottomFillColor2: `${bottomColor}00`,
                lineWidth: (lineWidth >= 1 && lineWidth <= 4 ? lineWidth : 2) as LineWidth,
                priceLineVisible: false,
                lastValueVisible: false,
            })

            baselineSeries.setData(data)
            chart.timeScale().fitContent()

            chartRef.current = chart

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight,
                    })
                }
            }

            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
                chart.remove()
                chartRef.current = null
            }
        }, [data, showGrid, showXAxis, showYAxis, baseValue, topColor, bottomColor, lineWidth])

        const config: ChartConfig = {
            value: {
                label: "Value",
                color: topColor,
            },
        }

        return (
            <ChartContainer config={config} className={className} ref={ref} {...props}>
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </ChartContainer>
        )
    }
)
BaselineChart.displayName = "BaselineChart"

// Candlestick Chart Component
interface CandlestickChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Array<{ time: Time; open: number; high: number; low: number; close: number }>
    showGrid?: boolean
    showXAxis?: boolean
    showYAxis?: boolean
    upColor?: string
    downColor?: string
}

const CandlestickChart = React.forwardRef<HTMLDivElement, CandlestickChartProps>(
    (
        {
            data,
            showGrid = true,
            showXAxis = true,
            showYAxis = true,
            upColor = "#22c55e",
            downColor = "#ef4444",
            className,
            ...props
        },
        ref
    ) => {
        const chartContainerRef = React.useRef<HTMLDivElement>(null)
        const chartRef = React.useRef<IChartApi | null>(null)

        React.useEffect(() => {
            if (!chartContainerRef.current) return

            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#6b7280',
                    fontSize: 12,
                },
                grid: showGrid ? {
                    vertLines: { color: '#e5e7eb', style: LineStyle.Solid },
                    horzLines: { color: '#e5e7eb', style: LineStyle.Solid },
                } : {
                    vertLines: { visible: false },
                    horzLines: { visible: false },
                },
                rightPriceScale: {
                    visible: showYAxis,
                    borderVisible: false,
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.1,
                    },
                },
                timeScale: {
                    visible: showXAxis,
                    borderVisible: false,
                },
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            })

            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: upColor,
                downColor: downColor,
                borderUpColor: upColor,
                borderDownColor: downColor,
                wickUpColor: upColor,
                wickDownColor: downColor,
                priceLineVisible: false,
                lastValueVisible: false,
            })

            candlestickSeries.setData(data)
            chart.timeScale().fitContent()

            chartRef.current = chart

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight,
                    })
                }
            }

            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
                chart.remove()
                chartRef.current = null
            }
        }, [data, showGrid, showXAxis, showYAxis, upColor, downColor])

        const config: ChartConfig = {
            value: {
                label: "Value",
                color: upColor,
            },
        }

        return (
            <ChartContainer config={config} className={className} ref={ref} {...props}>
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </ChartContainer>
        )
    }
)
CandlestickChart.displayName = "CandlestickChart"

export {
    ChartContainer,
    ChartStyle,
    ChartTooltip,
    LineChart,
    AreaChart,
    BarChart,
    BaselineChart,
    CandlestickChart,
}