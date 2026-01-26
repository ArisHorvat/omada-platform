function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}