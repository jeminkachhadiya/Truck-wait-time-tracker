# Truck Wait Time Tracker

A web-based application for tracking and managing truck wait times at facilities. This application helps logistics managers and facility operators monitor truck movements, wait times, and analyze efficiency metrics.

## Features

### 1. Truck Check-In System
- Easy-to-use interface for registering new truck arrivals
- Capture essential information:
  - Driver Name (letters and spaces only)
  - Load Number
  - Optional Notes
  - Automatic timestamp recording

### 2. Active Trucks Management
- Real-time view of all trucks currently at the facility
- Quick actions for each truck:
  - Check-out functionality
  - Delete records (password protected)
- Clear display of:
  - Load numbers
  - Driver names
  - Arrival times

![Active Trucks Management](files/Active%20Truck.png)

### 3. Completed Trucks Tracking
- Comprehensive history of processed trucks
- Advanced filtering capabilities:
  - Date range selection
  - Custom date filters

![Completed Trucks Tracking](files/Completed%20Truck.png)
- Detailed information display:
  - Load Number
  - Driver Name
  - Arrival Time
  - Departure Time
  - Total Wait Time
- Record management:
  - Edit functionality
  - Secure deletion (password protected)
  
![Password Protected Delete Operation](files/Password%20protected%20delete%20operation.png)

### 4. Wait Time Analysis
- Powerful analytics dashboard featuring:
  - Average wait time calculations
  - Longest wait time tracking
  - Total trucks processed
- Interactive data visualization:
  - Bar chart representation of wait times
  - Load number-based tracking
  - Driver-specific wait time analysis
- Customizable date range filtering

![Wait Time Analysis Dashboard](files/Wait%20time%20analysis.png)

## Technical Requirements

### Prerequisites
- Python 3.x
- SQLite database
- Modern web browser

### Dependencies
```
Flask
Flask-SQLAlchemy
waitress
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd TruckWaitTimeTracker
```

2. Install required packages:
```bash
pip install -r requirements.txt
```

3. Set up the database:
- Ensure the database directory exists at `C:/Database/`
- The application will automatically create the database file `trucks.db`

## Running the Application

1. Start the server:
```bash
python run_app.py
```

2. The application will automatically open in your default web browser at `http://localhost:8080`

## Security Features

- Password protection for sensitive operations:
  - Record deletion
  - Data modification
- Input validation for driver names
- Secure API endpoints

## Data Management

- Automatic timestamp recording for arrivals and departures
- Persistent storage in SQLite database
- Data filtering capabilities
- Real-time updates

## User Interface

The application features a clean, intuitive interface with three main sections:

1. Check-In Form
   - Simple form for new truck registration
   - Validation for required fields

2. Active/Completed Trucks Tabs
   - Easy navigation between current and historical records
   - Clear presentation of truck information
   - Quick access to management actions

3. Analysis Dashboard
   - Visual representation of wait times
   - Key performance metrics
   - Date-based filtering options

## Best Practices for Use

1. Regular Monitoring
   - Keep track of active trucks
   - Process check-outs promptly
   - Review wait time analytics periodically

2. Data Management
   - Use the notes field for important information
   - Regularly verify completed records
   - Utilize date filters for specific time periods

3. Security
   - Keep deletion password secure
   - Verify information before editing records
   - Regular database backups recommended

## Creating Executable Version

To create a standalone executable version of the application:

1. Install PyInstaller:
```bash
pip install pyinstaller
```

2. Create the executable:
```bash
pyinstaller --onefile --add-data "templates;templates" --add-data "static;static" --icon=truck_blue.ico run_app.py
```

This will create:
- A single executable file in the `dist` directory
- The executable will include all necessary files (templates, static files)
- Custom truck icon for the application
- No Python installation required to run the executable

## Support

For technical support or feature requests, Raise an issue in the repository.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
