# Vega Charts Integration Guide

## Overview

This application now includes a comprehensive Vega-Lite charts integration for data visualization. The charts are rendered using the Vega-Embed library, which provides interactive, publication-quality visualizations.

## Features

- **6 Chart Types**: Bar, Line, Pie, Scatter, Horizontal Bar, and Area charts
- **Interactive**: Tooltips, zoom, and pan capabilities
- **Responsive**: Charts adapt to container size
- **Dark Theme**: Consistent with application design
- **Easy to Extend**: Add new chart types with minimal code

## Menu Structure

The **Vega Charts** menu is the third group in the sidebar:

```
Documentation ▼
Database Demos ▼
Vega Charts ▼         ← New menu group
  📈 Charts Gallery    ← Main charts showcase
```

## Chart Types

### 1. Bar Chart
- **Purpose**: Compare values across categories
- **Data**: Sales by category
- **Features**: Vertical bars, category labels

### 2. Line Chart
- **Purpose**: Show trends over time
- **Data**: Revenue trend over months
- **Features**: Points on line, temporal x-axis

### 3. Pie Chart
- **Purpose**: Show proportions of a whole
- **Data**: Category distribution
- **Features**: Arc marks, color encoding

### 4. Scatter Plot
- **Purpose**: Show relationship between two variables
- **Data**: Random points with categories
- **Features**: Color-coded categories, quantitative axes

### 5. Horizontal Bar Chart
- **Purpose**: Compare values with long category names
- **Data**: Sales by category (horizontal)
- **Features**: Horizontal orientation

### 6. Area Chart
- **Purpose**: Show volume under line, stacked comparisons
- **Data**: Product sales over time
- **Features**: Stacked areas, multiple series

## Technical Implementation

### Service Layer

**File**: `frontend/src/core/vega-charts.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class VegaChartsService {
  async renderChart(container, spec, config?): Promise<Result>
  createBarChart(data, xField, yField, title?): ChartSpec
  createLineChart(data, xField, yField, title?): ChartSpec
  createPieChart(data, categoryField, valueField, title?): ChartSpec
  createScatterPlot(data, xField, yField, colorField?, title?): ChartSpec
  createHorizontalBarChart(data, categoryField, valueField, title?): ChartSpec
  createStackedAreaChart(data, xField, yField, stackField, title?): any
}
```

### Component Layer

**File**: `frontend/src/views/charts/vega-charts.component.ts`

```typescript
@Component({
  selector: 'app-vega-charts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `...`,
})
export class VegaChartsComponent implements OnInit, AfterViewInit {
  private readonly vegaService = inject(VegaChartsService);
  
  ngAfterViewInit(): void {
    this.renderAllCharts();
  }
}
```

## Dependencies

```json
{
  "vega": "^5.33.1",
  "vega-embed": "^6.29.0",
  "vega-lite": "^5.23.0"
}
```

## Usage Examples

### Creating a Simple Bar Chart

```typescript
import { VegaChartsService } from '../../core/vega-charts.service';

const vegaService = inject(VegaChartsService);

const data = [
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'C', value: 15 },
];

const spec = vegaService.createBarChart(data, 'category', 'value', 'My Chart');

await vegaService.renderChart(containerElement, spec);
```

### Custom Chart Specification

```typescript
const customSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: { values: myData },
  mark: 'bar',
  encoding: {
    x: { field: 'category', type: 'ordinal' },
    y: { field: 'value', type: 'quantitative' },
    color: { field: 'category', type: 'nominal' },
  },
};

await vegaService.renderChart(container, customSpec, {
  theme: 'dark',
  tooltip: true,
});
```

## Configuration Options

```typescript
interface ChartConfig {
  theme?: 'default' | 'dark' | 'excel' | 'ggplot2';
  width?: number;
  height?: number;
  tooltip?: boolean;
  actions?: boolean;
}
```

## Adding New Chart Types

### Step 1: Add Method to Service

```typescript
// vega-charts.service.ts
createNewChartType(data: any[], ...): any {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: data },
    mark: '...',
    encoding: { ... },
  };
}
```

### Step 2: Create Component

```typescript
// my-chart.component.ts
@Component({
  selector: 'app-my-chart',
  template: `<div #chartContainer class="chart-container"></div>`,
})
export class MyChartComponent implements AfterViewInit {
  @ViewChild('chartContainer') container!: ElementRef;
  private readonly vegaService = inject(VegaChartsService);
  
  ngAfterViewInit(): void {
    const spec = this.vegaService.createNewChartType(data, ...);
    this.vegaService.renderChart(this.container.nativeElement, spec);
  }
}
```

### Step 3: Add to Dashboard Menu

```typescript
// dashboard.component.ts
chartsItems = signal<NavItem[]>([
  { id: 'charts_gallery', label: 'Charts Gallery', icon: '📈' },
  { id: 'my_chart', label: 'My Chart', icon: '📊' },  // New item
]);
```

## Troubleshooting

### Chart Not Rendering

1. Check container element exists
2. Verify data format matches specification
3. Check browser console for errors
4. Ensure Vega dependencies are loaded

### TypeScript Errors

The service uses `any` types for flexibility with Vega-Lite specs. If you encounter type errors:

```typescript
const spec: any = { ... };
await vegaService.renderChart(container, spec);
```

### Performance Issues

For large datasets:
1. Use data sampling
2. Enable canvas rendering: `config: { mark: { discrete: false } }`
3. Reduce chart complexity

## Resources

- [Vega-Lite Documentation](https://vega.github.io/vega-lite/)
- [Vega-Embed Documentation](https://github.com/vega/vega-embed)
- [Vega Examples Gallery](https://vega.github.io/vega-lite/examples/)

## Future Enhancements

Potential improvements:
- [ ] Real-time data updates
- [ ] Chart export (PNG, SVG)
- [ ] Custom color schemes
- [ ] Interactive filtering
- [ ] Drill-down capabilities
- [ ] Chart combinations (layered plots)
