async function checkStatus() {
  const statusElem = document.getElementById("status-text");
  try {
    const res = await fetch("http://localhost:8000/api/status");
    if (res.ok) {
      const data = await res.json();
      statusElem.innerHTML = `<span class="dot online"></span>Connected (FPS: ${data.fps || 0})`;
    } else {
      statusElem.innerHTML = `<span class="dot offline"></span>Server error`;
    }
  } catch (e) {
    statusElem.innerHTML = `<span class="dot offline"></span>Offline (Start backend)`;
  }
}

checkStatus();
setInterval(checkStatus, 3000);
