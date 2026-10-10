async function loadDashboard() {
  try {
    const statsRes = await fetch('/api/stats');
    if (statsRes.ok) {
      const stats = await statsRes.json();
      document.getElementById('val-revenue').innerText = `$${stats.total_revenue.toFixed(2)}`;
      document.getElementById('val-orders').innerText = stats.total_orders;
      document.getElementById('val-tables').innerText = `${stats.occupied_tables} / ${stats.total_tables}`;
      document.getElementById('val-stock').innerText = stats.low_stock_alerts;
      document.getElementById('system-status').innerText = 'Operational (API Connected)';
    }

    const menuRes = await fetch('/api/menu_items');
    if (menuRes.ok) {
      const menu = await menuRes.json();
      const tbody = document.getElementById('menu-tbody');
      tbody.innerHTML = menu.map(item => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td>${item.category}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td><span style="color: #34d399;">${item.status}</span></td>
          <td><button class="btn-del" onclick="deleteItem(${item.id})">Delete</button></td>
        </tr>
      `).join('');
    }

    const ordersRes = await fetch('/api/orders');
    if (ordersRes.ok) {
      const orders = await ordersRes.json();
      const list = document.getElementById('orders-list');
      list.innerHTML = orders.map(o => `
        <div class="order-item">
          <div>
            <strong>Table ${o.table_number}</strong> — ${o.customer}
            <div style="font-size: 0.7rem; color: #94a3b8;">${new Date(o.created_at).toLocaleTimeString()}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: #38bdf8;">$${o.total.toFixed(2)}</div>
            <span style="font-size: 0.72rem; color: #facc15;">${o.status}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    document.getElementById('system-status').innerText = 'Offline / Connecting...';
  }
}

async function deleteItem(id) {
  if (confirm('Delete this menu item?')) {
    await fetch(`/api/menu_items/${id}`, { method: 'DELETE' });
    loadDashboard();
  }
}

async function createSampleOrder() {
  const table = Math.floor(Math.random() * 5) + 1;
  const total = (Math.random() * 40 + 15).toFixed(2);
  await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_number: table, customer: 'Guest Order', total })
  });
  loadDashboard();
}

async function openAddModal() {
  const name = prompt('Enter item name:');
  if (!name) return;
  const price = prompt('Enter price:');
  if (!price) return;
  await fetch('/api/menu_items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category: 'Mains', price: parseFloat(price) })
  });
  loadDashboard();
}

window.addEventListener('DOMContentLoaded', loadDashboard);
