import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-stats-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-container">
      <canvas baseChart
        [data]="radarChartData"
        [options]="radarChartOptions"
        [type]="radarChartType">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      display: block;
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background: var(--bg-card, #fff);
      border-radius: 15px;
    }
  `]
})
export class StatsChartComponent implements OnInit, OnChanges {
  @Input() mental = 0;
  @Input() physical = 0;
  @Input() mindfulness = 0;
  @Input() nutrition = 0;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { display: false },
        grid: { color: 'rgba(0,0,0,0.1)' },
        angleLines: { color: 'rgba(0,0,0,0.1)' },
        pointLabels: { font: { size: 12, weight: 'bold' } }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  public radarChartLabels: string[] = ['Salud Mental', 'Salud Física', 'Mindfulness', 'Nutrición'];

  public radarChartData: ChartData<'radar'> = {
    labels: this.radarChartLabels,
    datasets: [
      {
        data: [0, 0, 0, 0],
        label: 'Progreso Wellness',
        borderColor: '#4facfe',
        backgroundColor: 'rgba(79, 172, 254, 0.2)',
        pointBackgroundColor: '#4facfe',
        pointBorderColor: '#fff',
      }
    ]
  };

  public radarChartType: ChartType = 'radar';

  // Inicializa y dibuja el grafico de bienestar al cargar el componente.
  ngOnInit() {
    this.updateChart();
  }

  // Detecta si los puntos de salud han cambiado y actualiza el grafico.
  ngOnChanges(changes: SimpleChanges) {
    this.updateChart();
  }

  // Inyecta los nuevos datos en el grafico y fuerza a redibujarlo visualmente.
  private updateChart() {
    this.radarChartData.datasets[0].data = [
      this.mental, 
      this.physical, 
      this.mindfulness, 
      this.nutrition
    ];
    
    this.chart?.update();
    this.radarChartData = { ...this.radarChartData };
  }
}