# RegiTrack - Vehicle Registration Tracking Application

RegiTrack is a web application designed for managing and tracking vehicle registration expiration dates. It allows users to add new vehicles, view existing ones, and get a calendar overview of upcoming registration expirations.

## Demo

* **Frontend:** [https://car-registration-tracker-frontend.onrender.com](https://car-registration-tracker-frontend.onrender.com) * **Backend API:** [https://car-registration-tracker-backend.onrender.com/api](https://car-registration-tracker-backend.onrender.com/api) ## Features

* **Add New Vehicles:** A form to input vehicle details, including make, model, registration number, registration and expiration dates, vehicle type, and owner's contact information (phone, email).
* **View All Vehicles:** A paginated tabular display of all entered vehicles.
    * Sequential row numbering.
    * Expiration date cell coloring based on urgency (Red: expires in <7 days or expired; Yellow: <30 days; Green: >=30 days).
    * Search functionality to filter vehicles across all key fields.
    * Options to edit and delete each vehicle (with a confirmation modal for deletion).
* **Edit Vehicle Data:** A modal form to update existing vehicle information.
* **Calendar View:** FullCalendar integration displaying vehicle registration expiration dates.
    * Calendar events are color-coded with the same logic as the table.
    * Monthly, weekly, and (optionally) multi-month year views.
    * Localization to Serbian.
* **Client-Side Form Validation:** Basic validation on input and edit forms.
* **User Feedback Messages:** Display success or error messages after operations.

## Technologies Used

### Frontend

* HTML5
* CSS3 (with Bootstrap 5 for styling)
* JavaScript (Vanilla JS, ES6+)
* [Bootstrap 5](https://getbootstrap.com/) - CSS Framework
* [FullCalendar](https://fullcalendar.io/) - Calendar display library
* [Font Awesome](https://fontawesome.com/) (optional, for icons)

### Backend

* Node.js
* Express.js - Web framework for Node.js
* MySQL (database, hosted on TiDB Cloud in this example)
* `mysql2` - Node.js driver for MySQL
* `cors` - Middleware for Cross-Origin Resource Sharing
* `body-parser` - Middleware for parsing request bodies (or `express.json()`)
* `dotenv` - For managing environment variables locally

### Deployment Platforms

* **Backend:** Render.com (as a Web Service)
* **Frontend:** Render.com (as a Static Site)
* **Database:** TiDB Cloud (or other cloud MySQL provider)

## Running the Project Locally

### Prerequisites

* Node.js and npm (or Yarn) installed
* A local MySQL server instance (or access to a MySQL server)

### Backend Setup

1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/your-repo.git](https://github.com/your-username/your-repo.git)
    cd your-repo/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` folder and add your **local** MySQL database credentials:
    ```dotenv
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_local_mysql_password
    DB_NAME=car_registration_tracker
    DB_PORT=3306
    # Add SSL options if needed for your local DB (usually not)
    ```
4.  Create the `car_registration_tracker` database and the `vehicle_types` and `vehicles` tables using the provided SQL script (you should include the SQL script or describe it here).
5.  Start the backend server:
    ```bash
    npm start
    ```
    The server should be running at `http://localhost:3000`.

### Frontend Setup

1.  Navigate to the `frontend` directory.
2.  Ensure that `API_BASE_URL` in `frontend/javascript/common.js` (or wherever it's defined) is set to your local backend address:
    ```javascript
    const API_BASE_URL = 'http://localhost:3000/api';
    ```
3.  Open `index.html` (or `add_vehicle.html` if that's your main entry point) in your browser, preferably using a live server (e.g., Live Server extension in VS Code).

## Project Structure (Example)
