let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editIndex = null;
let chart = null;

function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function addTransaction() {
  const desc = document.getElementById('desc').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const date = document.getElementById('date').value || new Date().toISOString().split('T')[0];

  if (!desc || !amount || amount <= 0) {
    alert('Please enter valid description and amount');
    return;
  }

  if (editIndex !== null) {
    transactions[editIndex] = { desc, amount, type, date };
    editIndex = null;
    document.getElementById('submitBtn').textContent = 'Add Transaction';
  } else {
    transactions.push({ desc, amount, type, date });
  }

  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('date').value = '';
  saveData();
  render();
}

function editTransaction(index) {
  const t = transactions[index];
  document.getElementById('desc').value = t.desc;
  document.getElementById('amount').value = t.amount;
  document.getElementById('type').value = t.type;
  document.getElementById('date').value = t.date;
  editIndex = index;
  document.getElementById('submitBtn').textContent = 'Update Transaction';
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveData();
  render();
}

function render() {
  const list = document.getElementById('list');
  list.innerHTML = '';
  let balance = 0, totalIncome = 0, totalExpense = 0;

  const monthFilter = document.getElementById('monthFilter').value;
  const filtered = monthFilter
    ? transactions.filter(t => t.date && t.date.startsWith(monthFilter))
    : transactions;

  filtered.forEach((t) => {
    const realIndex = transactions.indexOf(t);
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;

    const li = document.createElement('li');
    li.innerHTML = `
      <span>
        <span class="${t.type === 'income' ? 'income' : 'expense'}">
          ${t.desc}: ${t.type === 'income' ? '+' : '-'}₹${t.amount}
        </span>
        <span class="date-tag">${t.date || ''}</span>
      </span>
      <span class="btn-group">
        <button class="edit-btn" onclick="editTransaction(${realIndex})">Edit</button>
        <button class="delete-btn" onclick="deleteTransaction(${realIndex})">X</button>
      </span>
    `;
    list.appendChild(li);
  });

  balance = totalIncome - totalExpense;
  document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;
  document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
  document.getElementById('totalExpense').textContent = totalExpense.toFixed(2);

  updateChart(totalIncome, totalExpense);
}

function updateChart(income, expense) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#4ade80', '#f87171']
      }]
    },
    options: {
      plugins: { legend: { labels: { color: '#fff' } } }
    }
  });
}

render();
