document.addEventListener('DOMContentLoaded', function() {
  const testButton = document.getElementById('testButton');
  const downloadGauge = document.getElementById('downloadGauge').querySelector('.needle');
  const uploadGauge = document.getElementById('uploadGauge').querySelector('.needle');
  const downloadSpeedText = document.getElementById('downloadSpeed');
  const uploadSpeedText = document.getElementById('uploadSpeed');
  const pingValue = document.getElementById('pingValue');
  const historyList = document.getElementById('historyList');

  let testInProgress = false;
  let downloadSpeed = 0;
  let uploadSpeed = 0;
  let ping = 0;

  // Load history
  loadHistory();

  testButton.addEventListener('click', function() {
    if (testInProgress) return;
    
    testInProgress = true;
    testButton.textContent = 'Testing...';
    testButton.disabled = true;
    
    resetGauges();
    
    // Simulate ping test
    simulatePingTest().then(pingResult => {
      ping = pingResult;
      pingValue.textContent = ping;
      
      // Simulate download test
      return simulateSpeedTest('download');
    }).then(downloadResult => {
      downloadSpeed = downloadResult;
      updateGauge(downloadGauge, downloadSpeed, 100);
      downloadSpeedText.textContent = downloadSpeed.toFixed(1) + ' Mbps';
      
      // Simulate upload test
      return simulateSpeedTest('upload');
    }).then(uploadResult => {
      uploadSpeed = uploadResult;
      updateGauge(uploadGauge, uploadSpeed, 100);
      uploadSpeedText.textContent = uploadSpeed.toFixed(1) + ' Mbps';
      
      // Save results to history
      saveToHistory();
      loadHistory();
    }).finally(() => {
      testButton.textContent = 'Start Test';
      testButton.disabled = false;
      testInProgress = false;
    });
  });

  function resetGauges() {
    updateGauge(downloadGauge, 0, 100);
    updateGauge(uploadGauge, 0, 100);
    downloadSpeedText.textContent = '0 Mbps';
    uploadSpeedText.textContent = '0 Mbps';
    pingValue.textContent = '--';
  }

  function updateGauge(needle, value, max) {
    const rotation = (value / max) * 180 - 90;
    needle.style.transform = `rotate(${rotation}deg)`;
    
    // Change color based on value
    const percentage = (value / max) * 100;
    if (percentage < 30) {
      needle.style.backgroundColor = '#e74c3c'; // Red
    } else if (percentage < 70) {
      needle.style.backgroundColor = '#f39c12'; // Orange
    } else {
      needle.style.backgroundColor = '#2ecc71'; // Green
    }
  }

  function simulatePingTest() {
    return new Promise(resolve => {
      // Simulate network delay
      setTimeout(() => {
        // Random ping between 5ms and 150ms
        const ping = Math.floor(Math.random() * 145) + 5;
        resolve(ping);
      }, 1000);
    });
  }

  function simulateSpeedTest(type) {
    return new Promise(resolve => {
      let speed = 0;
      const maxSpeed = 100; // Maximum speed to show in Mbps
      const interval = setInterval(() => {
        // Simulate speed increasing in Mbps
        speed += Math.random() * 10;
        
        if (type === 'download') {
          updateGauge(downloadGauge, speed, maxSpeed);
          downloadSpeedText.textContent = speed.toFixed(1) + ' Mbps';
        } else {
          updateGauge(uploadGauge, speed, maxSpeed);
          uploadSpeedText.textContent = speed.toFixed(1) + ' Mbps';
        }
        
        // Stop when reaching max speed (random between 80-100 Mbps)
        if (speed >= 80 + Math.random() * 20) {
          clearInterval(interval);
          resolve(speed);
        }
      }, 100);
    });
  }

  function saveToHistory() {
    const timestamp = new Date().toLocaleString();
    const testResult = {
      timestamp,
      download: downloadSpeed,
      upload: uploadSpeed,
      ping
    };
    
    chrome.storage.local.get({history: []}, function(result) {
      const history = result.history;
      history.unshift(testResult);
      if (history.length > 5) history.pop();
      chrome.storage.local.set({history});
    });
  }

  function loadHistory() {
    chrome.storage.local.get({history: []}, function(result) {
      historyList.innerHTML = '';
      result.history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
          <span>${item.timestamp}</span>
          <span>↓${item.download.toFixed(1)}Mbps ↑${item.upload.toFixed(1)}Mbps</span>
        `;
        historyList.appendChild(historyItem);
      });
    });
  }
});