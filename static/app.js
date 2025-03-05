document.addEventListener('DOMContentLoaded', () => {
    // Clear form fields after submission
    document.getElementById('checkin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const driverName = document.getElementById('driver-name').value;
        const loadNumber = document.getElementById('load-number').value;
        const notes = document.getElementById('notes').value;

        const response = await fetch('/api/truck-arrival', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driver_name: driverName, load_number: loadNumber, notes })
        });

        if (response.ok) {
            alert('Truck arrival recorded');
            document.getElementById('driver-name').value = '';
            document.getElementById('load-number').value = '';
            document.getElementById('notes').value = '';
            loadActiveTrucks();
        }
    });

    // Validate driver name input
    document.getElementById('driver-name').addEventListener('input', function(e) {
        const input = e.target;
        const regex = /^[A-Za-z\s]+$/;
        if (!regex.test(input.value)) {
            input.setCustomValidity('Only letters and spaces are allowed.');
        } else {
            input.setCustomValidity('');
        }
    });

    // Load active trucks into the "Active Trucks" tab
    async function loadActiveTrucks() {
        const response = await fetch('/api/trucks?status=active');
        const trucks = await response.json();
        const activeSection = document.getElementById('active-section');
        activeSection.innerHTML = '<h2>Active Trucks</h2>';
        trucks.forEach(truck => {
            activeSection.innerHTML += `
                <div class="truck-entry">
                    <strong>Load Number:</strong> ${truck.load_number}<br>
                    <strong>Driver Name:</strong> ${truck.driver_name}<br>
                    <strong>Arrival Time:</strong> ${new Date(truck.arrival_time).toLocaleString()}<br>
                    <button class="btn btn-warning btn-sm checkout-btn" data-truck-id="${truck.id}">Check Out</button>
                </div><hr>`;
        });

        // Add event listeners to checkout buttons
        document.querySelectorAll('.checkout-btn').forEach(button => {
            button.addEventListener('click', handleCheckout);
        });
    }

    // Convert seconds into HH:MM:SS format
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(1, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Handle truck check-out
    async function handleCheckout(e) {
        const truckId = e.target.getAttribute('data-truck-id');
        const response = await fetch(`/api/truck-checkout/${truckId}`, {
            method: 'PUT'
        });

        if (response.ok) {
            alert('Truck checked out successfully');
            loadActiveTrucks(); // Reload active trucks
            loadCompletedTrucks(); // Reload completed trucks
        } else {
            alert('Failed to check out truck');
        }
    }

    // Load completed trucks into the "Completed Trucks" tab
    async function loadCompletedTrucks(startDate, endDate) {
        let url = '/api/trucks?status=completed';
        if (startDate && endDate) {
            url += `&start_date=${startDate}&end_date=${endDate}`;
        }
    
        const response = await fetch(url);
        const trucks = await response.json();
    
        // Sort trucks by arrival time (latest first)
        trucks.sort((a, b) => new Date(b.arrival_time) - new Date(a.arrival_time));
    
        const completedSection = document.getElementById('completed-section');
        completedSection.innerHTML = `
            <div class="row">
                <div class="col-md-9">
                    <h2>Completed Trucks</h2>
                    <div id="completed-trucks-list" class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Load Number</th>
                                    <th>Driver Name</th>
                                    <th>Arrival Time</th>
                                    <th>Departure Time</th>
                                    <th>Wait Time</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="completed-trucks-body"></tbody>
                        </table>
                    </div>
                </div>
                <div class="col-md-3">
                    <br><br>
                    <h5>Date Filter (Arrival Time)</h5>
                    <div class="form-group mb-3">
                        <label for="completed-start-date">Start Date:</label>
                        <input type="date" id="completed-start-date" class="form-control">
                    </div>
                    <div class="form-group mb-3">
                        <label for="completed-end-date">End Date:</label>
                        <input type="date" id="completed-end-date" class="form-control">
                    </div>
                    <button id="completed-filter-btn" class="btn btn-secondary mt-2">Filter</button>
                </div>
            </div>`;    
    
        const completedTrucksBody = document.getElementById('completed-trucks-body');
        trucks.forEach(truck => {
            let waitTimeInSeconds = 0;
            if (truck.departure_time && truck.arrival_time) {
                const arrivalTime = new Date(truck.arrival_time).getTime();
                const departureTime = new Date(truck.departure_time).getTime();
                waitTimeInSeconds = Math.floor((departureTime - arrivalTime) / 1000);
            }
            const formattedWaitTime = formatTime(waitTimeInSeconds);
    
            completedTrucksBody.innerHTML += `
                <tr>
                    <td>${truck.load_number}</td>
                    <td>${truck.driver_name}</td>
                    <td>${new Date(truck.arrival_time).toLocaleString()}</td>
                    <td>${new Date(truck.departure_time).toLocaleString()}</td>
                    <td>${formattedWaitTime}</td>
                    <td><button class="btn btn-secondary btn-sm edit-btn" data-truck-id="${truck.id}">Edit</button></td>
                </tr>`;
        });
    
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEdit);
        });
    
        // Add event listener for date filter button
        document.getElementById('completed-filter-btn').addEventListener('click', () => {
            const startDateInput = document.getElementById('completed-start-date').value;
            const endDateInput = document.getElementById('completed-end-date').value;
            loadCompletedTrucks(startDateInput, endDateInput);
        });
    }    
    
    // Handle truck record editing
    async function handleEdit(e) {
        const truckId = e.target.getAttribute('data-truck-id');
    
        // Collect all inputs in a single prompt sequence
        const inputs = [
            { label: 'Enter new Load Number (leave blank to keep unchanged):', key: 'load_number' },
            { label: 'Enter new Driver Name (leave blank to keep unchanged):', key: 'driver_name' },
            { label: 'Enter new Notes (leave blank to keep unchanged):', key: 'notes' },
            { label: 'Enter password:', key: 'password' }
        ];
    
        const updatedData = {};
        for (const input of inputs) {
            const value = prompt(input.label);
            if (value === null) return; // Stop if user cancels
            updatedData[input.key] = value || undefined; // Keep blank values as undefined
        }
    
        // Send request to server
        const response = await fetch(`/api/truck-edit/${truckId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
    
        if (response.ok) {
            alert('Truck record updated successfully');
            loadCompletedTrucks(); // Reload completed trucks list
        } else {
            const errorData = await response.json();
            alert(`Failed to update record: ${errorData.error || 'Unknown error'}`);
        }
    }    

    // Load wait time analysis into the "Wait Time Analysis" tab
    async function loadWaitTimeAnalysis(startDate, endDate) {
        let url = '/api/wait-time-analysis';
        if (startDate && endDate) {
            url += `?start_date=${startDate}&end_date=${endDate}`;
        }
    
        const response = await fetch(url);
        const { analysis, graph } = await response.json();
    
        const analysisSection = document.getElementById('analysis-section');
        analysisSection.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <h5>Date Filter (Arrival Time)</h5>
                    <div class="form-group mb-3">
                        <label for="analysis-start-date">Start Date:</label>
                        <input type="date" id="analysis-start-date" class="form-control">
                    </div>
                    <div class="form-group mb-3">
                        <label for="analysis-end-date">End Date:</label>
                        <input type="date" id="analysis-end-date" class="form-control">
                    </div>
                    <button id="analysis-filter-btn" class="btn btn-secondary mt-2">Filter</button>
                    <hr>
                    <p><strong>Average Wait Time:</strong> ${formatTime(Math.round(analysis.average_wait_time * 60))}</p>
                    <p><strong>Longest Wait Time:</strong> ${formatTime(Math.round(analysis.longest_wait * 60))}</p>
                    <p><strong>Total Trucks Processed:</strong> ${analysis.total_trucks_processed}</p>
                </div>
                <div class="col-md-8">
                    <h3>Wait Time Analysis</h3>
                    <canvas id="waitTimeChart"></canvas>
                </div>
            </div>`;
    
        // Render Chart.js graph after ensuring data is loaded
        const ctx = document.getElementById('waitTimeChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: graph.labels, // Load numbers
                datasets: [{
                    label: 'Wait Time',
                    data: graph.values.map(value => Math.round(value * 60)), // Convert minutes to seconds
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const seconds = context.raw; // Raw value is in seconds
                                const formattedTime = formatTime(seconds); // Format as HH:MM:SS
                                const driverName = graph.driverNames[context.dataIndex]; // Driver name from backend
                                return [`Wait Time: ${formattedTime}`,`Driver Name: ${driverName}`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Load Numbers' }
                    },
                    y: {
                        title: { display: true, text: 'Wait Time (seconds)' },
                        ticks: {
                            callback: value => formatTime(value) // Format y-axis values as HH:MM:SS
                        }
                    }
                }
            }
        });
    
        // Add event listener for date filter button
        document.getElementById('analysis-filter-btn').addEventListener('click', () => {
            const startDateInput = document.getElementById('analysis-start-date').value;
            const endDateInput = document.getElementById('analysis-end-date').value;
            loadWaitTimeAnalysis(startDateInput, endDateInput);
        });
    }    
    
    // Handle tab navigation
    // Tab switching logic
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove 'active' class from all tabs
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            // Add 'active' class to the clicked tab
            e.target.classList.add('active');
    
            // Show/hide sections based on the clicked tab
            if (e.target.id === 'active-tab') {
                document.getElementById('active-section').style.display = 'block';
                document.getElementById('completed-section').style.display = 'none';
                document.getElementById('analysis-section').style.display = 'none';
                loadActiveTrucks(); // Load active trucks when switching to this tab
            } else if (e.target.id === 'completed-tab') {
                document.getElementById('active-section').style.display = 'none';
                document.getElementById('completed-section').style.display = 'block';
                document.getElementById('analysis-section').style.display = 'none';
                loadCompletedTrucks(); // Load completed trucks when switching to this tab
            } else if (e.target.id === 'analysis-tab') {
                document.getElementById('active-section').style.display = 'none';
                document.getElementById('completed-section').style.display = 'none';
                document.getElementById('analysis-section').style.display = 'block';
                loadWaitTimeAnalysis(); // Load analysis data when switching to this tab
            }
        });
    });
    
    // Initial load: Show active trucks by default
    document.getElementById('active-tab').click();  
});
