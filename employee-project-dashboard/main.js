document.addEventListener('DOMContentLoaded', function() {

// Get elements from the DOM
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggleSidebar');
  const openBtn = document.getElementById('openSidebarBtn');
  const main = document.getElementById('mainContent');
  const headerDiv = document.querySelector('.sidebar-header');

// Toggle sidebar when the hamburger button is clicked
  toggleBtn.addEventListener('click', function() {
    sidebar.classList.toggle('open');
    openBtn.classList.toggle('hidden');
    main.classList.toggle('shifted');
  });

// Open sidebar when the arrow button is clicked
  openBtn.addEventListener('click', function() {
    sidebar.classList.add('open');
    openBtn.classList.add('hidden');
    main.classList.remove('shifted');
  });

// If the header area is clicked (but not the toggle button), trigger the toggle
  headerDiv.addEventListener('click', function(event) {
    if (event.target !== toggleBtn) {
      toggleBtn.click();
    }
  });

});

// ========== DATA SERVICE ==========

const STORAGE_KEY = 'monthlyData';

// Load all data from localStorage
function loadAllData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

// Save all data to localStorage
function saveAllData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Return data for a specific year/month
function getMonthlyData(year, month) {
  const all = loadAllData();
  const key = year + '-' + month;   // e.g. "2026-0"
  if (!all[key]) {
    all[key] = { employees: [], projects: [] };
  }
  return all[key];
}

// Save data for a specific year/month
function saveMonthlyData(year, month, monthData) {
  const all = loadAllData();
  const key = year + '-' + month;
  all[key] = monthData;
  saveAllData(all);
}

// Create test data for January 2026 if not already present
function initTestData() {
  const testData = getMonthlyData(2026, 0); // 0 = January
  if (testData.employees.length === 0 && testData.projects.length === 0) {
    testData.employees = [
      {
        id: 'emp-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        birthDate: '1990-05-14',
        position: 'Senior',
        salary: 75000,
        assignments: [
          { projectId: 'proj-1', capacity: 1.0, fit: 0.9 }
        ],
        vacationDays: [3, 4, 5]
      },
      {
        id: 'emp-2',
        firstName: 'Bob',
        lastName: 'Smith',
        birthDate: '1985-09-12',
        position: 'Middle',
        salary: 60000,
        assignments: [
          { projectId: 'proj-2', capacity: 0.8, fit: 0.7 }
        ],
        vacationDays: [10, 11]
      },
      {
        id: 'emp-3',
        firstName: 'Charlie',
        lastName: 'Brown',
        birthDate: '2000-01-20',
        position: 'Junior',
        salary: 45000,
        assignments: [],
        vacationDays: []
      }
    ];
    testData.projects = [
      {
        id: 'proj-1',
        name: 'Alpha',
        company: 'TechCorp',
        budget: 120000,
        capacity: 3
      },
      {
        id: 'proj-2',
        name: 'Beta',
        company: 'InnoSoft',
        budget: 80000,
        capacity: 2
      }
    ];
    saveMonthlyData(2026, 0, testData);
    console.log('Test data created for January 2026');
  }
}

// ========== PERIOD MANAGEMENT ==========

// Get dropdowns
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');

// Current month/year (default: February 2025)
let currentMonth = 0;
let currentYear = 2026;
monthSelect.value = currentMonth;
yearSelect.value = currentYear;

// When user changes month or year
function onPeriodChange() {
  currentMonth = parseInt(monthSelect.value);
  currentYear = parseInt(yearSelect.value);
  const monthName = monthSelect.options[monthSelect.selectedIndex].text;
  console.log('Selected period: ' + monthName + ' ' + currentYear);
  renderProjectsTable();
}

monthSelect.addEventListener('change', onPeriodChange);
yearSelect.addEventListener('change', onPeriodChange);

onPeriodChange();

// ========== HELPERS ==========

// Format number as currency string
function formatMoney(amount) {
  return '$' + amount.toFixed(2);
}

// Calculate age from birth date string
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Count working days (Mon-Fri) in a given month
function getWorkingDaysInMonth(year, month) {
  let count = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++; // exclude Sunday (0) and Saturday (6)
    date.setDate(date.getDate() + 1);
  }
  return count;
}

// Calculate vacation coefficient for an employee in a month
function getVacationCoefficient(employee, year, month) {
  const totalWorkingDays = getWorkingDaysInMonth(year, month);
  if (totalWorkingDays === 0) return 1;
  const vacations = employee.vacationDays || [];
  let vacationWorkingDays = 0;
  vacations.forEach(function(day) {
    const d = new Date(year, month, day);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) vacationWorkingDays++;
  });
  return (totalWorkingDays - vacationWorkingDays) / totalWorkingDays;
}

// ========== RENDER PROJECTS TABLE ==========

function renderProjectsTable() {
  const data = getMonthlyData(currentYear, currentMonth);
  const projects = data.projects || [];
  const employees = data.employees || [];
  const tbody = document.getElementById('projectsTableBody');
  const totalIncomeDiv = document.getElementById('projectsTotalIncome');

  if (projects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No projects for this period.</td></tr>';
    totalIncomeDiv.innerHTML = '';
    return;
  }

  let totalOverallProfit = 0;   // sum of all project profits
  let rows = '';

  projects.forEach(function(proj) {
    // Find employees assigned to this project
    const assignedEmployees = [];
    employees.forEach(function(emp) {
      emp.assignments.forEach(function(assignment) {
        if (assignment.projectId === proj.id) {
          assignedEmployees.push({
            employee: emp,
            capacity: assignment.capacity,
            fit: assignment.fit
          });
        }
      });
    });

    // Calculate effective capacity and financials
    let usedEffectiveCapacity = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    assignedEmployees.forEach(function(item) {
      const vacCoeff = getVacationCoefficient(item.employee, currentYear, currentMonth);
      const effectiveCapacity = item.capacity * item.fit * vacCoeff;
      usedEffectiveCapacity += effectiveCapacity;
    });

    const capacityForRevenue = Math.max(proj.capacity, usedEffectiveCapacity);
    const revenuePerUnit = proj.budget / capacityForRevenue;

    assignedEmployees.forEach(function(item) {
      const vacCoeff = getVacationCoefficient(item.employee, currentYear, currentMonth);
      const effectiveCapacity = item.capacity * item.fit * vacCoeff;
      const revenue = revenuePerUnit * effectiveCapacity;
      const cost = item.employee.salary * Math.max(0.5, item.capacity);
      totalRevenue += revenue;
      totalCost += cost;
    });

    const projectProfit = totalRevenue - totalCost;
    totalOverallProfit += projectProfit;

    // Determine income class
    const incomeClass = projectProfit >= 0 ? 'positive' : 'negative';
    const staffingStr = usedEffectiveCapacity.toFixed(1) + '/' + proj.capacity;

    rows += '<tr>' +
      '<td>' + proj.company + '</td>' +
      '<td>' + proj.name + '</td>' +
      '<td>' + formatMoney(proj.budget) + '</td>' +
      '<td>' + staffingStr + '</td>' +
      '<td><button class="btn small show-employees-btn" data-project-id="' + proj.id + '">Show Employees (' + assignedEmployees.length + ')</button></td>' +
      '<td class="' + incomeClass + '">' + formatMoney(projectProfit) + '</td>' +
      '<td><button class="btn small danger delete-project-btn" data-project-id="' + proj.id + '">Delete</button></td>' +
    '</tr>';
  });

  tbody.innerHTML = rows;

  // Calculate bench cost for employees without assignments
  let benchCost = 0;
  employees.forEach(function(emp) {
    if (emp.assignments.length === 0) {
      benchCost += emp.salary * 0.5;
    }
  });

  const overallProfit = totalOverallProfit - benchCost;
  const overallClass = overallProfit >= 0 ? 'positive' : 'negative';
  totalIncomeDiv.innerHTML = '<strong>Total Estimated Income:</strong> <span class="' + overallClass + '">' + formatMoney(overallProfit) + '</span>' +
    (benchCost > 0 ? ' <span style="color: #7f8c8d;">(Bench payments: ' + formatMoney(benchCost) + ')</span>' : '');
}

// ========== ADD PROJECT FORM ==========

const addProjectBtn = document.getElementById('addProjectBtn');
const addProjectPanel = document.getElementById('addProjectPanel');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const addProjectForm = document.getElementById('addProjectForm');
const saveProjectBtn = document.getElementById('saveProjectBtn');

// Input fields
const projCompanyInput = document.getElementById('projCompany');
const projNameInput = document.getElementById('projName');
const projBudgetInput = document.getElementById('projBudget');
const projCapacityInput = document.getElementById('projCapacity');

// Error spans
const companyError = document.getElementById('companyError');
const projectNameError = document.getElementById('projectNameError');
const budgetError = document.getElementById('budgetError');
const capacityError = document.getElementById('capacityError');

// Open panel
addProjectBtn.addEventListener('click', function() {
  addProjectPanel.classList.add('open');
  addProjectForm.reset();                // clear all fields
  saveProjectBtn.disabled = true;        // disable Add button initially
  // Hide all error messages
  companyError.style.display = 'none';
  projectNameError.style.display = 'none';
  budgetError.style.display = 'none';
  capacityError.style.display = 'none';
});

// Close panel
cancelProjectBtn.addEventListener('click', function() {
  addProjectPanel.classList.remove('open');
});

// Validate all fields and enable/disable Add button
function validateProjectForm() {
  const company = projCompanyInput.value.trim();
  const name = projNameInput.value.trim();
  const budget = projBudgetInput.value;
  const capacity = projCapacityInput.value;

  let valid = true;

  // Company: required, min 2 chars, alphanumeric
  if (company.length < 2 || !/^[A-Za-z0-9 ]+$/.test(company)) {
    companyError.textContent = 'Min 2 characters, letters and numbers only';
    companyError.style.display = 'block';
    valid = false;
  } else {
    companyError.style.display = 'none';
  }

  // Project name: required, min 3 chars, alphanumeric
  if (name.length < 3 || !/^[A-Za-z0-9 ]+$/.test(name)) {
    projectNameError.textContent = 'Min 3 characters, letters and numbers only';
    projectNameError.style.display = 'block';
    valid = false;
  } else {
    projectNameError.style.display = 'none';
  }

  // Budget: required, positive number
  if (budget === '' || parseFloat(budget) <= 0) {
    budgetError.textContent = 'Must be a positive number';
    budgetError.style.display = 'block';
    valid = false;
  } else {
    budgetError.style.display = 'none';
  }

  // Capacity: required, integer >= 1
  if (capacity === '' || !Number.isInteger(parseFloat(capacity)) || parseInt(capacity) < 1) {
    capacityError.textContent = 'Must be a whole number, 1 or more';
    capacityError.style.display = 'block';
    valid = false;
  } else {
    capacityError.style.display = 'none';
  }

  saveProjectBtn.disabled = !valid;
}

// Listen for input changes on all fields
projCompanyInput.addEventListener('input', validateProjectForm);
projNameInput.addEventListener('input', validateProjectForm);
projBudgetInput.addEventListener('input', validateProjectForm);
projCapacityInput.addEventListener('input', validateProjectForm);

// Save new project
saveProjectBtn.addEventListener('click', function() {
  const data = getMonthlyData(currentYear, currentMonth);
  const newProject = {
    id: 'proj-' + Date.now(),                  // unique ID based on timestamp
    company: projCompanyInput.value.trim(),
    name: projNameInput.value.trim(),
    budget: parseFloat(projBudgetInput.value),
    capacity: parseInt(projCapacityInput.value)
  };
  data.projects.push(newProject);
  saveMonthlyData(currentYear, currentMonth, data);
  addProjectPanel.classList.remove('open');    // close panel
  renderProjectsTable();                       // update table
});

// ========== SHOW EMPLOYEES POPUP ==========

function showEmployeesPopup(projectId) {
  const data = getMonthlyData(currentYear, currentMonth);
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;

  const assigned = [];
  data.employees.forEach(emp => {
    emp.assignments.forEach(a => {
      if (a.projectId === projectId) {
        assigned.push({ employee: emp, capacity: a.capacity, fit: a.fit });
      }
    });
  });

  const modal = document.getElementById('modalContainer');
  let html = '<div class="modal-backdrop"><div class="modal-content">';
  html += '<button class="modal-close" onclick="closeModal()">×</button>';
  html += '<h3>Employees on ' + project.name + '</h3>';

  if (assigned.length === 0) {
    html += '<p>No employees assigned to this project.</p>';
  } else {
    // Calculate project finances for revenue/cost/profit
    let usedEff = 0;
    assigned.forEach(a => {
      const coeff = getVacationCoefficient(a.employee, currentYear, currentMonth);
      a.effectiveCapacity = a.capacity * a.fit * coeff;
      usedEff += a.effectiveCapacity;
    });
    const capForRev = Math.max(project.capacity, usedEff);
    const revPerUnit = project.budget / capForRev;

    html += '<table><thead><tr><th>Employee</th><th>Capacity</th><th>Fit</th><th>Vacation</th><th>Effective</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Actions</th></tr></thead><tbody>';

    assigned.forEach(a => {
      const revenue = revPerUnit * a.effectiveCapacity;
      const cost = a.employee.salary * Math.max(0.5, a.capacity);
      const profit = revenue - cost;
      const profitClass = profit >= 0 ? 'positive' : 'negative';
      const vacDays = (a.employee.vacationDays || []).join(', ') || 'None';

      html += '<tr>' +
        '<td>' + a.employee.firstName + ' ' + a.employee.lastName + '</td>' +
        '<td>' + a.capacity.toFixed(2) + '</td>' +
        '<td>' + a.fit.toFixed(2) + '</td>' +
        '<td>' + vacDays + '</td>' +
        '<td>' + a.effectiveCapacity.toFixed(3) + '</td>' +
        '<td>' + formatMoney(revenue) + '</td>' +
        '<td>' + formatMoney(cost) + '</td>' +
        '<td class="' + profitClass + '">' + formatMoney(profit) + '</td>' +
        '<td><button class="btn primary small edit-assignment-btn" data-employee-id="' + a.employee.id + '" data-project-id="' + projectId + '">Edit</button> ' +
        '<button class="btn small danger unassign-btn" data-employee-id="' + a.employee.id + '" data-project-id="' + projectId + '">Unassign</button></td>' +
      '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div></div>';
  modal.innerHTML = html;
}

// Close modal function (reuse for all modals)
function closeModal() {
  document.getElementById('modalContainer').innerHTML = '';
}

// Add click listener to backdrop to close modal
document.getElementById('modalContainer').addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-backdrop')) {
    closeModal();
  }
});

// ========== EDIT ASSIGNMENT POPUP ==========

function editAssignmentPopup(employeeId, projectId) {
  const data = getMonthlyData(currentYear, currentMonth);
  const employee = data.employees.find(e => e.id === employeeId);
  if (!employee) return;

  const assignment = employee.assignments.find(a => a.projectId === projectId);
  if (!assignment) return;

  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;

  const modal = document.getElementById('modalContainer');
  let html = '<div class="modal-backdrop"><div class="modal-content">';
  html += '<button class="modal-close" onclick="closeModal()">×</button>';
  html += '<h3>Edit Assignment: ' + employee.firstName + ' ' + employee.lastName + ' → ' + project.name + '</h3>';

  html += '<div class="form-group">';
  html += '<label>Capacity (0.1–1.5)</label>';
  html += '<input type="range" id="editCapacity" min="0.1" max="1.5" step="0.1" value="' + assignment.capacity + '">';
  html += '<span id="editCapacityVal">' + assignment.capacity.toFixed(1) + '</span>';
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>Fit (0.0–1.0)</label>';
  html += '<input type="range" id="editFit" min="0" max="1" step="0.1" value="' + assignment.fit + '">';
  html += '<span id="editFitVal">' + assignment.fit.toFixed(1) + '</span>';
  html += '</div>';

  html += '<button class="btn primary" id="saveEditAssignment">Save</button>';
  html += '<button class="btn secondary" onclick="closeModal()">Cancel</button>';
  html += '</div></div>';

  modal.innerHTML = html;

  // Update displayed values when sliders move
  document.getElementById('editCapacity').addEventListener('input', function() {
    document.getElementById('editCapacityVal').textContent = parseFloat(this.value).toFixed(1);
  });
  document.getElementById('editFit').addEventListener('input', function() {
    document.getElementById('editFitVal').textContent = parseFloat(this.value).toFixed(1);
  });

  // Save button logic
  document.getElementById('saveEditAssignment').addEventListener('click', function() {
    const newCapacity = parseFloat(document.getElementById('editCapacity').value);
    const newFit = parseFloat(document.getElementById('editFit').value);
    assignment.capacity = newCapacity;
    assignment.fit = newFit;
    saveMonthlyData(currentYear, currentMonth, data);
    closeModal();
    // Re-open the employees popup to reflect changes (or close both)
    showEmployeesPopup(projectId);
  });
}

// ========== UNASSIGN EMPLOYEE ==========

function unassignEmployee(employeeId, projectId) {
  const data = getMonthlyData(currentYear, currentMonth);
  const employee = data.employees.find(e => e.id === employeeId);
  if (!employee) return;
  employee.assignments = employee.assignments.filter(a => a.projectId !== projectId);
  saveMonthlyData(currentYear, currentMonth, data);
  closeModal();
  renderProjectsTable();
}

// ========== DELETE PROJECT ==========

function deleteProject(projectId) {
  const data = getMonthlyData(currentYear, currentMonth);
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;

  // Show confirmation dialog
  const modal = document.getElementById('modalContainer');
  let html = '<div class="modal-backdrop"><div class="modal-content">';
  html += '<button class="modal-close" onclick="closeModal()">×</button>';
  html += '<h3>Delete Project</h3>';
  html += '<p>Are you sure you want to delete <strong>' + project.name + '</strong>?</p>';
  html += '<p>All employees assigned to this project will be unassigned.</p>';
  html += '<button class="btn danger" id="confirmDelete">Delete</button> ';
  html += '<button class="btn secondary" onclick="closeModal()">Cancel</button>';
  html += '</div></div>';
  modal.innerHTML = html;

  document.getElementById('confirmDelete').addEventListener('click', function() {
    // Remove project
    data.projects = data.projects.filter(p => p.id !== projectId);
    // Remove assignments referencing this project
    data.employees.forEach(emp => {
      emp.assignments = emp.assignments.filter(a => a.projectId !== projectId);
    });
    saveMonthlyData(currentYear, currentMonth, data);
    closeModal();
    renderProjectsTable();
  });
}

// ========== DELEGATED EVENTS ==========

document.addEventListener('click', function(e) {
  // Show Employees button
  if (e.target.classList.contains('show-employees-btn')) {
    const projectId = e.target.dataset.projectId;
    showEmployeesPopup(projectId);
  }
  // Delete Project button
  if (e.target.classList.contains('delete-project-btn')) {
    const projectId = e.target.dataset.projectId;
    deleteProject(projectId);
  }

  if (e.target.classList.contains('unassign-btn')) {
    const empId = e.target.dataset.employeeId;
    const projId = e.target.dataset.projectId;
    unassignEmployee(empId, projId);
    }

  if (e.target.classList.contains('edit-assignment-btn')) {
    const empId = e.target.dataset.employeeId;
    const projId = e.target.dataset.projectId;
    editAssignmentPopup(empId, projId);
}
});


initTestData();
renderProjectsTable();
