const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default metrics (CPU, RAM, Event Loop, GC, Heap)
client.collectDefaultMetrics({
    register,
    prefix: 'portfolio_'
});

// Custom HTTP request counter
const httpRequestCounter = new client.Counter({
    name: 'portfolio_http_requests_total',
    help: 'Total number of HTTP requests made to the portfolio application',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

// Custom HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
    name: 'portfolio_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register]
});

// Database query duration
const dbQueryDuration = new client.Histogram({
    name: 'portfolio_db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1],
    registers: [register]
});

// Active admin sessions gauge
const activeSessionsGauge = new client.Gauge({
    name: 'portfolio_active_admin_sessions_total',
    help: 'Number of currently active admin sessions',
    registers: [register]
});

// Middleware for measuring request metrics
function metricsMiddleware(req, res, next) {
    const start = process.hrtime();

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationInSeconds = diff[0] + diff[1] / 1e9;
        
        // Normalize route path to prevent high cardinality
        let route = req.route ? req.route.path : req.path;
        if (route.startsWith('/project/')) route = '/project/:slug';
        if (route.startsWith('/admin/projects/') && route.includes('/edit')) route = '/admin/projects/:id/edit';

        const labels = {
            method: req.method,
            route: route || req.path,
            status_code: res.statusCode.toString()
        };

        httpRequestCounter.inc(labels);
        httpRequestDuration.observe(labels, durationInSeconds);
    });

    next();
}

module.exports = {
    register,
    metricsMiddleware,
    dbQueryDuration,
    activeSessionsGauge
};
