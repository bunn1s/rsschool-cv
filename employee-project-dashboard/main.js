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
  const key = year + '-' + month;
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
  const testData = getMonthlyData(2026, 0);
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

// ========== SIDEBAR ==========

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

// ========== PERIOD MANAGEMENT ==========

// Get dropdowns
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');

// Current month/year (default: February 2025)
let currentMonth = 0;
let currentYear = 2026;
let activeTab = localStorage.getItem('activeTab') || 'projects';
monthSelect.value = currentMonth;
yearSelect.value = currentYear;

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

// ========== PROJECT FINANCIAL CALCULATIONS ==========

function getProjectFinancials(project, employees, year, month) {
  let totalEffectiveCapacity = 0;
  const employeeDetails = [];

  // collect all employees assigned to this project
  employees.forEach(emp => {
    const assignment = emp.assignments.find(a => a.projectId === project.id);
    if (!assignment) return;

    const vacCoeff = getVacationCoefficient(emp, year, month);
    const effectiveCapacity = assignment.capacity * assignment.fit * vacCoeff;
    totalEffectiveCapacity += effectiveCapacity;

    employeeDetails.push({
      employee: emp,
      capacity: assignment.capacity,
      fit: assignment.fit,
      effectiveCapacity,
      vacCoeff
    });
  });

  const capacityForRevenue = Math.max(project.capacity, totalEffectiveCapacity);
  const revenuePerUnit = project.budget / capacityForRevenue;

  let totalRevenue = 0;
  let totalCost = 0;
  const breakdown = employeeDetails.map(detail => {
    const revenue = revenuePerUnit * detail.effectiveCapacity;
    const cost = detail.employee.salary * Math.max(0.5, detail.capacity);
    totalRevenue += revenue;
    totalCost += cost;
    return {
      ...detail,
      revenue,
      cost,
      profit: revenue - cost
    };
  });

  return {
    usedEffectiveCapacity: totalEffectiveCapacity,
    capacityForRevenue,
    revenuePerUnit,
    totalRevenue,
    totalCost,
    profit: totalRevenue - totalCost,
    breakdown
  };
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

  let totalOverallProfit = 0;
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
  addProjectForm.reset();
  saveProjectBtn.disabled = true;
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
    id: 'proj-' + Date.now(),
    company: projCompanyInput.value.trim(),
    name: projNameInput.value.trim(),
    budget: parseFloat(projBudgetInput.value),
    capacity: parseInt(projCapacityInput.value)
  };
  data.projects.push(newProject);
  saveMonthlyData(currentYear, currentMonth, data);
  addProjectPanel.classList.remove('open');
  renderProjectsTable();
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
        '<td><a href="#" class="employee-link" data-employee-id="' + a.employee.id + '">' + a.employee.firstName + ' ' + a.employee.lastName + '</a></td>' +
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

    data.projects = data.projects.filter(p => p.id !== projectId);
    data.employees.forEach(emp => {
      emp.assignments = emp.assignments.filter(a => a.projectId !== projectId);
    });
    saveMonthlyData(currentYear, currentMonth, data);
    closeModal();
    renderProjectsTable();
  });
}

// ========== EMPLOYEE ACTIONS (stubs) ==========

function deleteEmployee(empId) {
  const data = getMonthlyData(currentYear, currentMonth);
  const emp = data.employees.find(e => e.id === empId);
  if (!emp) return;

  const modal = document.getElementById('modalContainer');
  modal.innerHTML = `
    <div class="modal-backdrop"><div class="modal-content">
      <button class="modal-close" onclick="closeModal()">×</button>
      <h3>Delete Employee</h3>
      <p>Are you sure you want to delete <strong>${emp.firstName} ${emp.lastName}</strong>?</p>
      <p>All their project assignments will be removed.</p>
      <button class="btn danger" id="confirmDeleteEmp">Delete</button>
      <button class="btn secondary" onclick="closeModal()">Cancel</button>
    </div></div>`;
  document.getElementById('confirmDeleteEmp').addEventListener('click', () => {
    data.employees = data.employees.filter(e => e.id !== empId);
    data.projects.forEach(p => {
    });
    data.employees.forEach(e => {
    });
    saveMonthlyData(currentYear, currentMonth, data);
    closeModal();
    renderEmployeesTable();
    renderProjectsTable();
  });
}

function showAssignmentsPopup(empId) {
  const data = getMonthlyData(currentYear, currentMonth);
  const employee = data.employees.find(e => e.id === empId);
  if (!employee) return;

  const projects = data.projects || [];
  const assignments = employee.assignments || [];

  const modal = document.getElementById('modalContainer');
  let html = '<div class="modal-backdrop"><div class="modal-content">';
  html += '<button class="modal-close" onclick="closeModal()">×</button>';
  html += '<h3>Assignments for ' + employee.firstName + ' ' + employee.lastName + '</h3>';

  if (assignments.length === 0) {
    html += '<p>No assignments for this employee.</p>';
  } else {
    html += '<table><thead><tr><th>Project</th><th>Capacity</th><th>Fit</th><th>Vacation</th><th>Effective</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Actions</th></tr></thead><tbody>';

    assignments.forEach(a => {
      const project = projects.find(p => p.id === a.projectId);
      if (!project) return;
      const vacCoeff = getVacationCoefficient(employee, currentYear, currentMonth);
      const eff = a.capacity * a.fit * vacCoeff;
      const fin = getProjectFinancials(project, data.employees, currentYear, currentMonth);
      const breakdown = fin.breakdown.find(b => b.employee.id === empId);
      const revenue = breakdown ? breakdown.revenue : 0;
      const cost = breakdown ? breakdown.cost : 0;
      const profit = revenue - cost;
      const profitClass = profit >= 0 ? 'positive' : 'negative';
      const vacDays = (employee.vacationDays || []).join(', ') || 'None';

      html += '<tr>' +
        '<td><a href="#" class="project-link" data-project-id="' + project.id + '">' + project.name + '</a></td>' +
        '<td>' + a.capacity.toFixed(2) + '</td>' +
        '<td>' + a.fit.toFixed(2) + '</td>' +
        '<td>' + vacDays + '</td>' +
        '<td>' + eff.toFixed(3) + '</td>' +
        '<td>' + formatMoney(revenue) + '</td>' +
        '<td>' + formatMoney(cost) + '</td>' +
        '<td class="' + profitClass + '">' + formatMoney(profit) + '</td>' +
        '<td>' +
          '<button class="btn primary small edit-assignment-btn" data-employee-id="' + empId + '" data-project-id="' + project.id + '">Edit</button> ' +
          '<button class="btn small danger unassign-btn" data-employee-id="' + empId + '" data-project-id="' + project.id + '">Unassign</button>' +
        '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div></div>';
  modal.innerHTML = html;
}

function showAssignPopup(empId) {
  const data = getMonthlyData(currentYear, currentMonth);
  const employee = data.employees.find(e => e.id === empId);
  if (!employee) return;

  const totalAssigned = employee.assignments.reduce((sum, a) => sum + a.capacity, 0);
  const availableCap = 1.5 - totalAssigned;
  if (availableCap <= 0) {
    console.log('Assign blocked: capacity full');
    return;
  }

  const projects = data.projects;
  if (projects.length === 0) {
    alert('No projects available');
    return;
  }

  const modal = document.getElementById('modalContainer');
  let html = '<div class="modal-backdrop"><div class="modal-content assign-modal">';
  html += '<button class="modal-close" onclick="closeModal()">×</button>';
  html += '<h3>Assign ' + employee.firstName + ' ' + employee.lastName + '</h3>';

  // Current capacity and availability
  html += '<div class="assign-info-row">';
  html += '<span><strong>Current Capacity:</strong> ' + totalAssigned.toFixed(1) + ' / 1.5</span>';
  html += '<span style="margin-left: 30px;"><strong>Available:</strong> ' + availableCap.toFixed(1) + '</span>';
  html += '</div>';

  // Project selector
  html += '<div class="form-group">';
  html += '<label>Select Project:</label>';
  html += '<select id="assignProjectSelect">';
  projects.forEach(proj => {
    const fin = getProjectFinancials(proj, data.employees, currentYear, currentMonth);
    const used = fin.usedEffectiveCapacity.toFixed(1);
    const avail = (proj.capacity - used).toFixed(1);
    html += '<option value="' + proj.id + '">' + proj.name + ' (' + proj.company + ') - Available: ' + avail + '</option>';
  });
  html += '</select>';
  html += '</div>';

  // Capacity slider
  html += '<div class="form-group">';
  html += '<label>Capacity Allocation: <span id="assignCapacityVal">' + Math.min(0.5, availableCap).toFixed(1) + '</span></label>';
  html += '<div class="slider-container">';
  html += '<input type="range" id="assignCapacity" min="0.1" max="' + availableCap.toFixed(1) + '" step="0.1" value="' + Math.min(0.5, availableCap).toFixed(1) + '">';
  html += '</div>';
  html += '<div class="slider-hint">Adjust capacity (0.0 - 1.5)</div>';
  html += '</div>';

  // Fit slider
  html += '<div class="form-group">';
  html += '<label>Project Fit: <span id="assignFitVal">0.8</span></label>';
  html += '<div class="slider-container">';
  html += '<input type="range" id="assignFit" min="0" max="1" step="0.1" value="0.8">';
  html += '</div>';
  html += '<div class="slider-hint">Project fit coefficient (0.0-1.0). Effective capacity = capacity × fit</div>';
  html += '</div>';
  html += '<div id="assignProjectInfo" class="assign-project-info"></div>';

  html += '<div id="assignEffectiveDisplay" class="assign-effective-display"></div>';

  // Warning message
  html += '<div id="assignWarning" class="assign-warning"></div>';

  html += '<div class="form-buttons">';
  html += '<button class="btn assign-save-btn" id="saveAssign">Assign</button>';
  html += '<button class="btn secondary" onclick="closeModal()">Cancel</button>';
  html += '</div>';
  html += '</div></div>';

  modal.innerHTML = html;

  // Get elements after inserting HTML
  const projectSelect = document.getElementById('assignProjectSelect');
  const capacitySlider = document.getElementById('assignCapacity');
  const capacityVal = document.getElementById('assignCapacityVal');
  const fitSlider = document.getElementById('assignFit');
  const fitVal = document.getElementById('assignFitVal');
  const projectInfo = document.getElementById('assignProjectInfo');
  const effectiveDisplay = document.getElementById('assignEffectiveDisplay');
  const warning = document.getElementById('assignWarning');

  if (!projectSelect || !capacitySlider || !fitSlider) {
    console.error('Assign popup elements missing');
    return;
  }

  // Update dynamic information
  function updateAssignInfo() {
    const projId = projectSelect.value;
    const cap = parseFloat(capacitySlider.value);
    const fit = parseFloat(fitSlider.value);
    const project = projects.find(p => p.id === projId);
    if (!project) return;

    const fin = getProjectFinancials(project, data.employees, currentYear, currentMonth);
    const used = fin.usedEffectiveCapacity;
    const effective = cap * fit;
    const newUsed = used + effective;

    projectInfo.innerHTML = '<strong>Project Capacity:</strong> ' + used.toFixed(1) + ' / ' + project.capacity;
    effectiveDisplay.innerHTML = '<strong>Effective Capacity:</strong> ' + effective.toFixed(2) + ' &nbsp; <strong>After Assignment:</strong> ' + newUsed.toFixed(2) + ' / ' + project.capacity;

    if (newUsed > project.capacity) {
      warning.innerHTML = 'Project effective capacity would exceed ' + project.capacity + ' (current: ' + used.toFixed(1) + ', target: ' + newUsed.toFixed(2) + ')';
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  }

  projectSelect.addEventListener('change', updateAssignInfo);
  capacitySlider.addEventListener('input', function() {
    capacityVal.textContent = parseFloat(this.value).toFixed(1);
    updateAssignInfo();
  });
  fitSlider.addEventListener('input', function() {
    fitVal.textContent = parseFloat(this.value).toFixed(1);
    updateAssignInfo();
  });

  updateAssignInfo();

  // Save assignment
  document.getElementById('saveAssign').addEventListener('click', function() {
    const projId = projectSelect.value;
    const cap = parseFloat(capacitySlider.value);
    const fit = parseFloat(fitSlider.value);
    if (isNaN(cap) || isNaN(fit) || cap <= 0) return;

    if (totalAssigned + cap > 1.5) {
      warning.textContent = 'Total capacity exceeds 1.5!';
      warning.style.display = 'block';
      return;
    }

    employee.assignments.push({ projectId: projId, capacity: cap, fit: fit });
    saveMonthlyData(currentYear, currentMonth, data);
    closeModal();
    renderEmployeesTable();
    renderProjectsTable();
  });
}

// ========== AVAILABILITY CALENDAR ==========

function showAvailabilityPopup(empId) {
  const data = getMonthlyData(currentYear, currentMonth);
  const employee = data.employees.find(e => e.id === empId);
  if (!employee) return;

  const year = currentYear;
  const month = currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Today's date for highlighting (only if viewing current real month)
  const today = new Date();
  const isCurrentRealMonth = today.getFullYear() === year && today.getMonth() === month;
  const totalWorkingDays = getWorkingDaysInMonth(year, month);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let calHtml = '<div class="calendar-grid">';
  weekDays.forEach(day => calHtml += '<div class="calendar-weekday">' + day + '</div>');

  const vacationSet = new Set(employee.vacationDays || []);

  // Generate day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isVacation = vacationSet.has(d);
    const isToday = isCurrentRealMonth && d === today.getDate();

    let classes = 'calendar-day';
    if (isWeekend) classes += ' weekend';
    if (isVacation) classes += ' vacation';
    if (isToday)    classes += ' today';

    calHtml += '<div class="' + classes + '" data-day="' + d + '">' + d + '</div>';
  }
  calHtml += '</div>';

  function formatDayRanges(daysArray) {
    if (daysArray.length === 0) return 'None';
    const sorted = [...daysArray].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0], end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) { end = sorted[i]; }
      else {
        ranges.push([start, end]);
        start = end = sorted[i];
      }
    }
    ranges.push([start, end]);
    const mm = String(month + 1).padStart(2, '0');
    return ranges.map(([s, e]) => {
      const sd = String(s).padStart(2, '0') + '.' + mm;
      const ed = String(e).padStart(2, '0') + '.' + mm;
      return s === e ? sd : sd + '-' + ed;
    }).join(', ');
  }

  // Function to update info: working days, vacation list
  function updateCalendarInfo() {
    const selectedDays = Array.from(vacationSet).sort((a, b) => a - b);
    const vacWD = selectedDays.filter(d => {
      const dd = new Date(year, month, d).getDay();
      return dd !== 0 && dd !== 6;
    }).length;
    const remainingWD = totalWorkingDays - vacWD;

    document.getElementById('workingDaysInfo').textContent = remainingWD + '/' + totalWorkingDays;
    document.getElementById('vacationList').textContent = formatDayRanges(selectedDays);
  }

  // Build modal HTML
  const modal = document.getElementById('modalContainer');
  let html = '<div class="modal-backdrop"><div class="modal-content">';
  html += '<button class="modal-close" onclick="closeModal()">×</button>';
  html += '<h3>Availability Calendar for ' + employee.firstName + ' ' + employee.lastName + '</h3>';
  html += '<p>' + new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' }) + '</p>';
  html += calHtml;
  html += '<p>Working days: <span id="workingDaysInfo"></span></p>';
  html += '<p>Vacation days: <span id="vacationList"></span></p>';
  html += '<div class="form-buttons">';
  html += '<button class="btn primary" id="saveVacationBtn">Set Vacation</button>';
  html += '<button class="btn secondary" onclick="closeModal()">Cancel</button>';
  html += '</div>';
  html += '</div></div>';

  modal.innerHTML = html;

  updateCalendarInfo();

  // Toggle vacation days by clicking on day cells
  document.querySelectorAll('.calendar-day').forEach(cell => {
    cell.addEventListener('click', function() {
      const day = parseInt(this.dataset.day);
      if (vacationSet.has(day)) {
        vacationSet.delete(day);
        this.classList.remove('vacation');
      } else {
        vacationSet.add(day);
        this.classList.add('vacation');
      }
      updateCalendarInfo();
    });
  });

  // Save button
  document.getElementById('saveVacationBtn').addEventListener('click', function() {
    employee.vacationDays = Array.from(vacationSet);
    saveMonthlyData(year, month, data);
    closeModal();
    renderEmployeesTable();
    renderProjectsTable();
  });
}

// Show context menu for project link
function showProjectActionsMenu(event, projectId) {
  const rect = event.target.getBoundingClientRect();
  const html = `<div class="action-menu" style="position: fixed; top: ${rect.bottom + 5}px; left: ${rect.left}px;">
    <button class="btn small see-projects-btn" data-project-id="${projectId}">See at Projects</button>
    <button class="btn small danger unassign-from-menu-btn" data-project-id="${projectId}">Unassign</button>
  </div>`;
  const existing = document.querySelector('.action-menu');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!e.target.closest('.action-menu') && !e.target.classList.contains('project-link')) {
        document.querySelector('.action-menu')?.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}

// Show context menu for employee link
function showEmployeeActionsMenu(event, employeeId, projectId) {
  const rect = event.target.getBoundingClientRect();
  const html = `<div class="action-menu" style="position: fixed; top: ${rect.bottom + 5}px; left: ${rect.left}px;">
    <button class="btn small see-employees-btn" data-employee-id="${employeeId}">See at Employees</button>
    <button class="btn small danger unassign-from-menu-btn" data-employee-id="${employeeId}" data-project-id="${projectId || ''}">Unassign</button>
  </div>`;
  const existing = document.querySelector('.action-menu');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!e.target.closest('.action-menu') && !e.target.classList.contains('employee-link')) {
        document.querySelector('.action-menu')?.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 10);
}

// ========== DELEGATED EVENTS ==========

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-employee-btn')) {
      const empId = e.target.dataset.employeeId;
      deleteEmployee(empId);
  }
    if (e.target.classList.contains('show-assignments-btn')) {
      const empId = e.target.dataset.employeeId;
      showAssignmentsPopup(empId);
  }
    if (e.target.classList.contains('assign-btn')) {
      const empId = e.target.dataset.employeeId;
      showAssignPopup(empId);
  }
    if (e.target.classList.contains('availability-btn')) {
      const empId = e.target.dataset.employeeId;
      showAvailabilityPopup(empId);
  }

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

  // See at Projects
if (e.target.classList.contains('see-projects-btn')) {
  const projectId = e.target.dataset.projectId;
  document.querySelector('.nav-item[data-tab="projects"]').click();
  const project = getMonthlyData(currentYear, currentMonth).projects.find(p => p.id === projectId);
  if (project) {

    console.log('See at Projects:', project.name);
    closeModal();
    renderProjectsTable();
  }
}

// See at Employees
if (e.target.classList.contains('see-employees-btn')) {
  const employeeId = e.target.dataset.employeeId;
  document.querySelector('.nav-item[data-tab="employees"]').click();
  const employee = getMonthlyData(currentYear, currentMonth).employees.find(e => e.id === employeeId);
  if (employee) {
    console.log('See at Employees:', employee.firstName, employee.lastName);
    closeModal();
    renderEmployeesTable();
  }
}

// Unassign from menu
if (e.target.classList.contains('unassign-from-menu-btn')) {
  const empId = e.target.dataset.employeeId;
  const projId = e.target.dataset.projectId;
  if (empId && projId) {
    unassignEmployee(empId, projId);
    document.querySelector('.action-menu')?.remove();
  }
}

  // Click on project link (inside assignments popup)
if (e.target.classList.contains('project-link')) {
  e.preventDefault();
  const projectId = e.target.dataset.projectId;
  showProjectActionsMenu(e, projectId);
}

// Click on employee link (inside employees popup)
if (e.target.classList.contains('employee-link')) {
  e.preventDefault();
  const employeeId = e.target.dataset.employeeId;
  const projectId = e.target.closest('tr')?.querySelector('.unassign-btn')?.dataset.projectId || null;
  showEmployeeActionsMenu(e, employeeId, projectId);
}
});

// ========== RENDER EMPLOYEES TABLE ==========

function renderEmployeesTable() {
  const data = getMonthlyData(currentYear, currentMonth);
  const employees = data.employees || [];
  const projects = data.projects || [];
  const tbody = document.getElementById('employeesTableBody');

  if (employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9">No employees for this period.</td></tr>';
    return;
  }

  let rows = '';
  employees.forEach(function(emp) {
    const age = calculateAge(emp.birthDate);
    const totalAssignedCapacity = emp.assignments.reduce(function(sum, a) {
      return sum + a.capacity;
    }, 0);

    let expectedPay = 0;
    let forecastIncome = 0;
    const assignmentsCount = emp.assignments.length;

    if (assignmentsCount === 0) {
      expectedPay = emp.salary * 0.5;
    } else {
      emp.assignments.forEach(function(a) {
        const project = projects.find(function(p) { return p.id === a.projectId; });
        if (!project) return;
        const fin = getProjectFinancials(project, employees, currentYear, currentMonth);
        const breakdown = fin.breakdown.find(function(b) { return b.employee.id === emp.id; });
        if (breakdown) {
          expectedPay += breakdown.cost;
          forecastIncome += breakdown.profit;
        }
      });
    }

    const incomeClass = forecastIncome >= 0 ? 'positive' : 'negative';
    const assignBtnDisabled = totalAssignedCapacity >= 1.5 ? 'disabled' : '';

    rows += '<tr>' +
      '<td>' + emp.firstName + '</td>' +
      '<td>' + emp.lastName + '</td>' +
      '<td>' + age + '</td>' +
      '<td class="editable-position" data-employee-id="' + emp.id + '">' + emp.position + '</td>' +
      '<td class="editable-salary" data-employee-id="' + emp.id + '">' + formatMoney(emp.salary) + '</td>' +
      '<td>' + formatMoney(expectedPay) + '</td>' +
      '<td>' +
        (assignmentsCount > 0
          ? '<button class="btn small show-assignments-btn" data-employee-id="' + emp.id + '">Show Assignments (' + assignmentsCount + ') ' + totalAssignedCapacity.toFixed(1) + '/1.5</button>'
          : '—') +
      '</td>' +
      '<td class="' + incomeClass + '">' + formatMoney(forecastIncome) + '</td>' +
      '<td>' +
        '<button class="btn small availability-btn" data-employee-id="' + emp.id + '">Availability</button> ' +
        '<button class="btn small assign-btn" data-employee-id="' + emp.id + '" ' + assignBtnDisabled + '>Assign</button> ' +
        '<button class="btn small danger delete-employee-btn" data-employee-id="' + emp.id + '">Delete</button>' +
      '</td>' +
    '</tr>';
  });

  tbody.innerHTML = rows;
}

// ========== TAB SWITCHING ==========

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(function(item) {
  item.addEventListener('click', function() {
    navItems.forEach(function(nav) { nav.classList.remove('active'); });
    item.classList.add('active');
    const tab = item.dataset.tab;
    document.getElementById('projectsView').classList.toggle('active', tab === 'projects');
    document.getElementById('employeesView').classList.toggle('active', tab === 'employees');
    localStorage.setItem('activeTab', tab);
    if (tab === 'projects') {
      renderProjectsTable();
    } else {
      renderEmployeesTable();
    }
  });
});

function onPeriodChange() {
  currentMonth = parseInt(monthSelect.value);
  currentYear = parseInt(yearSelect.value);
  const monthName = monthSelect.options[monthSelect.selectedIndex].text;
  console.log('Selected period: ' + monthName + ' ' + currentYear);
  if (document.getElementById('projectsView').classList.contains('active')) {
    renderProjectsTable();
  } else {
    renderEmployeesTable();
  }
}

// ========== ADD EMPLOYEE FORM ==========

const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const addEmployeePanel = document.getElementById('addEmployeePanel');
const cancelEmployeeBtn = document.getElementById('cancelEmployeeBtn');
const saveEmployeeBtn = document.getElementById('saveEmployeeBtn');
const addEmployeeForm = document.getElementById('addEmployeeForm');

// Inputs
const empNameInput = document.getElementById('empName');
const empSurnameInput = document.getElementById('empSurname');
const empDobInput = document.getElementById('empDob');
const empPositionSelect = document.getElementById('empPosition');
const empSalaryInput = document.getElementById('empSalary');

// Error spans
const nameError = document.getElementById('nameError');
const surnameError = document.getElementById('surnameError');
const dobError = document.getElementById('dobError');
const positionError = document.getElementById('positionError');
const salaryError = document.getElementById('salaryError');

// Open panel
addEmployeeBtn.addEventListener('click', function() {
  addEmployeePanel.classList.add('open');
  addEmployeeForm.reset();
  saveEmployeeBtn.disabled = true;
  nameError.style.display = 'none';
  surnameError.style.display = 'none';
  dobError.style.display = 'none';
  positionError.style.display = 'none';
  salaryError.style.display = 'none';
});

// Close panel
cancelEmployeeBtn.addEventListener('click', function() {
  addEmployeePanel.classList.remove('open');
});

// Validation
function validateEmployeeForm() {
  const name = empNameInput.value.trim();
  const surname = empSurnameInput.value.trim();
  const dob = empDobInput.value;
  const position = empPositionSelect.value;
  const salary = empSalaryInput.value;

  let valid = true;

  if (name.length < 3 || !/^[A-Za-z]+$/.test(name)) {
    nameError.textContent = 'Min 3 letters, letters only';
    nameError.style.display = 'block';
    valid = false;
  } else { nameError.style.display = 'none'; }

  if (surname.length < 3 || !/^[A-Za-z]+$/.test(surname)) {
    surnameError.textContent = 'Min 3 letters, letters only';
    surnameError.style.display = 'block';
    valid = false;
  } else { surnameError.style.display = 'none'; }

  if (!dob || calculateAge(dob) < 18) {
    dobError.textContent = 'Must be at least 18 years old';
    dobError.style.display = 'block';
    valid = false;
  } else { dobError.style.display = 'none'; }

  if (!position) {
    positionError.textContent = 'Please select a position';
    positionError.style.display = 'block';
    valid = false;
  } else { positionError.style.display = 'none'; }

  if (salary === '' || parseFloat(salary) <= 0) {
    salaryError.textContent = 'Must be a positive number';
    salaryError.style.display = 'block';
    valid = false;
  } else { salaryError.style.display = 'none'; }

  saveEmployeeBtn.disabled = !valid;
}

// Attach validation events
empNameInput.addEventListener('input', validateEmployeeForm);
empSurnameInput.addEventListener('input', validateEmployeeForm);
empDobInput.addEventListener('input', validateEmployeeForm);
empPositionSelect.addEventListener('change', validateEmployeeForm);
empSalaryInput.addEventListener('input', validateEmployeeForm);

// Save employee
saveEmployeeBtn.addEventListener('click', function() {
  const data = getMonthlyData(currentYear, currentMonth);
  const newEmployee = {
    id: 'emp-' + Date.now(),
    firstName: empNameInput.value.trim(),
    lastName: empSurnameInput.value.trim(),
    birthDate: empDobInput.value,
    position: empPositionSelect.value,
    salary: parseFloat(empSalaryInput.value),
    assignments: [],
    vacationDays: []
  };
  data.employees.push(newEmployee);
  saveMonthlyData(currentYear, currentMonth, data);
  addEmployeePanel.classList.remove('open');
  renderEmployeesTable();

  if (document.getElementById('projectsView').classList.contains('active')) {
    renderProjectsTable();
  }
});

if (activeTab === 'employees') {
  document.querySelector('.nav-item[data-tab="employees"]').click();
} else {
  document.querySelector('.nav-item[data-tab="projects"]').click();
}

(function restoreTab() {
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab === 'employees') {
    document.querySelector('.nav-item[data-tab="employees"]').click();
  } else {
    document.querySelector('.nav-item[data-tab="projects"]').click();
  }
})();

// ========== INLINE EDITING (Position & Salary) ==========

document.getElementById('employeesTableBody').addEventListener('click', function(e) {
  const target = e.target;

  // ---------- Edit Position ----------
  if (target.classList.contains('editable-position')) {

    if (target.querySelector('select')) return;

    const empId = target.dataset.employeeId;
    const currentPosition = target.textContent.trim();
    const select = document.createElement('select');
    const positions = ['Junior', 'Middle', 'Senior', 'Lead', 'Architect', 'Business Manager'];
    positions.forEach(pos => {
      const option = document.createElement('option');
      option.value = pos;
      option.textContent = pos;
      if (pos === currentPosition) option.selected = true;
      select.appendChild(option);
    });

    // Replace cell content with the select
    target.textContent = '';
    target.appendChild(select);
    select.focus();

    // Save and refresh when value changes or focus leaves
    function savePosition() {
      const data = getMonthlyData(currentYear, currentMonth);
      const emp = data.employees.find(e => e.id === empId);
      if (emp) {
        emp.position = select.value;
        saveMonthlyData(currentYear, currentMonth, data);
      }
      // Re-render to update both tables
      renderEmployeesTable();
      renderProjectsTable();
    }

    select.addEventListener('change', savePosition);
    select.addEventListener('blur', savePosition);
  }

  // ---------- Edit Salary ----------
  if (target.classList.contains('editable-salary')) {
    if (target.querySelector('input')) return;

    const empId = target.dataset.employeeId;
    const currentSalary = parseFloat(target.textContent.replace(/[^0-9.]/g, ''));

    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentSalary;
    input.step = '0.01';
    input.min = '0.01';

    target.textContent = '';
    target.appendChild(input);
    input.focus();

    function saveSalary() {
      const newSalary = parseFloat(input.value);
      if (isNaN(newSalary) || newSalary <= 0) {
        renderEmployeesTable();
        renderProjectsTable();
        return;
      }
      const data = getMonthlyData(currentYear, currentMonth);
      const emp = data.employees.find(e => e.id === empId);
      if (emp) {
        emp.salary = newSalary;
        saveMonthlyData(currentYear, currentMonth, data);
      }
      renderEmployeesTable();
      renderProjectsTable();
    }

    input.addEventListener('blur', saveSalary);
    input.addEventListener('keypress', function(ev) {
      if (ev.key === 'Enter') saveSalary();
      if (ev.key === 'Escape') {
        renderEmployeesTable();
        renderProjectsTable();
      }
    });
  }
});

initTestData();
renderProjectsTable();
