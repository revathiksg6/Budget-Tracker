let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let recurringItems = JSON.parse(localStorage.getItem('recurringItems')) || [];
let budgetLimit = parseFloat(localStorage.getItem('budgetLimit')) || 0;
let savingsGoal = parseFloat(localStorage.getItem('savingsGoal')) || 0;
let editIndex = null;
let chart = null;

// ---------- THEME ----------
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isLight ? '☀️' : '🌙';
}
(function loadTheme() {
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('themeBtn').textContent = '☀️';
    });
  }
})();

// ---------- SAVE ----------
function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('recurringItems', JSON.stringify(recurringItems));
}

// ---------- ADD / EDIT TRANSACTION ----------
function addTransaction() {
  const desc = document.getElementById('desc').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value || new Date().toISOString().split('T')[0];
  const isRecurring = document.getElementById('recurring').checked;

  if (!desc || !amount || amount <= 0) {
    alert('Please enter valid description and amount');
    return;
  }

  const entry = { desc, amount, type, category, date };

  if (editIndex !== null) {
    transactions[editIndex] = entry;
    editIndex = null;
    document.getElementById('submitBtn').textContent = 'Add Transaction';
  } else {
    transactions.push(entry);
    if (isRecurring) {
      recurringItems.push({ desc, amount, type, category, lastMonth: date.slice(0, 7) });
    }
  }

  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('date').value = '';
  document.getElementById('recurring').checked = false;

  saveData();
  render();
}

function editTransaction(index) {
  const t = transactions[index];
  document.getElementById('desc').value = t.desc;
  document.getElementById('amount').value = t.amount;
  document.getElementById('type').value = t.type;
  document.getElementById('category').value = t.category;
  document.getElementById('date').value = t.date;
  editIndex = index;
  document.getElementById('submitBtn').textContent = 'Update Transaction';
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveData();
  render();
}

// ---------- RECURRING TRANSACTIONS (auto-add if new month) ----------
function processRecurring() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  let changed = false;
  recurringItems.forEach((r) => {
    if (r.lastMonth !== currentMonth) {
      transactions.push({
        desc: r.desc + ' (Recurring)',
        amount: r.amount,
        type: r.type,
        category: r.category,
        date: currentMonth + '-01'
      });
      r.lastMonth = currentMonth;
      changed = true;
    }
  });
  if (changed) saveData();
}

// ---------- BUDGET LIMIT ----------
function setBudgetLimit() {
  const val = parseFloat(document.getElementById('budgetLimit').value);
  if (!val || val <= 0) { alert('Enter a valid budget limit'); return; }
  budgetLimit = val;
  localStorage.setItem('budgetLimit', budgetLimit);
  document.getElementById('budgetLimit').value = '';
  render();
}

function checkBudget() {
  const statusEl = document.getElementById('budgetStatus');
  if (!budgetLimit) { statusEl.textContent = ''; return; }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthExpense = transactions
    .filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const percent = ((monthExpense / budgetLimit) * 100).toFixed(0);

  if (monthExpense >= budgetLimit) {
    statusEl.innerHTML = `⚠️ Budget exceeded! Spent ₹${monthExpense} of ₹${budgetLimit} (${percent}%)`;
    statusEl.style.color = '#f87171';
  } else if (percent >= 80) {
    statusEl.innerHTML = `⚠️ Close to limit: ₹${monthExpense} of ₹${budgetLimit} (${percent}%)`;
    statusEl.style.color = '#facc15';
  } else {
    statusEl.innerHTML = `✅ On track: ₹${monthExpense} of ₹${budgetLimit} (${percent}%)`;
    statusEl.style.color = '#4ade80';
  }
}

// ---------- SAVINGS GOAL ----------
function setSavingsGoal() {
  const val = parseFloat(document.getElementById('savingsGoal').value);
  if (!val || val <= 0) { alert('Enter a valid savings goal'); return; }
  savingsGoal = val;
  localStorage.setItem('savingsGoal', savingsGoal);
  document.getElementById('savingsGoal').value = '';
  render();
}

function updateGoalProgress(balance) {
  const bar = document.getElementById('goalProgress');
  const statusEl = document.getElementById('goalStatus');
  if (!savingsGoal) { bar.style.width = '0%'; statusEl.textContent = ''; return; }

  const percent = Math.min(((balance / savingsGoal) * 100), 100).toFixed(0);
  bar.style.width = percent + '%';
  statusEl.textContent = `₹${balance.toFixed(2)} saved of ₹${savingsGoal} goal (${percent}%)`;
}

// ---------- VOICE INPUT ----------
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Voice input not supported on this browser. Try Chrome.');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.start();

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.toLowerCase();
    const amountMatch = text.match(/\d+/);
    const amount = amountMatch ? amountMatch[0] : '';
    const desc = text.replace(/add|rupees|rs|₹|\d+|for/gi, '').trim();

    document.getElementById('amount').value = amount;
    document.getElementById('desc').value = desc || 'Voice Entry';
    if (text.includes('income') || text.includes('salary')) {
      document.getElementById('type').value = 'income';
    } else {
      document.getElementById('type').value = 'expense';
    }
    alert(`Heard: "${text}"\nPlease check and click Add Transaction.`);
  };

  recognition.onerror = () => alert('Could not hear you clearly. Try again.');
}

// ---------- EXPORT ----------
function exportCSV() {
  let csv = 'Description,Amount,Type,Category,Date\n';
  transactions.forEach(t => {
    csv += `${t.desc},${t.amount},${t.type},${t.category || ''},${t.date || ''}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'budget_transactions.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  window.print();
}

// ---------- RENDER ----------
function render() {
  processRecurring();

  const list = document.getElementById('list');
  list.innerHTML = '';
  let totalIncome = 0, totalExpense = 0;

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
          ${t.category ? t.category + ' ' : ''}${t.desc}: ${t.type === 'income' ? '+' : '-'}₹${t.amount}
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

  const balance = totalIncome - totalExpense;
  document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;
  document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
  document.getElementById('totalExpense').textContent = totalExpense.toFixed(2);

  updateChart(totalIncome, totalExpense);
  checkBudget();
  updateGoalProgress(balance);
}

function updateChart(income, expense) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{ data: [income, expense], backgroundColor: ['#4ade80', '#f87171'] }]
    },
    options: { plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text') } } } }
  });
}

render();
