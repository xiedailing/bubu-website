// Scales the fixed-size (1312 x 380) emotion chart to its container on wide screens.
const scaler = document.querySelector('.emotion-scaler');
const chart = scaler?.querySelector('.emotion-chart');
const wide = window.matchMedia('(min-width: 1101px)');
const CHART_WIDTH = 1312;
const CHART_HEIGHT = 380;

function fitChart() {
  if (!wide.matches) {
    scaler.style.height = '';
    chart.style.transform = '';
    return;
  }
  const scale = Math.min(1, scaler.clientWidth / CHART_WIDTH);
  chart.style.transform = `scale(${scale})`;
  scaler.style.height = `${CHART_HEIGHT * scale}px`;
}

if (scaler && chart) {
  new ResizeObserver(fitChart).observe(scaler);
  wide.addEventListener('change', fitChart);
  fitChart();
}
