# RULES.md

## BACKEND RULES

* Use MVC structure (controllers, routes, models)
* Keep business logic in controllers
* Use middleware for validation/auth
* Use environment variables (.env)
* Never write SQL directly in routes

---

## FRONTEND RULES

* Use functional components only
* Use hooks (useState, useEffect)
* Keep components small and reusable
* Separate UI and logic

---

## NAMING CONVENTIONS

* camelCase for variables
* PascalCase for components
* kebab-case for file names

---

## API RULES

* Use REST conventions
* Always return JSON
* Include status codes
* Use consistent response format:

{
success: true,
data: {},
message: ""
}

---

## SECURITY

* Validate all inputs
* Sanitize data
* Protect routes with JWT
* Never expose sensitive data

---

## PERFORMANCE

* Avoid unnecessary queries
* Use indexing in database
* Optimize images

---

## GENERAL

* Code must be readable
* Add comments where necessary
* Avoid overengineering
