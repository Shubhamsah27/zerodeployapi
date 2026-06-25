# ZeroDeploy API 🚀

[![Deploy to Render](https://github.com/Shubhamsah27/zerodeployapi/actions/workflows/deploy.yml/badge.svg)](https://github.com/Shubhamsah27/zerodeployapi/actions/workflows/deploy.yml)
[![Live Status](https://img.shields.io/badge/Live-Render-success)](https://pulseapi-zu03.onrender.com/)

A demonstration of a fully automated, production-grade CI/CD pipeline built around a Node.js API. Every push to `main` securely tests, builds, scans, and deploys the application with zero downtime.

**[🌐 View Live Dashboard](https://pulseapi-zu03.onrender.com/)** | **[🚦 View Health Check](https://pulseapi-zu03.onrender.com/health)**

---

## 🏗️ Architecture Flow

The pipeline is entirely automated using **GitHub Actions**. Here is what happens under the hood when a developer pushes code:

```mermaid
graph TD
    A[Developer Pushes Code] -->|GitHub Actions| B(Test Job: Jest)
    B -->|Passes| C{Build and Scan Job}
    B -->|Fails| X[Halt Pipeline]
    
    C -->|Builds| D[Docker Image]
    D -->|Scans| E[Trivy Vulnerability Scanner]
    E -->|No Critical Vulns| F[Push to GHCR]
    E -->|Vulnerabilities Found| X
    
    F -->|Tagged: latest and SHA| G[Render Webhook]
    G --> H[Render Pulls New Image]
    H --> I{Render Health Check}
    
    I -->|Returns 200 OK| J[Traffic Swapped - Zero Downtime]
    I -->|Returns 500 Error| K[Deploy Cancelled - Old Version Stays Live]
```

---

## 🎥 Pipeline Demonstration

Watch the automated pipeline successfully test, build, scan, and deploy:

![Demo Video](./assets/actions_demo.webp)

---

## ✨ Features

- **Automated Testing:** Jest runs on every push. Bad code fails immediately.
- **Containerized:** Lightweight `node:20-alpine` Docker image.
- **Security Scanned:** Trivy checks the image for High/Critical vulnerabilities before it's allowed to deploy.
- **Immutable Artifacts:** Images are pushed to GHCR (`ghcr.io`) and tagged with their Git commit SHA for instant rollbacks.
- **Zero-Downtime Deployments:** Hosted on Render. Render health-checks the new container before serving live traffic to it.

---

## 💻 Running Locally

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Shubhamsah27/zerodeployapi.git
   cd zerodeployapi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   *The API will be available at `http://localhost:3000`.*

---

## 🛡️ Built With
- **Node.js / Express** - API Framework
- **Jest** - Unit Testing
- **Docker** - Containerization
- **Trivy** - Security Vulnerability Scanning
- **GitHub Actions** - CI/CD Pipeline
- **GitHub Container Registry** - Image Hosting
- **Render** - Cloud Hosting & Deployment
