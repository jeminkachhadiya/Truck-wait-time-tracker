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
                <div>
                    <strong>Load Number:</strong> ${truck.load_number}<br>
                    <strong>Driver Name:</strong> ${truck.driver_name}<br>
                    <strong>Arrival Time:</strong> ${new Date(truck.arrival_time).toLocaleString()}<br>
                    <strong>Departure Time:</strong> ${new Date(truck.departure_time).toLocaleString()}<br>
                    <strong>Wait Time:</strong> ${truck.wait_time}
                </div><hr>`;
        });
    }

    // Load wait time analysis into the "Wait Time Analysis" tab
    async function loadWaitTimeAnalysis(startDate, endDate) {
        let url = '/api/wait-time-analysis';
        if (startDate && endDate) {
            url += `?start_date=${startDate}&end_date=${endDate}`;
        }
        const response = await fetch(url);
        const analysisData = await response.json();
        const analysisSection = document.getElementById('analysis-section');
        analysisSection.innerHTML = `
            <h2>Wait Time Analysis</h2>
            <p><strong>Average Wait Time:</strong> ${analysisData.average_wait_time} minutes</p>
            <p><strong>Longest Wait Time:</strong> ${analysisData.longest_wait} minutes</p>
            <p><strong>Total Trucks Processed:</strong> ${analysisData.total_trucks_processed}</p>`;
    }

    // Handle tab navigation
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');

            if (e.target.id === 'active-tab') {
                loadActiveTrucks();
                document.getElementById('active-section').style.display = 'block';
                document.getElementById('completed-section').style.display = 'none';
                document.getElementById('analysis-section').style.display = 'none';
            } else if (e.target.id === 'completed-tab') {
                loadCompletedTrucks();
                document.getElementById('active-section').style.display = 'none';
                document.getElementById('completed-section').style.display = 'block';
                document.getElementById('analysis-section').style.display = 'none';
            } else if (e.target.id === 'analysis-tab') {
                loadWaitTimeAnalysis();
                document.getElementById('active-section').style.display = 'none';
                document.getElementById('completed-section').style.display = 'none';
                document.getElementById('analysis-section').style.display = 'block';
            }
        });
    });

    // Initial load
    loadActiveTrucks();
});
