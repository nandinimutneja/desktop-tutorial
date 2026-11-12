# Library Book Reservation System

A frontend-only library platform built with HTML5, CSS3 and Vanilla JavaScript. Data is stored in the browser's LocalStorage (no backend needed).

## Run
1. Open this folder in VS Code.
2. Install the **Live Server** extension, right-click `index.html` -> **Open with Live Server**.
3. An internet connection is needed for Google Fonts and Font Awesome icons (book covers, logo and hero are local files).

## Pages
`index.html` Home | `books.html` Catalogue | `reservation.html` Reserve | `my-reservations.html` Dashboard | `login.html` Login/Register | `about.html` About + Feedback

## How it works
- `js/script.js` - book data, LocalStorage helpers, navbar/footer, login/register, stats, feedback.
- `js/books.js` - search, category/availability filters, sorting.
- `js/reservation.js` - reservation form + My Reservations dashboard.
- Availability = total copies - active reservations, so reserving/cancelling updates it everywhere.
- Reservations past their return date automatically become "Completed".
- Books "Eloquent JavaScript" and "Hands-On Machine Learning" have 0 copies to demonstrate the unavailable state.

## Note
Login is a demo; passwords are stored in plain text in LocalStorage. Not for production use.
To reset all data: browser DevTools -> Application -> Local Storage -> Clear.
