// Performance monitoring utility for GPU performance issues
// This helps detect when the app is struggling with rendering

class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.isMonitoring = false;
    this.performanceThreshold = 30; // FPS threshold for performance issues
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFrame();
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }

  monitorFrame() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    if (deltaTime >= 1000) { // Calculate FPS every second
      const fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.fpsHistory.push(fps);
      
      // Keep only last 10 FPS readings
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift();
      }
      
      // Check for performance issues
      if (fps < this.performanceThreshold) {
        console.warn(`⚠️ Low FPS detected: ${fps} FPS. Consider reducing backdrop blur effects.`);
        this.handlePerformanceIssue();
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    this.frameCount++;
    requestAnimationFrame(() => this.monitorFrame());
  }

  handlePerformanceIssue() {
    // Reduce backdrop blur effects when performance is poor
    const elements = document.querySelectorAll('[class*="backdrop-blur"]');
    elements.forEach(element => {
      // Add a class to reduce blur intensity
      element.classList.add('backdrop-blur-reduced');
    });
    
    console.log(`🔧 Applied performance optimizations to ${elements.length} elements`);
  }

  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 0;
    return Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
  }

  getPerformanceReport() {
    return {
      averageFPS: this.getAverageFPS(),
      currentFPS: this.fpsHistory[this.fpsHistory.length - 1] || 0,
      isStable: this.fpsHistory.every(fps => fps >= this.performanceThreshold),
      history: [...this.fpsHistory]
    };
  }
}

// Create a global instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  performanceMonitor.startMonitoring();
  
  // Log performance report every 10 seconds in development
  setInterval(() => {
    const report = performanceMonitor.getPerformanceReport();
    if (report.averageFPS > 0) {
      console.log('📊 Performance Report:', report);
    }
  }, 10000);
}

export default performanceMonitor;
