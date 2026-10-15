// initialize transactions array
let transactions = [];

// balance elements
const netBalanceEl = document.getElementById('netBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');

// transactions list elements
const transactionListEl = document.getElementById('transactionList');
const ledgerSection = document.querySelector('.ledger-section');
const foodListEl = document.getElementById('foodList');
const noTransactionFound = document.getElementById('noTransactionFound');
const clearFiltersButton = document.getElementById('clearFilters');
const formStatus = document.getElementById('formStatus');
const expenseChart = document.getElementById('expenseChart');

// transaction's user inputs
const amountInput = document.getElementById('amountInput');
const descriptionInput = document.getElementById('descriptionInput');
const categorySelect = document.getElementById('categorySelect');
const transactionForm = document.getElementById('transactionsForm');

// progress bar elements
const barFood = document.getElementById('barFood');
const barUtilities = document.getElementById('barUtilities');
const barShopping = document.getElementById('barShopping');
const barRent = document.getElementById('barRent');

// percentages elements
const pctFood = document.getElementById('pctFood');
const pctUtilities = document.getElementById('pctUtilities');
const pctShopping = document.getElementById('pctShopping');
const pctRent = document.getElementById('pctRent');

// filter and search elements
const searchInput = document.getElementById('searchInput');
const searchInputDeleteBtn = document.getElementById('deleteSearchBtn');
const filterTabsContainer = document.querySelector('.filter-tabs');
const filterTabs = document.querySelectorAll('[data-filter]');

// create transactions string for localeStorage and assign transactions array to it
const addTransactionsToStorage = ()=> {
    let transactionsString = JSON.stringify(transactions);
    localStorage.setItem('transactions', transactionsString);
}

const announceStatus = (message) => {
    // update the text content of the formStatus element with the provided message
    if (formStatus) {
        formStatus.textContent = message;
    }
};

const validateTransactionInput = () => {
    const description = descriptionInput.value.trim();
    const amountValue = Number(amountInput.value);
    const selectedCategory = categorySelect.value;

    // announce the first invalid input and set focus to it, also set aria-invalid attribute to true
    if (!description) {
        announceStatus('Please enter a transaction description.');
        descriptionInput.focus();
        descriptionInput.setAttribute('aria-invalid', 'true');
        return false;
    }

    if (!selectedCategory) {
        announceStatus('Please select a transaction category.');
        categorySelect.focus();
        categorySelect.setAttribute('aria-invalid', 'true');
        return false;
    }

    if (amountInput.value.trim() === '' || Number.isNaN(amountValue) || amountValue <= 0) {
        announceStatus('Please enter an amount greater than zero.');
        amountInput.focus();
        amountInput.setAttribute('aria-invalid', 'true');
        return false;
    }

    // if all inputs are valid, remove aria-invalid attribute from all inputs and return true
    descriptionInput.removeAttribute('aria-invalid');
    amountInput.removeAttribute('aria-invalid');
    categorySelect.removeAttribute('aria-invalid');
    return true;
};

transactionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    // validate user inputs before creating a transaction object
    if (!validateTransactionInput()) {
        return;
    }

    // turn amount input value into a number
    const rawAmount = Number(amountInput.value);
    // if the selected category is Income, the number stays positive, if not, the number turns negative
    const formattedAmount = categorySelect.value === "Income" ? Math.abs(rawAmount) : Math.abs(rawAmount) * -1;

    let transactionObject = {
        // create unique ID
        id: Date.now(),
        // assign description input value
        description: descriptionInput.value.trim(),
        // assign formatted amount input value
        amount: formattedAmount,
        // assign category select value
        category: categorySelect.value,
    }

    // push object to transactions array
    transactions.push(transactionObject);
    // save new array into local storage
    addTransactionsToStorage();
    // regenerate transactions list items
    generateTransactionsElements(getFilteredTransactions());
    // regenerate food transactions list items
    generateFoodTransactions();
    // announce that the transaction was added successfully
    announceStatus('Transaction added successfully.');

    // clear value in description input
    descriptionInput.value = '';
    // clear value in amount input
    amountInput.value = '';
    // clear value in category select
    categorySelect.value = '';
})

// set initial variables for search input and filter categories
let currentSearchTerm = '';
let currentCategory = 'All';

// filter transactions based on their description matching the search term or their category matching the filter tab
const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
        const filterByDescription = transaction.description.toLowerCase().includes(currentSearchTerm.toLowerCase());
        const filterByCategory = currentCategory === "All" || transaction.category.toLowerCase() === currentCategory.toLowerCase();
        return filterByCategory && filterByDescription;
    })
}

// update currentSearchTerm variable with user's input and regenerate transactions list
searchInput.addEventListener('input', () => {
    currentSearchTerm = searchInput.value;
    generateTransactionsElements(getFilteredTransactions());
})

// clear search input and currentSearchTerm variable when clicking on delete button
searchInputDeleteBtn.addEventListener('click', () => {
    if (currentSearchTerm !== "") {
        currentSearchTerm = "";
        searchInput.value = "";
        generateTransactionsElements(getFilteredTransactions());
    }
})

// clear search input and currentSearchTerm variable, plus set currentCategory to "All", to reset all filters
clearFiltersButton.addEventListener('click', () => {
    searchInput.value = "";
    currentSearchTerm = "";
    currentCategory = "All";

    // put active class back to "All" filter
    filterTabs.forEach(btn => {
        // check if the button's data-filter attribute is "All" and toggle the active class accordingly
        const isActive = btn.dataset.filter === 'All';
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });
    generateTransactionsElements();
    announceStatus('Filters cleared.');
})

// update currentCategory variable when clicking on filter tabs and update active class accordingly
filterTabsContainer.addEventListener('click', (event) => {
    const clickedTab = event.target.closest('[data-filter]');

    if (clickedTab) {
        currentCategory = clickedTab.getAttribute('data-filter');
        // toggle active class only if the button matches the clicked tab
        filterTabs.forEach(btn => {
            // check if the button matches the clicked tab and toggle the active class accordingly
            const isActive = btn === clickedTab;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });
        generateTransactionsElements(getFilteredTransactions());
        announceStatus(`Showing ${currentCategory} transactions.`);
    }
})

// helper function to format currencies
const euroFormatter = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
});

// helper function to calculate percentage
const percentage = (partialValue, totalValue) => {
    if (totalValue === 0) return 0.0;
    const ratio = Math.abs(partialValue) / Math.abs(totalValue);
    return (ratio * 100).toFixed(1);
};

const generateFoodTransactions = () => {
    // clear list of transactions
    foodListEl.innerHTML = '';
    // filter transactions from food category and map each one to create the list item and its description/amount spans
    const foodTransactions = transactions
        .filter(transaction => transaction.category === "Food")
        .map(transaction => {
            // create list item
            const foodTransactionListItem = document.createElement('li');

            // create description span, assign class and text to it
            const foodTransactionDescription = document.createElement("span");
            foodTransactionDescription.classList.add("transaction-description");
            const descriptionLabel = document.createElement('span');
            descriptionLabel.classList.add('sr-only');
            descriptionLabel.textContent = 'Description: ';
            foodTransactionDescription.append(descriptionLabel, document.createTextNode(transaction.description));

            // create amount span, assign class and text to it (format currency to be positive)
            const foodTransactionAmount = document.createElement("span");
            foodTransactionAmount.classList.add("transaction-amount");
            const amountLabel = document.createElement('span');
            amountLabel.classList.add('sr-only');
            amountLabel.textContent = 'Amount: ';
            foodTransactionAmount.append(amountLabel, document.createTextNode(euroFormatter.format(Math.abs(transaction.amount))));

            // append spans to list item
            foodTransactionListItem.append(foodTransactionDescription, foodTransactionAmount);

            // return array of list items
            return foodTransactionListItem;
        });

    // append list items to unordered list
    foodListEl.append(...foodTransactions);
}

const generateTransactionsElements = (listToRender = transactions) => {
    const isEmpty = listToRender.length === 0;
    // toggle elements' visibility with data-empty attribute
    ledgerSection.setAttribute('data-empty', String(isEmpty)); // setAttribute expects a string, so the boolean value of isEmpty needs to be turned into a string

    // if transactions list is empty, show message "No transaction found", else hide it
    if (isEmpty) {
        if (currentSearchTerm.trim() !== "") {
            noTransactionFound.innerHTML = `No transactions found in <span class="highlight">${currentCategory}</span> matching "<span class="highlight">${currentSearchTerm}</span>".`;
        } else {
            noTransactionFound.innerHTML = `No transactions found in <span class="highlight">${currentCategory}</span>.`;
        }
    }

    // clear list of transactions
    transactionListEl.innerHTML = '';

    // use reduce function on transactions array to calculate total balance, income balance (positive), expenses balance (negative) and single expense amounts
    const separateBalances = transactions.reduce((acc, transaction) => {
        // add amount to total balance accumulator
        acc.totalBalance += transaction.amount;

        if (transaction.amount > 0) {
            // add amount to income accumulator
            acc.totalIncome += transaction.amount;
        } else {
            // add amount to expenses accumulator
            acc.totalExpenses += transaction.amount;
            // append category to accumulator (e.g. foodExpenses)
            const categoryAccumulator = `${transaction.category.toLowerCase()}Expenses`;
            // use object keys to identify category
            if (acc[categoryAccumulator] !== undefined) {
                // add amount to category's expenses accumulator
                acc[categoryAccumulator] += transaction.amount;
            }
        }
        return acc;
    }, { totalBalance: 0, totalIncome: 0, totalExpenses: 0, foodExpenses: 0, shoppingExpenses: 0, utilitiesExpenses: 0, rentExpenses: 0 });

    // create variables with percentages based on accumulator values
    const foodExpensesPercentage = `${percentage(separateBalances.foodExpenses, separateBalances.totalExpenses)}%`;
    const utilitiesExpensesPercentage = `${percentage(separateBalances.utilitiesExpenses, separateBalances.totalExpenses)}%`;
    const shoppingExpensesPercentage = `${percentage(separateBalances.shoppingExpenses, separateBalances.totalExpenses)}%`;
    const rentExpensesPercentage = `${percentage(separateBalances.rentExpenses, separateBalances.totalExpenses)}%`;

    // apply percentage values to legend items
    pctFood.innerHTML = foodExpensesPercentage;
    pctUtilities.innerHTML = utilitiesExpensesPercentage;
    pctShopping.innerHTML = shoppingExpensesPercentage;
    pctRent.innerHTML = rentExpensesPercentage;

    // apply percentage values to progress bar widths
    barFood.style.width = foodExpensesPercentage;
    barUtilities.style.width = utilitiesExpensesPercentage;
    barShopping.style.width = shoppingExpensesPercentage;
    barRent.style.width = rentExpensesPercentage;

    if (expenseChart) {
        // set aria-label for expense chart with percentages of each category
        expenseChart.setAttribute(
            'aria-label',
            `Expense distribution chart: Food ${foodExpensesPercentage}, Utilities ${utilitiesExpensesPercentage}, Shopping ${shoppingExpensesPercentage}, Rent ${rentExpensesPercentage}.`
        );
    }

    // display accumulator value as transaction balances
    netBalanceEl.innerHTML = `${euroFormatter.format(separateBalances.totalBalance)}`;
    totalIncomeEl.innerHTML = `${euroFormatter.format(separateBalances.totalIncome)}`;
    totalExpensesEl.innerHTML = `${euroFormatter.format(separateBalances.totalExpenses)}`;

    listToRender.forEach(transaction => {
        // create list item
        const transactionListItem = document.createElement("li");

        // create description span, assign class and text to it
        const transactionDescription = document.createElement("span");
        transactionDescription.classList.add("transaction-description");
        const descriptionLabel = document.createElement('span');
        descriptionLabel.classList.add('sr-only');
        descriptionLabel.textContent = 'Description: ';
        transactionDescription.append(descriptionLabel, document.createTextNode(transaction.description));

        // create amount span, assign class and text to it
        const transactionAmount = document.createElement("span");
        transactionAmount.classList.add("transaction-amount");
        const amountLabel = document.createElement('span');
        amountLabel.classList.add('sr-only');
        amountLabel.textContent = 'Amount: ';
        const formattedCurrency = euroFormatter.format(transaction.amount);
        transactionAmount.append(amountLabel, document.createTextNode(formattedCurrency));

        // create category span, assign class and text to it
        const transactionCategory = document.createElement("span");
        transactionCategory.classList.add("transaction-category");
        const categoryLabel = document.createElement('span');
        categoryLabel.classList.add('sr-only');
        categoryLabel.textContent = 'Category: ';
        transactionCategory.append(categoryLabel, document.createTextNode(transaction.category));

        // create a delete button in each task
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-btn');
        deleteButton.type = 'button';
        deleteButton.setAttribute('aria-label', `Delete ${transaction.description} transaction`);
        deleteButton.innerHTML = "<i class=\"fa-solid fa-trash-can\" aria-hidden=\"true\"></i>";

        // add event listener to delete button: remove transaction from array based on its ID, generate the list items again without it and save the new array to local storage
        deleteButton.addEventListener('click', () => {
            const deleteButtons = Array.from(transactionListEl.querySelectorAll('.delete-btn'));
            const deletedIndex = deleteButtons.indexOf(deleteButton);
            transactions = transactions.filter(item => item.id !== transaction.id);
            addTransactionsToStorage(transactions);
            generateTransactionsElements();
            generateFoodTransactions();
            const remainingDeleteButtons = transactionListEl.querySelectorAll('.delete-btn');
            (remainingDeleteButtons[deletedIndex] || remainingDeleteButtons[remainingDeleteButtons.length - 1] || searchInput).focus();
            announceStatus(`Deleted ${transaction.description} transaction.`);
        })

        // append spans to list item
        transactionListItem.append(transactionDescription, transactionAmount, transactionCategory, deleteButton);
        // append list item to unordered list
        transactionListEl.append(transactionListItem);
    })
}

document.addEventListener("DOMContentLoaded", ()=>{
    // find in local storage the string with the list of transactions, if there is one
    const storedTransactions = localStorage.getItem('transactions');

    if (storedTransactions) {
        // if there are already transactions, turn the string into an array
        transactions = JSON.parse(storedTransactions);
    }

    // generate the list of transactions
    generateTransactionsElements();
    // generate the list of food transactions
    generateFoodTransactions();
})

