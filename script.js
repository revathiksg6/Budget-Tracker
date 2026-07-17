let transactions = [];

function addTransaction() {
  const desc = document.getElementById('desc').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;

  if (!desc || !amount || amount <= 0) {
    alert('Please enter valid description and amount');
    return;
  }

  transactions.push({ desc, amount, type });
  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  render();
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  render();
}

function render() {
  const list = document.getElementById('list');
  list.innerHTML = '';
  let balance = 0;

  transactions.forEach((t, i) => {
    balance += t.type === 'income' ? t.amount : -t.amount;
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="${t.type === 'income' ? 'income' : 'expense'}">
        ${t.desc}: ${t.type === 'income' ? '+' : '-'}₹${t.amount}
      </span>
      <button class="delete-btn" onclick="deleteTransaction(${i})">X</button>
    `;
    list.appendChild(li);
  });

  document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;
}
