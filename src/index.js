const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// In-memory state
let requestsServed = 0;
const startTime = Date.now();
const version = "1.4.2";

// Middleware to count requests
app.use((req, res, next) => {
  requestsServed++;
  next();
});

// Helper to calculate uptime
const getUptimeSeconds = () => Math.floor((Date.now() - startTime) / 1000);

// Load deployments data
const deploymentsPath = path.join(__dirname, '../deployments.json');
let deployments = [];
try {
  deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
} catch (err) {
  console.error("Failed to load deployments.json", err);
}

// Format time ago string
const getTimeAgo = (timestamp) => {
  if (!timestamp) return "unknown time ago";
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

// Format uptime string
const formatUptime = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const remainingM = m % 60;
  if (h < 24) return `${h}h ${remainingM}m`;
  const d = Math.floor(h / 24);
  const remainingH = h % 24;
  return `${d}d ${remainingH}h`;
};

// Endpoints
app.get('/health', (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Intentional health check failure for rollback testing",
    version,
    uptime_seconds: getUptimeSeconds()
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    requests_served: requestsServed,
    uptime_seconds: getUptimeSeconds(),
    deploy_count: deployments.length
  });
});

app.get('/deployments', (req, res) => {
  res.json(deployments);
});

app.get('/', (req, res) => {
  const dashboardPath = path.join(__dirname, 'views/pulseapi-dashboard.html');
  try {
    let html = fs.readFileSync(dashboardPath, 'utf8');

    const currentDeploy = deployments[0] || {};
    const sha = currentDeploy.sha || 'unknown';
    const branch = currentDeploy.branch || 'unknown';
    const msg = currentDeploy.commit_message || 'unknown deployment';
    const timeAgo = getTimeAgo(currentDeploy.timestamp);
    const deployCount = deployments.length;
    const uptime = getUptimeSeconds();
    
    // Replace hardcoded values with actual state
    html = html.replace('Add automatic rollback on failed health check', msg);
    html = html.replace('sha-a3f9c2d', `sha-${sha}`);
    html = html.replace('>main<', `>${branch}<`);
    html = html.replace('deployed 14 minutes ago', `deployed ${timeAgo}`);
    
    // Replace health check output simulation
    html = html.replace(
      '{ "status": "ok", "version": "1.4.2", "uptime_seconds": 1216140 }',
      `{ "status": "ok", "version": "${version}", "uptime_seconds": ${uptime} }`
    );

    // Replace counts in bento grid
    html = html.replace(/data-count="48612"/g, `data-count="${requestsServed}"`);
    html = html.replace(/data-count="27"/g, `data-count="${deployCount}"`);
    
    // Fix Uptime card
    html = html.replace('99.97<span class="unit">%</span>', `${formatUptime(uptime)}`);
    html = html.replace('14d 6h continuous · one 5-min blip (Mar 12) · 0 unplanned restarts', `started ${formatUptime(uptime)} ago · 0 unplanned restarts`);

    // Fix DEPLOYS SHIPPED script variable and caption
    html = html.replace('var deployTotal = 27;', `var deployTotal = ${deployCount};`);
    html = html.replace('0 manual · 27 automated', `latest deploy ${timeAgo}`);

    // Replace the inner text for the deploy count to update it in DOM statically as well, just in case JS fails
    // The HTML has: <div class="card-value" id="deployCount" data-count="27">0</div>
    // We already replaced data-count="27".

    // For history table, replace the hardcoded table with our deployments.json array
    // Wait, the HTML has a hardcoded table for history. If we just want to replace the top entry, we can leave the rest hardcoded or just replace them all.
    // The requirement is "stubbed with one entry for now", which implies we just serve that. We could dynamically build the history rows:
    const historyRowsHtml = deployments.map(dep => {
      const isRolledBack = dep.commit_message.includes('rolled back');
      const statusClass = isRolledBack ? 'h-status rolled' : 'h-status';
      const badgeClass = isRolledBack ? 'h-badge rolled' : 'h-badge';
      const badgeText = isRolledBack ? 'rolled back' : 'healthy';
      return `<div class="history-row"><div class="${statusClass}"></div><div class="h-sha mono">${dep.sha.substring(0,7)}</div><div class="h-msg">${dep.commit_message}</div><div class="${badgeClass}">${badgeText}</div><div class="h-time">${getTimeAgo(dep.timestamp)}</div></div>`;
    }).join('');

    // Regex to replace the contents inside <div class="history-table" id="historyTable"> ... </div>
    html = html.replace(/<div class="history-table" id="historyTable">[\s\S]*?<\/div>\s*<\/section>/, `<div class="history-table" id="historyTable">${historyRowsHtml}</div></section>`);

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Dashboard unavailable');
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`PulseAPI listening at http://localhost:${port}`);
  });
}

module.exports = app;
