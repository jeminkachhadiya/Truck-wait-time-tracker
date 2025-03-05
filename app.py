from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import re
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Database/trucks.db'
db = SQLAlchemy(app)

class Truck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    load_number = db.Column(db.String(50), nullable=False)
    driver_name = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.String(250))
    arrival_time = db.Column(db.DateTime, nullable=False)
    departure_time = db.Column(db.DateTime)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/truck-arrival', methods=['POST'])
def truck_arrival():
    data = request.json
    driver_name = data.get('driver_name', '')
    
    # Check if driver_name contains only letters and spaces
    if not re.match(r'^[A-Za-z\s]+$', driver_name):
        return jsonify({'error': 'Driver name should contain only letters and spaces'}), 400
    
    new_truck = Truck(
        load_number=data['load_number'],
        driver_name=driver_name,
        notes=data.get('notes', ''),
        arrival_time=datetime.now()
    )
    db.session.add(new_truck)
    db.session.commit()
    return jsonify({'message': 'Truck arrival recorded', 'id': new_truck.id}), 201

@app.route('/api/truck-checkout/<int:truck_id>', methods=['PUT'])
def truck_checkout(truck_id):
    truck = Truck.query.get_or_404(truck_id)
    truck.departure_time = datetime.now()
    db.session.commit()
    return jsonify({'message': 'Truck checked out successfully'}), 200

@app.route('/api/trucks', methods=['GET'])
def get_trucks():
    status = request.args.get('status', 'active')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Truck.query
    if status == 'completed':
        query = query.filter(Truck.departure_time.isnot(None))
        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)  # Add one day to include the end date
            query = query.filter(Truck.arrival_time >= start, Truck.arrival_time < end)
        elif not start_date and not end_date:
            today = datetime.now().date()
            query = query.filter(db.func.date(Truck.arrival_time) == today)
    else:
        query = query.filter(Truck.departure_time.is_(None))

    trucks = query.all()
    return jsonify([{
        'id': truck.id,
        'load_number': truck.load_number,
        'driver_name': truck.driver_name,
        'arrival_time': truck.arrival_time.isoformat(),
        'departure_time': truck.departure_time.isoformat() if truck.departure_time else None,
        'wait_time': str(truck.departure_time - truck.arrival_time) if truck.departure_time else 'In progress',
        'notes': truck.notes
    } for truck in trucks])

@app.route('/api/truck-edit/<int:truck_id>', methods=['PUT'])
def truck_edit(truck_id):
    data = request.json
    # password = data.get('password')
    
    # # Verify password
    # if password != '0000':
    #     return jsonify({'error': 'Unauthorized access. Incorrect password.'}), 403
    
    # Fetch the truck record
    truck = Truck.query.get_or_404(truck_id)
    
    # Update fields if provided
    truck.load_number = data.get('load_number', truck.load_number)
    truck.driver_name = data.get('driver_name', truck.driver_name)
    truck.notes = data.get('notes', truck.notes)
    db.session.commit()
    
    return jsonify({'message': 'Truck record updated successfully'}), 200


@app.route('/api/truck-delete/<int:truck_id>', methods=['DELETE'])
def truck_delete(truck_id):
    data = request.json
    password = data.get('password')
    
    # Verify password
    if password != '247@247':
        return jsonify({'error': 'Unauthorized access. Incorrect password.'}), 403
    
    # Fetch the truck record
    truck = Truck.query.get_or_404(truck_id)
    
    # Delete the truck
    db.session.delete(truck)
    db.session.commit()
    
    return jsonify({'message': 'Truck record deleted successfully'}), 200


@app.route('/api/wait-time-analysis', methods=['GET'])
def wait_time_analysis():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Truck.query.filter(Truck.departure_time.isnot(None))
    if start_date and end_date:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)  # Add one day to include the end date
        query = query.filter(Truck.arrival_time >= start, Truck.arrival_time < end)
    else:
        today = datetime.now().date()
        query = query.filter(db.func.date(Truck.arrival_time) == today)

    trucks = query.all()

    total_wait_times = [
        (truck.departure_time - truck.arrival_time).total_seconds() / 60 for truck in trucks
    ]

    analysis_data = {
        'average_wait_time': round(sum(total_wait_times) / len(total_wait_times), 2) if total_wait_times else 0,
        'longest_wait': round(max(total_wait_times), 2) if total_wait_times else 0,
        'total_trucks_processed': len(trucks)
    }

    # Data for graph
    graph_data = {
        'labels': [truck.load_number for truck in trucks],
        'values': total_wait_times,
        'driverNames': [truck.driver_name for truck in trucks]
    }

    return jsonify({'analysis': analysis_data, 'graph': graph_data})



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
