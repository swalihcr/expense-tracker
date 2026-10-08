/**
 * Modern Expense Tracker (വരവ്-ചെലവ് കണക്ക്)
 * Features:
 * - Daily Income & Expense tracking
 * - Automatic Balance, Income, Expense & Today's Spend calculation
 * - Category-wise breakdown with interactive SVG Donut Chart & Progress Bars
 * - Search, Type, Category & Date filters
 * - LocalStorage persistence & CSV Export
 */

const STORAGE_KEY = 'malayalam_expense_tracker_v1';
const THEME_KEY = 'malayalam_expense_tracker_theme';

// Category Definitions (Malayalam + English + Emoji + Modern Color)
const CATEGORIES = {
    // Expense Categories
    food: { id: 'food', ml: 'ഭക്ഷണം', en: 'Food & Dining', emoji: '🍔', color: '#f97316', type: 'expense' },
    travel: { id: 'travel', ml: 'യാത്ര', en: 'Travel & Fuel', emoji: '🚗', color: '#3b82f6', type: 'expense' },
    shopping: { id: 'shopping', ml: 'ഷോപ്പിംഗ്', en: 'Shopping', emoji: '🛍️', color: '#ec4899', type: 'expense' },
    bills: { id: 'bills', ml: 'ബില്ലുകൾ', en: 'Bills & Utilities', emoji: '💡', color: '#eab308', type: 'expense' },
    health: { id: 'health', ml: 'ആരോഗ്യം', en: 'Health & Medical', emoji: '🏥', color: '#ef4444', type: 'expense' },
    entertainment: { id: 'entertainment', ml: 'വിനോദം', en: 'Entertainment', emoji: '🎬', color: '#a855f7', type: 'expense' },
    education: { id: 'education', ml: 'വിദ്യാഭ്യാസം', en: 'Education', emoji: '📚', color: '#06b6d4', type: 'expense' },
    other_exp: { id: 'other_exp', ml: 'മറ്റുള്ളവ', en: 'Other Expense', emoji: '📦', color: '#64748b', type: 'expense' },

    // Income Categories
    salary: { id: 'salary', ml: 'ശമ്പളം', en: 'Salary', emoji: '💰', color: '#10b981', type: 'income' },
    business: { id: 'business', ml: 'ബിസിനസ്സ്', en: 'Business', emoji: '📈', color: '#14b8a6', type: 'income' },
    freelance: { id: 'freelance', ml: 'ഫ്രീലാൻസ്', en: 'Freelance', emoji: '💻', color: '#6366f1', type: 'income' },
    other_inc: { id: 'other_inc', ml: 'മറ്റു വരുമാനം', en: 'Other Income', emoji: '✨', color: '#8b5cf6', type: 'income' }
};

// State
let transactions = [];
let activeFilterType = 'all';
let activeFilterCategory = 'all';
let activeFilterDate = '';
let searchQuery = '';

// Helper: Get local YYYY-MM-DD string
function getTodayDateString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper: Format Indian Rupee (₹)
function formatCurrency(amount) {
    const num = Number(amount) || 0;
    const isNegative = num < 0;
    const formatted = Math.abs(num).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${isNegative ? '-' : ''}₹${formatted}`;
}

// Default Sample Transactions for initial demo
function getDefaultSampleTransactions() {
    const today = getTodayDateString(0);
    const yesterday = getTodayDateString(1);
    const twoDaysAgo = getTodayDateString(2);

    return [
        {
            id: 'tx_sample_1',
            type: 'income',
            title: 'മാസ ശമ്പളം (Monthly Salary)',
            amount: 35000,
            category: 'salary',
            date: twoDaysAgo,
            note: 'Bank Transfer',
            createdAt: Date.now() - 300000
        },
        {
            id: 'tx_sample_2',
            type: 'expense',
            title: 'സൂപ്പർമാർക്കറ്റ് & പച്ചക്കറി (Groceries)',
            amount: 1250,
            category: 'food',
            date: yesterday,
            note: 'UPI Payment',
            createdAt: Date.now() - 240000
        },
        {
            id: 'tx_sample_3',
            type: 'expense',
            title: 'പെട്രോൾ & ബസ് ചാർജ് (Fuel & Travel)',
            amount: 650,
            category: 'travel',
            date: yesterday,
            note: 'Bike Petrol',
            createdAt: Date.now() - 180000
        },
        {
            id: 'tx_sample_4',
            type: 'expense',
            title: 'കറന്റ് ബിൽ & മൊബൈൽ റീചാർജ്',
            amount: 1499,
            category: 'bills',
            date: today,
            note: 'KSEB + Jio',
            createdAt: Date.now() - 120000
        },
        {
            id: 'tx_sample_5',
            type: 'expense',
            title: 'ഉച്ചഭക്ഷണം & ചായ (Lunch & Tea)',
            amount: 280,
            category: 'food',
            date: today,
            note: 'Hotel Rahmath',
            createdAt: Date.now() - 60000
        }
    ];
}

// DOM Elements
const els = {
    headerDateText: document.getElementById('headerDateText'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),

    totalBalance: document.getElementById('totalBalance'),
    totalIncome: document.getElementById('totalIncome'),
    totalExpense: document.getElementById('totalExpense'),
    todayExpense: document.getElementById('todayExpense'),
    incomeCountText: document.getElementById('incomeCountText'),
    balanceStatusText: document.getElementById('balanceStatusText'),

    transactionForm: document.getElementById('transactionForm'),
    editTransactionId: document.getElementById('editTransactionId'),
    formTitle: document.getElementById('formTitle'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    typeExpenseRadio: document.getElementById('typeExpense'),
    typeIncomeRadio: document.getElementById('typeIncome'),
    txTitle: document.getElementById('txTitle'),
    txAmount: document.getElementById('txAmount'),
    txDate: document.getElementById('txDate'),
    txCategory: document.getElementById('txCategory'),
    txNote: document.getElementById('txNote'),
    categoryChipGrid: document.getElementById('categoryChipGrid'),
    submitBtnText: document.getElementById('submitBtnText'),

    expenseDonutSvg: document.getElementById('expenseDonutSvg'),
    donutCenterValue: document.getElementById('donutCenterValue'),
    categoryBreakdownList: document.getElementById('categoryBreakdownList'),

    loadSampleBtn: document.getElementById('loadSampleBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    searchInput: document.getElementById('searchInput'),
    typeFilterTabs: document.getElementById('typeFilterTabs'),
    categoryFilter: document.getElementById('categoryFilter'),
    dateFilter: document.getElementById('dateFilter'),
    clearDateFilterBtn: document.getElementById('clearDateFilterBtn'),

    filteredCountLabel: document.getElementById('filteredCountLabel'),
    filteredNetAmount: document.getElementById('filteredNetAmount'),
    transactionsContainer: document.getElementById('transactionsContainer'),
    toastContainer: document.getElementById('toastContainer')
};

// Initialize Application
function initApp() {
    initTheme();
    initHeaderDate();

    // Set default form date to today
    els.txDate.value = getTodayDateString(0);

    // Load transactions from localStorage (or sample data on first visit)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
        transactions = getDefaultSampleTransactions();
        saveTransactions();
    } else {
        try {
            transactions = JSON.parse(saved) || [];
        } catch (e) {
            transactions = [];
        }
    }

    renderCategoryChips('expense');
    populateCategoryFilterDropdown();
    bindEventListeners();
    refreshUI();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
}

// Header Date Display
function initHeaderDate() {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    els.headerDateText.textContent = formatted;
}

// Render Category Selection Chips in Form
function renderCategoryChips(type, selectedCatId = null) {
    const filteredCats = Object.values(CATEGORIES).filter(c => c.type === type);
    const activeId = selectedCatId && CATEGORIES[selectedCatId]?.type === type
        ? selectedCatId
        : filteredCats[0].id;

    els.txCategory.value = activeId;

    els.categoryChipGrid.innerHTML = filteredCats.map(cat => `
        <button type="button" class="category-chip ${cat.id === activeId ? 'active' : ''}" data-cat-id="${cat.id}">
            <span class="chip-emoji">${cat.emoji}</span>
            <span class="chip-text">
                <span class="chip-ml">${cat.ml}</span>
                <span class="chip-en">${cat.en}</span>
            </span>
        </button>
    `).join('');

    els.categoryChipGrid.querySelectorAll('.category-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            els.categoryChipGrid.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            els.txCategory.value = btn.dataset.catId;
        });
    });
}

// Populate Category Filter Select
function populateCategoryFilterDropdown() {
    const options = [
        '<option value="all">എല്ലാ കാറ്റഗറികളും (All Categories)</option>',
        '<optgroup label="ചെലവ് (Expenses)">',
        ...Object.values(CATEGORIES)
            .filter(c => c.type === 'expense')
            .map(c => `<option value="${c.id}">${c.emoji} ${c.ml} (${c.en})</option>`),
        '</optgroup>',
        '<optgroup label="വരവ് (Income)">',
        ...Object.values(CATEGORIES)
            .filter(c => c.type === 'income')
            .map(c => `<option value="${c.id}">${c.emoji} ${c.ml} (${c.en})</option>`),
        '</optgroup>'
    ];
    els.categoryFilter.innerHTML = options.join('');
}

// Save to LocalStorage
function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Refresh All UI Components
function refreshUI() {
    updateSummaryCards();
    renderCategoryBreakdown();
    renderTransactionsList();
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// 1. Update Summary Cards (Auto-calculate Balance, Income, Expense, Today's Spend)
function updateSummaryCards() {
    const todayStr = getTodayDateString(0);
    let totalInc = 0;
    let totalExp = 0;
    let todayExp = 0;
    let incCount = 0;

    for (const tx of transactions) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') {
            totalInc += amt;
            incCount++;
        } else {
            totalExp += amt;
            if (tx.date === todayStr) {
                todayExp += amt;
            }
        }
    }

    const balance = totalInc - totalExp;

    els.totalBalance.textContent = formatCurrency(balance);
    els.totalIncome.textContent = formatCurrency(totalInc);
    els.totalExpense.textContent = formatCurrency(totalExp);
    els.todayExpense.textContent = formatCurrency(todayExp);
    els.incomeCountText.textContent = `${incCount} വരവ് എൻട്രികൾ (${transactions.length} ആകെ)`;

    // Update Balance Status Pill
    if (transactions.length === 0) {
        els.balanceStatusText.textContent = 'കണക്കുകൾ ചേർത്തു തുടങ്ങാം';
    } else if (balance < 0) {
        els.balanceStatusText.textContent = 'ശ്രദ്ധിക്കുക: ചെലവ് വരവിനേക്കാൾ കൂടുതലാണ്!';
    } else if (totalInc > 0) {
        const savingsPct = Math.round((balance / totalInc) * 100);
        els.balanceStatusText.textContent = `മിച്ചം: ${savingsPct}% ബാലൻസ് ലഭ്യമാണ്`;
    } else {
        els.balanceStatusText.textContent = 'കണക്കുകൾ സ്വയം അപ്ഡേറ്റ് ചെയ്യുന്നു';
    }
}

// 2. Render Category Breakdown & SVG Donut Chart
function renderCategoryBreakdown() {
    const expenseTxs = transactions.filter(t => t.type === 'expense');
    const totalExp = expenseTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    els.donutCenterValue.textContent = formatCurrency(totalExp);

    // Clear old donut segments
    els.expenseDonutSvg.querySelectorAll('.donut-segment').forEach(el => el.remove());

    if (totalExp <= 0) {
        els.categoryBreakdownList.innerHTML = `
            <p style="text-align:center; color: var(--text-secondary); font-size: 0.84rem; padding: 1rem 0;">
                ചെലവുകൾ ചേർക്കുമ്പോൾ കാറ്റഗറി തിരിച്ചുള്ള കണക്ക് ഇവിടെ കാണാം.
            </p>
        `;
        return;
    }

    // Aggregate by category
    const totalsByCat = {};
    for (const tx of expenseTxs) {
        const catId = CATEGORIES[tx.category] ? tx.category : 'other_exp';
        totalsByCat[catId] = (totalsByCat[catId] || 0) + (Number(tx.amount) || 0);
    }

    const sortedStats = Object.entries(totalsByCat)
        .map(([catId, amount]) => ({
            cat: CATEGORIES[catId] || CATEGORIES.other_exp,
            amount,
            pct: (amount / totalExp) * 100
        }))
        .sort((a, b) => b.amount - a.amount);

    // Draw SVG Donut Segments (r = 46 => circumference = 2 * PI * 46 ≈ 289.026)
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPct = 0;

    sortedStats.forEach(item => {
        const segmentLength = (item.pct / 100) * circumference;
        const dashArray = `${segmentLength} ${circumference}`;
        const dashOffset = -(accumulatedPct / 100) * circumference;
        accumulatedPct += item.pct;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'donut-segment');
        circle.setAttribute('cx', '60');
        circle.setAttribute('cy', '60');
        circle.setAttribute('r', String(radius));
        circle.setAttribute('fill', 'transparent');
        circle.setAttribute('stroke', item.cat.color);
        circle.setAttribute('stroke-width', '14');
        circle.setAttribute('stroke-dasharray', dashArray);
        circle.setAttribute('stroke-dashoffset', String(dashOffset));

        circle.addEventListener('click', () => {
            filterBySpecificCategory(item.cat.id);
        });

        els.expenseDonutSvg.appendChild(circle);
    });

    // Render Category Progress Bars
    els.categoryBreakdownList.innerHTML = sortedStats.map(item => `
        <div class="cat-stat-item" data-cat-id="${item.cat.id}" title="ഈ കാറ്റഗറി ഫിൽട്ടർ ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക">
            <div class="cat-stat-top">
                <span class="cat-stat-name">
                    <span>${item.cat.emoji}</span>
                    <span>${item.cat.ml} <small style="color:var(--text-muted);font-weight:500;">(${item.cat.en})</small></span>
                </span>
                <div class="cat-stat-right">
                    <span class="cat-stat-amount">${formatCurrency(item.amount)}</span>
                    <span class="cat-stat-pct">${item.pct.toFixed(1)}%</span>
                </div>
            </div>
            <div class="cat-progress-track">
                <div class="cat-progress-fill" style="width: ${Math.max(item.pct, 2)}%; background: ${item.cat.color};"></div>
            </div>
        </div>
    `).join('');

    els.categoryBreakdownList.querySelectorAll('.cat-stat-item').forEach(row => {
        row.addEventListener('click', () => {
            filterBySpecificCategory(row.dataset.catId);
        });
    });
}

function filterBySpecificCategory(catId) {
    if (activeFilterCategory === catId) {
        activeFilterCategory = 'all';
        els.categoryFilter.value = 'all';
    } else {
        activeFilterCategory = catId;
        els.categoryFilter.value = catId;
    }
    renderTransactionsList();
}

// 3. Render Daily Grouped Transactions List
function renderTransactionsList() {
    const filtered = transactions.filter(tx => {
        if (activeFilterType !== 'all' && tx.type !== activeFilterType) return false;
        if (activeFilterCategory !== 'all' && tx.category !== activeFilterCategory) return false;
        if (activeFilterDate && tx.date !== activeFilterDate) return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const cat = CATEGORIES[tx.category] || CATEGORIES.other_exp;
            const matchTitle = tx.title.toLowerCase().includes(q);
            const matchNote = (tx.note || '').toLowerCase().includes(q);
            const matchCat = cat.ml.toLowerCase().includes(q) || cat.en.toLowerCase().includes(q);
            if (!matchTitle && !matchNote && !matchCat) return false;
        }
        return true;
    });

    // Update filtered summary strip
    const filteredNet = filtered.reduce((acc, tx) => {
        const amt = Number(tx.amount) || 0;
        return tx.type === 'income' ? acc + amt : acc - amt;
    }, 0);

    els.filteredCountLabel.textContent = `${filtered.length} കണക്കുകൾ കാണിക്കുന്നു`;
    els.filteredNetAmount.textContent = `ആകെ: ${formatCurrency(filteredNet)}`;

    if (filtered.length === 0) {
        els.transactionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i data-lucide="inbox"></i>
                </div>
                <h4>കണക്കുകൾ ഒന്നും കണ്ടെത്തിയില്ല</h4>
                <p>ഇടതുവശത്തുള്ള ഫോം ഉപയോഗിച്ച് പുതിയ വരവ് അല്ലെങ്കിൽ ചെലവ് രേഖപ്പെടുത്തുക.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // Sort by date descending, then createdAt descending
    const sorted = [...filtered].sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return (b.createdAt || 0) - (a.createdAt || 0);
    });

    // Group by Date (ഓരോ ദിവസത്തെയും കണക്ക്)
    const groupsMap = new Map();
    for (const tx of sorted) {
        if (!groupsMap.has(tx.date)) {
            groupsMap.set(tx.date, []);
        }
        groupsMap.get(tx.date).push(tx);
    }

    const htmlGroups = [];
    for (const [dateStr, dayTxs] of groupsMap.entries()) {
        let dayIncome = 0;
        let dayExpense = 0;
        for (const t of dayTxs) {
            if (t.type === 'income') dayIncome += Number(t.amount) || 0;
            else dayExpense += Number(t.amount) || 0;
        }

        htmlGroups.push(`
            <div class="day-group">
                <div class="day-header">
                    <div class="day-date-label">
                        <i data-lucide="calendar" style="width:15px;height:15px;color:var(--accent-primary);"></i>
                        <span>${formatReadableDateHeader(dateStr)}</span>
                    </div>
                    <div class="day-summary-pills">
                        ${dayIncome > 0 ? `<span class="day-inc">+${formatCurrency(dayIncome)}</span>` : ''}
                        ${dayExpense > 0 ? `<span class="day-exp">-${formatCurrency(dayExpense)}</span>` : ''}
                    </div>
                </div>
                <div class="day-items">
                    ${dayTxs.map(tx => renderTransactionRow(tx)).join('')}
                </div>
            </div>
        `);
    }

    els.transactionsContainer.innerHTML = htmlGroups.join('');

    // Attach Edit & Delete handlers
    els.transactionsContainer.querySelectorAll('.tx-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => startEditTransaction(btn.dataset.id));
    });

    els.transactionsContainer.querySelectorAll('.tx-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
    });

    if (window.lucide) window.lucide.createIcons();
}

function renderTransactionRow(tx) {
    const cat = CATEGORIES[tx.category] || (tx.type === 'income' ? CATEGORIES.other_inc : CATEGORIES.other_exp);
    const sign = tx.type === 'income' ? '+' : '-';

    return `
        <div class="tx-item">
            <div class="tx-left">
                <div class="tx-cat-badge" style="background: ${cat.color}20; border: 1px solid ${cat.color}45;">
                    ${cat.emoji}
                </div>
                <div class="tx-details">
                    <div class="tx-title">${escapeHtml(tx.title)}</div>
                    <div class="tx-meta">
                        <span class="tx-cat-tag" style="background: ${cat.color}18; color: ${cat.color};">
                            ${cat.ml} • ${cat.en}
                        </span>
                        ${tx.note ? `<span class="tx-note">• ${escapeHtml(tx.note)}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="tx-right">
                <div class="tx-amount ${tx.type}">
                    ${sign}${formatCurrency(tx.amount)}
                </div>
                <div class="tx-actions">
                    <button type="button" class="tx-action-btn edit" data-id="${tx.id}" title="തിരുത്തുക (Edit)">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button type="button" class="tx-action-btn delete" data-id="${tx.id}" title="നീക്കം ചെയ്യുക (Delete)">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Helper: Format YYYY-MM-DD into "ഇന്ന് (Today) • 30 Sep 2026"
function formatReadableDateHeader(dateStr) {
    const todayStr = getTodayDateString(0);
    const yesterdayStr = getTodayDateString(1);

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const formatted = dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        weekday: 'short'
    });

    if (dateStr === todayStr) {
        return `ഇന്ന് (Today) • ${formatted}`;
    }
    if (dateStr === yesterdayStr) {
        return `ഇന്നലെ (Yesterday) • ${formatted}`;
    }
    return formatted;
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Bind All Event Listeners
function bindEventListeners() {
    // Theme toggle
    els.themeToggleBtn.addEventListener('click', toggleTheme);

    // Switch between Expense and Income radio buttons
    els.typeExpenseRadio.addEventListener('change', () => {
        if (els.typeExpenseRadio.checked) {
            renderCategoryChips('expense');
        }
    });

    els.typeIncomeRadio.addEventListener('change', () => {
        if (els.typeIncomeRadio.checked) {
            renderCategoryChips('income');
        }
    });

    // Form Submission (Add or Update Transaction)
    els.transactionForm.addEventListener('submit', handleFormSubmit);

    // Cancel Edit
    els.cancelEditBtn.addEventListener('click', resetFormState);

    // Search Filter
    els.searchInput.addEventListener('input', e => {
        searchQuery = e.target.value.trim();
        renderTransactionsList();
    });

    // Type Filter Tabs
    els.typeFilterTabs.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            els.typeFilterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilterType = tab.dataset.filterType;
            renderTransactionsList();
        });
    });

    // Category Filter Select
    els.categoryFilter.addEventListener('change', e => {
        activeFilterCategory = e.target.value;
        renderTransactionsList();
    });

    // Date Filter
    els.dateFilter.addEventListener('change', e => {
        activeFilterDate = e.target.value;
        els.clearDateFilterBtn.classList.toggle('hidden', !activeFilterDate);
        renderTransactionsList();
    });

    els.clearDateFilterBtn.addEventListener('click', () => {
        activeFilterDate = '';
        els.dateFilter.value = '';
        els.clearDateFilterBtn.classList.add('hidden');
        renderTransactionsList();
    });

    // Load Sample Data
    els.loadSampleBtn.addEventListener('click', () => {
        transactions = getDefaultSampleTransactions();
        saveTransactions();
        refreshUI();
        showToast('സാമ്പിൾ ഡാറ്റ ചേർത്തു! (Sample data loaded)', 'success');
    });

    // Clear All Data
    els.clearAllBtn.addEventListener('click', () => {
        if (transactions.length === 0) return;
        if (confirm('എല്ലാ വരവ്-ചെലവ് കണക്കുകളും മായ്ക്കണമെന്ന് ഉറപ്പാണോ? (Clear all entries?)')) {
            transactions = [];
            saveTransactions();
            resetFormState();
            refreshUI();
            showToast('എല്ലാ കണക്കുകളും നീക്കം ചെയ്തു (All cleared)', 'danger');
        }
    });

    // Export CSV
    els.exportCsvBtn.addEventListener('click', exportTransactionsToCsv);
}

// Form Submit Handler
function handleFormSubmit(e) {
    e.preventDefault();

    const type = els.typeIncomeRadio.checked ? 'income' : 'expense';
    const title = els.txTitle.value.trim();
    const amount = parseFloat(els.txAmount.value);
    const date = els.txDate.value || getTodayDateString(0);
    const category = els.txCategory.value;
    const note = els.txNote.value.trim();
    const editId = els.editTransactionId.value;

    if (!title || isNaN(amount) || amount <= 0) {
        showToast('ദയവായി വിവരങ്ങളും തുകയും ശരിയായി നൽകുക!', 'danger');
        return;
    }

    if (editId) {
        // Update existing transaction
        const idx = transactions.findIndex(t => t.id === editId);
        if (idx !== -1) {
            transactions[idx] = {
                ...transactions[idx],
                type,
                title,
                amount,
                date,
                category,
                note
            };
            showToast('കണക്ക് വിജയകരമായി തിരുത്തി! (Updated)', 'success');
        }
    } else {
        // Create new transaction
        const newTx = {
            id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            type,
            title,
            amount,
            date,
            category,
            note,
            createdAt: Date.now()
        };
        transactions.unshift(newTx);
        showToast(
            type === 'income'
                ? 'പുതിയ വരവ് ചേർത്തു! (Income added)'
                : 'പുതിയ ചെലവ് ചേർത്തു! (Expense added)',
            'success'
        );
    }

    saveTransactions();
    resetFormState();
    refreshUI();
}

// Start Editing Transaction
function startEditTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    els.editTransactionId.value = tx.id;
    els.formTitle.textContent = 'കണക്ക് തിരുത്തുക (Edit Entry)';
    els.submitBtnText.textContent = 'മാറ്റങ്ങൾ സേവ് ചെയ്യുക (Update Entry)';
    els.cancelEditBtn.classList.remove('hidden');

    if (tx.type === 'income') {
        els.typeIncomeRadio.checked = true;
        renderCategoryChips('income', tx.category);
    } else {
        els.typeExpenseRadio.checked = true;
        renderCategoryChips('expense', tx.category);
    }

    els.txTitle.value = tx.title;
    els.txAmount.value = tx.amount;
    els.txDate.value = tx.date;
    els.txNote.value = tx.note || '';

    els.transactionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    els.txTitle.focus();
}

// Reset Form to Default State
function resetFormState() {
    els.editTransactionId.value = '';
    els.formTitle.textContent = 'പുതിയ കണക്ക് ചേർക്കുക (Add Entry)';
    els.submitBtnText.textContent = 'കണക്കിൽ ചേർക്കുക (Save Entry)';
    els.cancelEditBtn.classList.add('hidden');

    els.txTitle.value = '';
    els.txAmount.value = '';
    els.txDate.value = getTodayDateString(0);
    els.txNote.value = '';
    els.typeExpenseRadio.checked = true;
    renderCategoryChips('expense');
}

// Delete Transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    if (els.editTransactionId.value === id) {
        resetFormState();
    }
    saveTransactions();
    refreshUI();
    showToast('കണക്ക് നീക്കം ചെയ്തു (Deleted)', 'danger');
}

// Export to CSV
function exportTransactionsToCsv() {
    if (transactions.length === 0) {
        showToast('ഡൗൺലോഡ് ചെയ്യാൻ കണക്കുകൾ ഇല്ല!', 'danger');
        return;
    }

    const headers = ['Date', 'Type', 'Category (ML)', 'Category (EN)', 'Description', 'Amount (INR)', 'Note'];
    const rows = transactions.map(tx => {
        const cat = CATEGORIES[tx.category] || CATEGORIES.other_exp;
        return [
            tx.date,
            tx.type.toUpperCase(),
            `"${cat.ml}"`,
            `"${cat.en}"`,
            `"${(tx.title || '').replace(/"/g, '""')}"`,
            tx.amount,
            `"${(tx.note || '').replace(/"/g, '""')}"`
        ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-tracker-${getTodayDateString(0)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('CSV ഫയൽ ഡൗൺലോഡ് ചെയ്തു!', 'success');
}

// Toast Notification Helper
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 220);
    }, 2800);
}

// Run on DOM Ready
document.addEventListener('DOMContentLoaded', initApp);
