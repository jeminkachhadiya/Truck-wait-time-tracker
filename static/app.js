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
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

        const completedSection = document.getElementById('completed-section');
        completedSection.innerHTML = '<h2>Completed Trucks</h2>';

        trucks.forEach(truck => {
            completedSection.innerHTML += `
                <div class="truck-entry">
                    <strong>Load Number:</strong> ${truck.load_number}<br>
                    <strong>Driver Name:</strong> ${truck.driver_name}<br>
                    <strong>Arrival Time:</strong> ${new Date(truck.arrival_time).toLocaleString()}<br>
                    <strong>Departure Time:</strong> ${new Date(truck.departure_time).toLocaleString()}<br>
                    <strong>Wait Time:</strong> ${truck.wait_time}<br>
                    <button class="btn btn-secondary btn-sm edit-btn" data-truck-id="${truck.id}">Edit</button>
                </div><hr>`;
        });
    
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEdit);
        });
    }
    
    async function handleEdit(e) {
        const truckId = e.target.getAttribute('data-truck-id');

        const newLoadNumber = prompt('Enter new Load Number (leave blank to keep unchanged):');
        const newDriverName = prompt('Enter new Driver Name (leave blank to keep unchanged):');
        const newNotes = prompt('Enter new Notes (leave blank to keep unchanged):');

        const password = prompt('Enter password:');

        const response = await fetch(`/api/truck-edit/${truckId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                load_number: newLoadNumber || undefined,
                driver_name: newDriverName || undefined,
                notes: newNotes || undefined,
                password: password
            })
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
                    <h3>Date Filters</h3>
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
