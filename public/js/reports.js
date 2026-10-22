// Reports — all data loaded from real API and rendered using Highcharts
(function () {
  if (!window.Highcharts) return;

  var PEAK_HOURS = [];
  var STAFF_PERFORMANCE = [];
  var TOP_SERVICES = [];
  var DAILY_REVENUE = [];
  var KPIS = {};
  var MONTH_LABEL = '';

  var peakChart, staffChart, servicesChart, dailyChart;

  var dailyChartType = 'area';
  var servicesChartType = 'bar';
  var peakChartType = 'column';
  var staffChartType = 'bar';

  function themeColor(v) {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }

  function formatRupees(num) {
    num = Number(num) || 0;
    if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + 'L';
    if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + 'K';
    return '₹' + num.toFixed(0);
  }

  function baseChartOpts() {
    return {
      chart: { backgroundColor: 'transparent', style: { fontFamily: 'Inter, -apple-system, sans-serif' }, spacing: [16, 12, 12, 12] },
      title: { text: null },
      credits: { enabled: false },
      exporting: { enabled: false },
      legend: { enabled: false }
    };
  }

  function buildDailyRevenueChart() {
    var accent = themeColor('--accent') || '#cddc39';
    var accentDim = themeColor('--accent-dim') || 'rgba(205,220,57,0.22)';
    var borderColor = themeColor('--border') || '#444';
    var textColor = themeColor('--text-3') || '#aaa';
    var text1 = themeColor('--text-1') || '#fff';
    var surface2 = themeColor('--surface-2') || '#333';

    if (dailyChart) dailyChart.destroy();

    if (DAILY_REVENUE.length === 0) {
      document.getElementById('dailyRevenueChart').innerHTML = '<div class="report-empty"><div class="report-empty-title">No revenue yet</div><div class="report-empty-body">Completed and paid invoices will appear here.</div></div>';
      return;
    }

    dailyChart = Highcharts.chart('dailyRevenueChart', Object.assign(baseChartOpts(), {
      chart: Object.assign(baseChartOpts().chart, { type: dailyChartType }),
      xAxis: {
        categories: DAILY_REVENUE.map(function (d) { return d.date; }),
        lineColor: borderColor, tickColor: borderColor,
        labels: { style: { color: textColor, fontSize: '10px' }, step: Math.ceil(DAILY_REVENUE.length / 8) }
      },
      yAxis: {
        title: { text: null }, gridLineColor: borderColor,
        labels: {
          style: { color: textColor, fontSize: '10px' },
          formatter: function () { return '₹' + (this.value >= 1000 ? (this.value / 1000) + 'K' : this.value); }
        }
      },
      tooltip: {
        backgroundColor: surface2, borderColor: borderColor, borderRadius: 8,
        style: { color: text1, fontSize: '12.5px' },
        formatter: function () { return '<b>' + this.key + '</b><br>₹' + this.y.toLocaleString('en-IN'); }
      },
      plotOptions: {
        series: {
          borderRadius: 4, borderWidth: dailyChartType === 'column' ? 0 : 1.5, lineColor: accent, color: accent,
          fillColor: dailyChartType === 'area' ? {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [[0, accentDim], [1, 'rgba(0,0,0,0)']]
          } : undefined,
          marker: { enabled: dailyChartType !== 'column' && DAILY_REVENUE.length <= 7, radius: 3 },
          pointPadding: 0.15, groupPadding: 0.08,
          states: { hover: { brightness: 0.1 } }
        }
      },
      series: [{ name: 'Revenue', data: DAILY_REVENUE.map(function (d) { return d.amount; }) }]
    }));
  }

  function buildTopServicesChart() {
    var accent = themeColor('--accent') || '#cddc39';
    var borderColor = themeColor('--border') || '#444';
    var textColor = themeColor('--text-3') || '#aaa';
    var text1 = themeColor('--text-1') || '#fff';
    var surface2 = themeColor('--surface-2') || '#333';

    if (servicesChart) servicesChart.destroy();

    if (TOP_SERVICES.length === 0) {
      document.getElementById('topServicesChart').innerHTML = '<div class="report-empty"><div class="report-empty-title">No completed services yet</div><div class="report-empty-body">Once washes are completed, top services will appear here.</div></div>';
      return;
    }

    var sorted = TOP_SERVICES.slice().sort(function (a, b) { return a.count - b.count; });

    servicesChart = Highcharts.chart('topServicesChart', Object.assign(baseChartOpts(), {
      chart: Object.assign(baseChartOpts().chart, { type: servicesChartType, spacing: [16, 16, 12, 12] }),
      xAxis: {
        categories: sorted.map(function (s) { return s.name; }),
        lineColor: borderColor, tickColor: borderColor,
        labels: { style: { color: textColor, fontSize: '11px' } }
      },
      yAxis: {
        title: { text: null }, gridLineColor: borderColor, allowDecimals: false,
        labels: { style: { color: textColor, fontSize: '10.5px' } }
      },
      tooltip: {
        backgroundColor: surface2, borderColor: borderColor, borderRadius: 8,
        style: { color: text1, fontSize: '12.5px' },
        formatter: function () { return '<b>' + this.key + '</b><br>' + this.y + ' cars'; }
      },
      plotOptions: {
        series: { borderRadius: 4, borderWidth: 0, color: accent, pointPadding: 0.15, groupPadding: 0.08, states: { hover: { brightness: 0.15 } } }
      },
      series: [{ name: 'Cars serviced', data: sorted.map(function (s) { return s.count; }) }]
    }));
  }

  function buildPeakChart() {
    var accent = themeColor('--accent') || '#cddc39';
    var accentDim = themeColor('--accent-dim') || 'rgba(205,220,57,0.22)';
    var borderColor = themeColor('--border') || '#444';
    var textColor = themeColor('--text-3') || '#aaa';
    var text1 = themeColor('--text-1') || '#fff';
    var surface2 = themeColor('--surface-2') || '#333';

    if (peakChart) peakChart.destroy();

    if (PEAK_HOURS.length === 0) {
      document.getElementById('peakHoursChart').innerHTML = '<div class="report-empty"><div class="report-empty-title">No peak-hour data yet</div><div class="report-empty-body">Completed wash timing will populate this chart.</div></div>';
      return;
    }

    var maxCars = Math.max.apply(null, PEAK_HOURS.map(function (p) { return p.cars; })) || 1;
    var data = PEAK_HOURS.map(function (p) {
      return { y: p.cars, color: p.cars === maxCars && p.cars > 0 ? accent : accentDim };
    });

    peakChart = Highcharts.chart('peakHoursChart', Object.assign(baseChartOpts(), {
      chart: Object.assign(baseChartOpts().chart, { type: peakChartType }),
      xAxis: {
        categories: PEAK_HOURS.map(function (p) { return p.hour; }),
        lineColor: borderColor, tickColor: borderColor,
        labels: { style: { color: textColor, fontSize: '10.5px' } }
      },
      yAxis: {
        title: { text: null }, gridLineColor: borderColor, allowDecimals: false,
        labels: { style: { color: textColor, fontSize: '10.5px' } }
      },
      tooltip: {
        backgroundColor: surface2, borderColor: borderColor, borderRadius: 8,
        style: { color: text1, fontSize: '12.5px' },
        formatter: function () { return '<b>' + this.key + '</b><br>' + this.y + ' cars serviced'; }
      },
      plotOptions: {
        series: { borderRadius: 4, borderWidth: 0, lineColor: accent, marker: { enabled: peakChartType !== 'column' }, pointPadding: 0.15, groupPadding: 0.08, states: { hover: { brightness: 0.15 } } }
      },
      series: [{ name: 'Cars serviced', data: data }]
    }));
  }

  function buildStaffChart() {
    var accent = themeColor('--accent') || '#cddc39';
    var borderColor = themeColor('--border') || '#444';
    var textColor = themeColor('--text-3') || '#aaa';
    var text1 = themeColor('--text-1') || '#fff';
    var surface2 = themeColor('--surface-2') || '#333';

    if (staffChart) staffChart.destroy();

    if (STAFF_PERFORMANCE.length === 0) {
      document.getElementById('staffPerformanceChart').innerHTML = '<div class="report-empty"><div class="report-empty-title">No staff performance data yet</div><div class="report-empty-body">Completed jobs per staff member will appear here.</div></div>';
      return;
    }

    var sorted = STAFF_PERFORMANCE.slice().sort(function (a, b) { return a.jobs - b.jobs; });

    staffChart = Highcharts.chart('staffPerformanceChart', Object.assign(baseChartOpts(), {
      chart: Object.assign(baseChartOpts().chart, { type: staffChartType, spacing: [16, 16, 12, 12] }),
      xAxis: {
        categories: sorted.map(function (s) { return s.name; }),
        lineColor: borderColor, tickColor: borderColor,
        labels: { style: { color: textColor, fontSize: '11px' } }
      },
      yAxis: {
        title: { text: null }, gridLineColor: borderColor, allowDecimals: false,
        labels: { style: { color: textColor, fontSize: '10.5px' } }
      },
      tooltip: {
        backgroundColor: surface2, borderColor: borderColor, borderRadius: 8,
        style: { color: text1, fontSize: '12.5px' },
        formatter: function () { return '<b>' + this.key + '</b><br>' + this.y + ' jobs completed'; }
      },
      plotOptions: {
        series: { borderRadius: 4, borderWidth: 0, color: accent, pointPadding: 0.15, groupPadding: 0.08, states: { hover: { brightness: 0.15 } } }
      },
      series: [{ name: 'Jobs completed', data: sorted.map(function (s) { return s.jobs; }) }]
    }));
  }

  function buildAllCharts() {
    buildDailyRevenueChart();
    buildTopServicesChart();
    buildPeakChart();
    buildStaffChart();
  }

  function updateDelta(elId, val, isExpense) {
    var el = document.getElementById(elId);
    if (!el) return;
    val = Number(val) || 0;
    if (val === 0) {
      el.textContent = 'vs last month';
      el.className = 'kpi-delta';
    } else {
      var sign = val > 0 ? '+' : '';
      el.textContent = sign + val + '% vs last month';
      if (isExpense) {
        el.className = 'kpi-delta ' + (val >= 0 ? 'down' : 'up');
      } else {
        el.className = 'kpi-delta ' + (val >= 0 ? 'up' : 'down');
      }
    }
  }

  function setChartTypeSelect(selectId, labelId, setType, rebuild) {
    var select = document.getElementById(selectId);
    if (!select) return;
    select.addEventListener('change', function () {
      setType(this.value);
      var label = document.getElementById(labelId);
      if (label) label.textContent = this.options[this.selectedIndex].text;
      rebuild();
    });
  }

  async function loadReportsData(timeframe) {
    if (!timeframe) {
      var select = document.getElementById('timeframeSelect');
      timeframe = select ? select.value : 'monthly';
    }
    try {
      var res = await fetch('/api/reports/data?timeframe=' + timeframe);
      if (!res.ok) return;
      var data = await res.json();

      PEAK_HOURS = data.peakHours || [];
      STAFF_PERFORMANCE = data.staffPerformance || [];
      TOP_SERVICES = data.topServices || [];
      DAILY_REVENUE = data.dailyRevenue || [];
      KPIS = data.kpis || {};
      MONTH_LABEL = data.monthLabel || 'This Month';

      var periodEl = document.getElementById('reportPeriod');
      if (periodEl) periodEl.textContent = MONTH_LABEL;

      var revEl = document.getElementById('kpiRevenue');
      if (revEl) revEl.textContent = formatRupees(KPIS.revenue);

      var expEl = document.getElementById('kpiExpenses');
      if (expEl) expEl.textContent = formatRupees(KPIS.expenses);

      var prfEl = document.getElementById('kpiProfit');
      if (prfEl) prfEl.textContent = formatRupees(KPIS.profit);

      var repEl = document.getElementById('kpiRepeatPercentage');
      if (repEl) repEl.textContent = KPIS.repeatPercentage + '%';

      updateDelta('kpiRevenueDelta', KPIS.revenueDelta, false);
      updateDelta('kpiExpensesDelta', KPIS.expensesDelta, true);
      updateDelta('kpiProfitDelta', KPIS.profitDelta, false);

      var repDelta = document.getElementById('kpiRepeatDelta');
      if (repDelta) {
        repDelta.textContent = KPIS.repeatPercentage > 0 ? KPIS.repeatPercentage + '% of customers are repeat' : 'No repeat data yet';
        repDelta.className = 'kpi-delta ' + (KPIS.repeatPercentage > 50 ? 'up' : '');
      }

      buildAllCharts();
    } catch (err) {
      console.error('Failed to load reports data:', err);
    }
  }

  var timeframeSelect = document.getElementById('timeframeSelect');
  // Dashboard revenue cards link here with ?timeframe=daily|weekly|monthly
  var requestedTimeframe = new URLSearchParams(window.location.search).get('timeframe');
  if (timeframeSelect && requestedTimeframe && timeframeSelect.querySelector('option[value="' + requestedTimeframe + '"]')) {
    timeframeSelect.value = requestedTimeframe;
  }

  loadReportsData();

  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', function() {
      loadReportsData(this.value);
    });
  }

  document.addEventListener('sw:themechange', buildAllCharts);

  setChartTypeSelect('dailyRevenueChartType', 'dailyRevenueChartTypeLabel', function (v) { dailyChartType = v; }, buildDailyRevenueChart);
  setChartTypeSelect('topServicesChartType', 'topServicesChartTypeLabel', function (v) { servicesChartType = v; }, buildTopServicesChart);
  setChartTypeSelect('peakHoursChartType', 'peakHoursChartTypeLabel', function (v) { peakChartType = v; }, buildPeakChart);
  setChartTypeSelect('staffPerformanceChartType', 'staffPerformanceChartTypeLabel', function (v) { staffChartType = v; }, buildStaffChart);

  var exportBtn = document.getElementById('exportReportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var lines = [
        'Reports and analytics — ' + MONTH_LABEL,
        '',
        'Summary',
        'Revenue,' + formatRupees(KPIS.revenue),
        'Expenses,' + formatRupees(KPIS.expenses),
        'Profit,' + formatRupees(KPIS.profit),
        'Repeat customers,' + KPIS.repeatPercentage + '%',
        '',
        'Daily Revenue,Amount',
      ];
      DAILY_REVENUE.forEach(function (d) { lines.push(d.date + ',' + d.amount); });
      lines.push('', 'Top Services,Cars');
      TOP_SERVICES.forEach(function (s) { lines.push(s.name + ',' + s.count); });
      lines.push('', 'Peak hours,Cars serviced');
      PEAK_HOURS.forEach(function (p) { lines.push(p.hour + ',' + p.cars); });
      lines.push('', 'Staff,Jobs completed');
      STAFF_PERFORMANCE.forEach(function (s) { lines.push(s.name + ',' + s.jobs); });

      var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'report-' + MONTH_LABEL.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.SW) window.SW.showToast('Report exported');
    });
  }
})();
