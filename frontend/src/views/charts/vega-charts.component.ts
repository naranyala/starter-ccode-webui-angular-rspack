/**
 * Vega Charts Dashboard Component
 * 
 * Showcase of various Vega-Lite chart types
 */

import { Component, signal, inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BarChart3, PieChart, TrendingUp, ScatterChart } from 'lucide-angular';
import { VegaChartsService, ChartSpec } from '../../core/vega-charts.service';

export interface ChartDemo {
  id: string;
  title: string;
  description: string;
  icon: any;
  containerId: string;
}

@Component({
  selector: 'app-vega-charts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="charts-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-brand">
            <div class="logo-wrapper">
              <lucide-angular [img]="icons.BarChart3" size="32" class="logo-icon"></lucide-angular>
            </div>
            <div class="header-text">
              <h1 class="page-title">Vega Charts Gallery</h1>
              <p class="page-subtitle">Interactive data visualizations powered by Vega-Lite</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Bar Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <lucide-angular [img]="icons.BarChart3" size="20"></lucide-angular>
            <h3>Bar Chart</h3>
          </div>
          <div class="chart-body">
            <div #barChartContainer id="bar-chart" class="chart-container"></div>
          </div>
        </div>

        <!-- Line Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <lucide-angular [img]="icons.TrendingUp" size="20"></lucide-angular>
            <h3>Line Chart</h3>
          </div>
          <div class="chart-body">
            <div #lineChartContainer id="line-chart" class="chart-container"></div>
          </div>
        </div>

        <!-- Pie Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <lucide-angular [img]="icons.PieChart" size="20"></lucide-angular>
            <h3>Pie Chart</h3>
          </div>
          <div class="chart-body">
            <div #pieChartContainer id="pie-chart" class="chart-container"></div>
          </div>
        </div>

        <!-- Scatter Plot -->
        <div class="chart-card">
          <div class="chart-header">
            <lucide-angular [img]="icons.ScatterChart" size="20"></lucide-angular>
            <h3>Scatter Plot</h3>
          </div>
          <div class="chart-body">
            <div #scatterChartContainer id="scatter-chart" class="chart-container"></div>
          </div>
        </div>

        <!-- Horizontal Bar Chart -->
        <div class="chart-card chart-card-wide">
          <div class="chart-header">
            <lucide-angular [img]="icons.BarChart3" size="20"></lucide-angular>
            <h3>Horizontal Bar Chart</h3>
          </div>
          <div class="chart-body">
            <div #horizontalBarChartContainer id="horizontal-bar-chart" class="chart-container"></div>
          </div>
        </div>

        <!-- Area Chart -->
        <div class="chart-card chart-card-wide">
          <div class="chart-header">
            <lucide-angular [img]="icons.TrendingUp" size="20"></lucide-angular>
            <h3>Area Chart</h3>
          </div>
          <div class="chart-body">
            <div #areaChartContainer id="area-chart" class="chart-container"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .charts-page {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      color: #fff;
    }

    .page-subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 4px 0 0;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .chart-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s;
    }

    .chart-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }

    .chart-card-wide {
      grid-column: span 2;
    }

    .chart-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      color: #fff;
    }

    .chart-header h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .chart-body {
      padding: 20px;
    }

    .chart-container {
      width: 100%;
      height: 280px;
    }

    @media (max-width: 900px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .chart-card-wide {
        grid-column: span 1;
      }
    }
  `]
})
export class VegaChartsComponent implements OnInit, AfterViewInit {
  private readonly vegaService = inject(VegaChartsService);

  @ViewChild('barChartContainer') barChartContainer!: ElementRef;
  @ViewChild('lineChartContainer') lineChartContainer!: ElementRef;
  @ViewChild('pieChartContainer') pieChartContainer!: ElementRef;
  @ViewChild('scatterChartContainer') scatterChartContainer!: ElementRef;
  @ViewChild('horizontalBarChartContainer') horizontalBarChartContainer!: ElementRef;
  @ViewChild('areaChartContainer') areaChartContainer!: ElementRef;

  readonly icons = { BarChart3, PieChart, TrendingUp, ScatterChart };

  // Sample data
  private readonly salesData = [
    { category: 'Electronics', sales: 45000 },
    { category: 'Clothing', sales: 32000 },
    { category: 'Books', sales: 18000 },
    { category: 'Home', sales: 28000 },
    { category: 'Sports', sales: 22000 },
    { category: 'Toys', sales: 15000 },
  ];

  private readonly trendData = [
    { month: 'Jan', revenue: 12000, expenses: 8000 },
    { month: 'Feb', revenue: 15000, expenses: 9000 },
    { month: 'Mar', revenue: 18000, expenses: 10000 },
    { month: 'Apr', revenue: 22000, expenses: 11000 },
    { month: 'May', revenue: 25000, expenses: 12000 },
    { month: 'Jun', revenue: 30000, expenses: 13000 },
  ];

  private readonly categoryData = [
    { category: 'Electronics', value: 45 },
    { category: 'Clothing', value: 25 },
    { category: 'Books', value: 15 },
    { category: 'Home', value: 10 },
    { category: 'Other', value: 5 },
  ];

  private readonly scatterData = Array.from({ length: 50 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    category: Math.random() > 0.5 ? 'A' : 'B',
  }));

  private readonly areaData = [
    { month: 'Jan', productA: 100, productB: 80, productC: 60 },
    { month: 'Feb', productA: 120, productB: 90, productC: 70 },
    { month: 'Mar', productA: 150, productB: 100, productC: 80 },
    { month: 'Apr', productA: 180, productB: 110, productC: 90 },
    { month: 'May', productA: 200, productB: 120, productC: 100 },
    { month: 'Jun', productA: 220, productB: 130, productC: 110 },
  ];

  ngOnInit(): void {
    // Data is prepared in component
  }

  ngAfterViewInit(): void {
    this.renderAllCharts();
  }

  async renderAllCharts(): Promise<void> {
    await this.renderBarChart();
    await this.renderLineChart();
    await this.renderPieChart();
    await this.renderScatterPlot();
    await this.renderHorizontalBarChart();
    await this.renderAreaChart();
  }

  async renderBarChart(): Promise<void> {
    const spec = this.vegaService.createBarChart(
      this.salesData,
      'category',
      'sales',
      'Sales by Category'
    );
    await this.vegaService.renderChart(this.barChartContainer.nativeElement, spec);
  }

  async renderLineChart(): Promise<void> {
    const spec = this.vegaService.createLineChart(
      this.trendData,
      'month',
      'revenue',
      'Revenue Trend'
    );
    await this.vegaService.renderChart(this.lineChartContainer.nativeElement, spec);
  }

  async renderPieChart(): Promise<void> {
    const spec = this.vegaService.createPieChart(
      this.categoryData,
      'category',
      'value',
      'Category Distribution'
    );
    await this.vegaService.renderChart(this.pieChartContainer.nativeElement, spec);
  }

  async renderScatterPlot(): Promise<void> {
    const spec = this.vegaService.createScatterPlot(
      this.scatterData,
      'x',
      'y',
      'category',
      'Scatter Plot by Category'
    );
    await this.vegaService.renderChart(this.scatterChartContainer.nativeElement, spec);
  }

  async renderHorizontalBarChart(): Promise<void> {
    const spec = this.vegaService.createHorizontalBarChart(
      this.salesData,
      'category',
      'sales',
      'Sales by Category (Horizontal)'
    );
    await this.vegaService.renderChart(this.horizontalBarChartContainer.nativeElement, spec);
  }

  async renderAreaChart(): Promise<void> {
    // Create stacked area data
    const stackedData = [
      ...this.areaData.map(d => ({ ...d, product: 'Product A', value: d.productA })),
      ...this.areaData.map(d => ({ ...d, product: 'Product B', value: d.productB })),
      ...this.areaData.map(d => ({ ...d, product: 'Product C', value: d.productC })),
    ];

    const spec = this.vegaService.createStackedAreaChart(
      stackedData,
      'month',
      'value',
      'product',
      'Product Sales Over Time'
    );
    await this.vegaService.renderChart(this.areaChartContainer.nativeElement, spec);
  }
}
