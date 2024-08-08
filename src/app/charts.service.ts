import { Injectable } from '@angular/core';
import {ChartConfiguration} from "chart.js";

@Injectable({
  providedIn: 'root'
})
export class ChartsService {

  constructor() { }

  private agents = [
    // Define your agents data here
  ];

  resizeCharts2() {
    // Implement resizeCharts2 logic
  }

  agentChartsDimensions() {
    // Implement agentChartsDimensions logic
  }

  getAgents() {
    return this.agents;
  }

  updateAgentData(agent: any) {
    // Redo the Monthly Total Spend Chart
    let min = Math.floor(Math.random() * 200);
    let max = Math.floor(Math.random() * 9500);
    // Update chart data here

    // Redo the Agent Closures by Category chart
    let closuresMin = Math.floor(Math.random() * 200);
    let closuresMax = Math.floor(Math.random() * 500);
    // Update chart data here
  }


  getBarOptions(): ChartConfiguration['options'] {
    return {
      // maxBarThickness: 25,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        xAxis: {
          display: true,
          grid: {
            display: false,
          },
          ticks: {
            color: '#8a8ca4',
            font: {
              size: 10,
            },
          },
        },
        yAxis: {
          display: true,
          grid: {
            color: '#2c2e3e',
            tickLength: 1,
          },
          ticks: {
            callback: function (value) {
              let formatted = value.toLocaleString('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
              });
              formatted = '$' + formatted;
              return formatted;
            },
            stepSize: 25000,
            color: '#8a8ca4',
            font: {
              size: 9,
            },
          },
        },
      },
    };
  }
}
