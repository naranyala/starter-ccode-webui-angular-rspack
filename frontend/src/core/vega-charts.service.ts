/**
 * Vega Charts Service
 * 
 * Provides chart rendering capabilities using Vega-Lite
 * 
 * Usage:
 * ```typescript
 * const vegaService = inject(VegaChartsService);
 * await vegaService.renderChart(container, spec);
 * ```
 */

import { Injectable } from '@angular/core';
import embed, { Result } from 'vega-embed';
import { TopLevelSpec } from 'vega-lite';

export interface ChartSpec {
  $schema: string;
  data: {
    values?: any[];
    url?: string;
  };
  mark: string | { type: string; [key: string]: any };
  encoding?: {
    [key: string]: {
      field?: string;
      type?: 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
      axis?: any;
      scale?: any;
    };
  };
  title?: string | { text: string; subtitle?: string };
  width?: number | 'container';
  height?: number;
  [key: string]: any;
}

export interface ChartConfig {
  theme?: 'default' | 'dark' | 'excel' | 'ggplot2';
  width?: number;
  height?: number;
  tooltip?: boolean;
  actions?: boolean;
}

@Injectable({ providedIn: 'root' })
export class VegaChartsService {
  private readonly defaultConfig: ChartConfig = {
    theme: 'dark',
    tooltip: true,
    actions: false,
  };

  /**
   * Render a Vega-Lite chart in a container element
   * @param container Element or selector where chart will be rendered
   * @param spec Vega-Lite specification
   * @param config Optional chart configuration
   */
  async renderChart(
    container: HTMLElement | string,
    spec: any,
    config?: ChartConfig
  ): Promise<Result> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    const embedConfig: any = {
      mode: 'vega-lite',
      theme: mergedConfig.theme,
      tooltip: mergedConfig.tooltip,
      actions: mergedConfig.actions,
      width: mergedConfig.width || 'container',
    };

    try {
      const result = await embed(container, spec, embedConfig);
      return result;
    } catch (error) {
      console.error('Failed to render Vega chart:', error);
      throw error;
    }
  }

  /**
   * Create a bar chart specification
   */
  createBarChart(
    data: any[],
    xField: string,
    yField: string,
    title?: string
  ): ChartSpec {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: 'bar',
      title: title || '',
      width: 'container',
      height: 300,
      encoding: {
        x: { field: xField, type: 'ordinal', axis: { labelAngle: -45 } },
        y: { field: yField, type: 'quantitative', axis: { format: ',' } },
      },
    };
  }

  /**
   * Create a line chart specification
   */
  createLineChart(
    data: any[],
    xField: string,
    yField: string,
    title?: string
  ): ChartSpec {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: { type: 'line', point: true },
      title: title || '',
      width: 'container',
      height: 300,
      encoding: {
        x: { field: xField, type: 'ordinal' },
        y: { field: yField, type: 'quantitative' },
      },
    };
  }

  /**
   * Create a pie chart specification
   */
  createPieChart(
    data: any[],
    categoryField: string,
    valueField: string,
    title?: string
  ): ChartSpec {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      title: title || '',
      width: 'container',
      height: 300,
      mark: 'arc',
      encoding: {
        theta: {
          field: valueField,
          type: 'quantitative',
          scale: { domainMin: 0 },
        },
        color: { field: categoryField, type: 'nominal' },
      },
    };
  }

  /**
   * Create a scatter plot specification
   */
  createScatterPlot(
    data: any[],
    xField: string,
    yField: string,
    colorField?: string,
    title?: string
  ): ChartSpec {
    const spec: ChartSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: 'point',
      title: title || '',
      width: 'container',
      height: 300,
      encoding: {
        x: { field: xField, type: 'quantitative' },
        y: { field: yField, type: 'quantitative' },
      },
    };

    if (colorField) {
      spec.encoding!.color = { field: colorField, type: 'nominal' };
    }

    return spec;
  }

  /**
   * Create an area chart specification
   */
  createAreaChart(
    data: any[],
    xField: string,
    yField: string,
    title?: string
  ): ChartSpec {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: 'area',
      title: title || '',
      width: 'container',
      height: 300,
      encoding: {
        x: { field: xField, type: 'ordinal' },
        y: { field: yField, type: 'quantitative' },
      },
    };
  }

  /**
   * Create a horizontal bar chart specification
   */
  createHorizontalBarChart(
    data: any[],
    categoryField: string,
    valueField: string,
    title?: string
  ): ChartSpec {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: 'bar',
      title: title || '',
      width: 'container',
      height: 300,
      encoding: {
        y: { field: categoryField, type: 'ordinal' },
        x: { field: valueField, type: 'quantitative' },
      },
    };
  }

  /**
   * Create a grouped bar chart specification
   */
  createGroupedBarChart(
    data: any[],
    categoryField: string,
    valueField: string,
    groupField: string,
    title?: string
  ): ChartSpec {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: 'bar',
      title: title || '',
      width: 'container',
      height: 300,
      encoding: {
        x: { field: categoryField, type: 'ordinal' },
        y: { field: valueField, type: 'quantitative' },
        color: { field: groupField, type: 'nominal' },
        xOffset: { field: groupField, type: 'nominal' },
      },
    };
  }

  /**
   * Create a stacked area chart specification
   */
  createStackedAreaChart(
    data: any[],
    xField: string,
    yField: string,
    stackField: string,
    title?: string
  ): any {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: 'area',
      title: title || '',
      width: 'container',
      height: 300,
      encoding: {
        x: { field: xField, type: 'ordinal' },
        y: { field: yField, type: 'quantitative', stack: 'zero' },
        color: { field: stackField, type: 'nominal' },
      },
    };
  }

  /**
   * Destroy a chart and clean up resources
   */
  destroyChart(result: Result): void {
    if (result.view) {
      result.view.finalize();
    }
  }
}
