import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const homeDuration = new Trend('home_page_duration');
const eventsDuration = new Trend('events_list_duration');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Load test scenarios
export const options = {
    scenarios: {
        // Smoke test: quick verification
        smoke: {
            executor: 'constant-vus',
            vus: 5,
            duration: '1m',
            gracefulStop: '30s',
            tags: { test_type: 'smoke' },
            exec: 'smokeTest',
        },
        // Load test: normal traffic
        load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 50 },   // Ramp up to 50 VUs
                { duration: '3m', target: 50 },   // Stay at 50 VUs
                { duration: '1m', target: 0 },    // Ramp down
            ],
            gracefulRampDown: '30s',
            tags: { test_type: 'load' },
            exec: 'loadTest',
        },
        // Stress test: push limits
        stress: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 100 },  // Ramp to 100
                { duration: '3m', target: 200 },  // Push to 200
                { duration: '2m', target: 500 },  // Stress at 500
                { duration: '2m', target: 0 },    // Ramp down
            ],
            gracefulRampDown: '1m',
            tags: { test_type: 'stress' },
            exec: 'stressTest',
            startTime: '6m', // Start after load test
        },
    },
    thresholds: {
        // Success rate thresholds
        'http_req_failed': ['rate<0.01'],        // <1% failed requests
        'errors': ['rate<0.05'],                  // <5% error rate

        // Latency thresholds
        'http_req_duration': ['p(95)<1500'],      // 95% of requests under 1.5s
        'http_req_duration{test_type:smoke}': ['p(99)<500'],
        'http_req_duration{test_type:load}': ['p(95)<1000'],

        // Custom metric thresholds
        'home_page_duration': ['p(95)<800'],
        'events_list_duration': ['p(95)<1200'],
    },
};

// Smoke test - quick sanity check
export function smokeTest() {
    group('Smoke Test - Basic Endpoints', () => {
        // Home page
        const homeRes = http.get(`${BASE_URL}/`);
        check(homeRes, {
            'home status 200': (r) => r.status === 200,
            'home has content': (r) => r.body && r.body.length > 0,
        }) || errorRate.add(1);
        homeDuration.add(homeRes.timings.duration);

        sleep(1);
    });
}

// Load test - typical user traffic
export function loadTest() {
    group('Load Test - User Journey', () => {
        // 1. Home page (40% of traffic)
        if (Math.random() < 0.4) {
            const homeRes = http.get(`${BASE_URL}/`);
            check(homeRes, {
                'home page loads': (r) => r.status === 200,
            }) || errorRate.add(1);
            homeDuration.add(homeRes.timings.duration);
            sleep(Math.random() * 2 + 1);
        }

        // 2. Auth page (20% of traffic)
        if (Math.random() < 0.2) {
            const authRes = http.get(`${BASE_URL}/auth`);
            check(authRes, {
                'auth page loads': (r) => r.status === 200,
            }) || errorRate.add(1);
            sleep(Math.random() * 3 + 1);
        }

        // 3. Check API readiness - simulated event list (30% of traffic)
        if (Math.random() < 0.3) {
            const eventsRes = http.get(`${BASE_URL}/`);
            check(eventsRes, {
                'events accessible': (r) => r.status === 200,
            }) || errorRate.add(1);
            eventsDuration.add(eventsRes.timings.duration);
            sleep(Math.random() * 2 + 1);
        }

        // Think time between actions
        sleep(Math.random() * 3 + 2);
    });
}

// Stress test - high load
export function stressTest() {
    group('Stress Test - High Concurrency', () => {
        // Hammer the home page
        const res = http.get(`${BASE_URL}/`);
        check(res, {
            'response OK under stress': (r) => r.status === 200 || r.status === 503,
            'response time acceptable': (r) => r.timings.duration < 5000,
        }) || errorRate.add(1);

        // Minimal sleep under stress
        sleep(0.5);
    });
}

// Default function for simple runs
export default function () {
    loadTest();
}

// Handle test lifecycle
export function handleSummary(data) {
    return {
        'qa-artifacts/k6-summary.json': JSON.stringify(data, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

// Simple text summary
function textSummary(data, opts) {
    const metrics = data.metrics;
    return `
===============================================
K6 Load Test Summary
===============================================
Total Requests:     ${metrics.http_reqs?.values?.count || 0}
Failed Requests:    ${metrics.http_req_failed?.values?.passes || 0}
Error Rate:         ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%

Latency (http_req_duration):
  - p50: ${metrics.http_req_duration?.values?.['p(50)']?.toFixed(2) || 'N/A'} ms
  - p95: ${metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 'N/A'} ms
  - p99: ${metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 'N/A'} ms
  - max: ${metrics.http_req_duration?.values?.max?.toFixed(2) || 'N/A'} ms

Thresholds: ${data.thresholds ? Object.entries(data.thresholds).map(([k, v]) => `
  ${k}: ${v.ok ? '✓ PASS' : '✗ FAIL'}`).join('') : 'N/A'}
===============================================
`;
}
