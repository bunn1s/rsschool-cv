# Employee & Project Dashboard

A comprehensive management application for tracking employees, projects, and their assignments across different time periods.

## Features

- **Monthly snapshots** – each month stores an independent copy of all employees and projects
- **Employee management** – add, delete, and inline edit position and salary
- **Project management** – add and delete projects
- **Assign employees to projects** with flexible capacity (0.0–1.5) and fit coefficient
- **Financial calculations** – effective capacity, revenue, costs, and profit for projects and employees
- **Availability calendar** – set vacation days per employee with working days calculation
- **Detail popups** – view employees on a project and assignments of an employee
- **Data persistence** – all data stored in localStorage and loaded on page refresh

## Tech Stack

- HTML, CSS, JavaScript (vanilla, no frameworks)
- localStorage for data storage

## How to Run

https://bunn1s.github.io/rsschool-cv/employee-project-dashboard/

## Special Notes

- Sorting and filtering icons are present but not yet functional.
- "Seed Data" feature (copying data between months) is not implemented.
- Assignment popup opens centered instead of near the button.
