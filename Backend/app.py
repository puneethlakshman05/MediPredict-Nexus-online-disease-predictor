from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
import json
import numpy as np
import pandas as pd
import statistics
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from pymongo import MongoClient
import bcrypt
from bson import ObjectId
import datetime
import re
from datetime import timedelta
import uuid
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# JWT Config
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your_secret_key")
jwt = JWTManager(app)

# MongoDB Connection
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["hospital_db"]
    doctors_collection = db["doctors"]
    patients_collection = db["patients"]
    appointments_collection = db["appointments"]
    admins_collection = db["admins"]
    notifications_collection = db["notifications"]
    reset_tokens_collection = db["reset_tokens"]

    # Set up TTL index for notifications_collection
    notifications_collection.create_index("expires_at", expireAfterSeconds=0)
except Exception as e:
    print(f"MongoDB connection error: {e}")
    raise

# Ensure existing notifications have expires_at
try:
    current_time = datetime.datetime.utcnow()
    notifications_collection.update_many(
        {"expires_at": {"$exists": False}},
        {"$set": {"expires_at": current_time + timedelta(hours=24)}}
    )
except Exception as e:
    print(f"Error updating notifications: {e}")

# Load and preprocess dataset
try:
    data = pd.read_csv("Training.csv").dropna(axis=1)
    encoder = LabelEncoder()
    data["prognosis"] = encoder.fit_transform(data["prognosis"])
except Exception as e:
    print(f"Error loading dataset: {e}")
    raise

X = data.iloc[:, :-1]
y = data.iloc[:, -1]

# Train models
final_svm_model = SVC()
final_nb_model = GaussianNB()
final_rf_model = RandomForestClassifier(random_state=18)
final_dt_model = DecisionTreeClassifier(criterion='entropy', random_state=100)
final_kn_model = KNeighborsClassifier(n_neighbors=5)

final_svm_model.fit(X, y)
final_nb_model.fit(X, y)
final_rf_model.fit(X, y)
final_dt_model.fit(X, y)
final_kn_model.fit(X, y)

# Symptom mapping
symptoms = X.columns.values
symptom_index = {" ".join(symptom.split("_")): idx for idx, symptom in enumerate(symptoms)}
data_dict = {
    "symptom_index": symptom_index,
    "predictions_classes": encoder.classes_
}

# Disease prediction logic
def predictDisease(symptoms_list):
    input_data = [0] * len(data_dict["symptom_index"])
    for symptom in symptoms_list:
        symptom_key = symptom.replace('_', ' ').lower()
        for key in symptom_index:
            if key.lower() == symptom_key:
                input_data[symptom_index[key]] = 1
                break

    input_data = np.array(input_data).reshape(1, -1)
    preds = [
        final_rf_model.predict(input_data)[0],
        final_nb_model.predict(input_data)[0],
        final_svm_model.predict(input_data)[0],
        final_dt_model.predict(input_data)[0],
        final_kn_model.predict(input_data)[0]
    ]
    return statistics.mode([data_dict["predictions_classes"][p] for p in preds])

# Serve uploaded images
@app.route('/Uploads/<filename>')
def serve_uploaded_file(filename):
    try:
        return send_from_directory('Uploads', filename)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

# Remove profile photo
@app.route('/api/remove-profile-photo', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def remove_profile_photo():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "DELETE, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200

    try:
        identity = get_jwt_identity()
        collection = (
            doctors_collection if identity['role'] == 'doctor' else
            patients_collection if identity['role'] == 'patient' else
            admins_collection
        )
        user = collection.find_one({'_id': ObjectId(identity['id'])})
        if not user:
            print(f"User not found: {identity['id']}")
            return jsonify({"error": "User not found"}), 404

        profile_photo = user.get('profilePhoto', '')
        if profile_photo:
            file_path = os.path.join('Uploads', profile_photo.lstrip('/Uploads/'))
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"File deleted: {file_path}")
            else:
                print(f"File not found: {file_path}")

        collection.update_one(
            {'_id': ObjectId(identity['id'])},
            {'$set': {'profilePhoto': ''}}
        )
        print(f"Profile photo removed for user: {identity['email']}")

        return jsonify({
            'id': str(user['_id']),
            'name': user.get('name', ''),
            'email': user['email'],
            'role': identity['role'],
            'profilePhoto': ''
        }), 200
    except Exception as e:
        print(f"Error in remove_profile_photo: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Global OPTIONS handler for undefined routes
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return response, 200

# Routes
@app.route("/")
def main():
    return "API is running"

@app.route('/api/symptoms', methods=["GET"])
def get_symptoms():
    return jsonify(list(symptom_index.keys()))

@app.route('/api/disease', methods=["GET"])
def get_disease():
    try:
        symptoms = json.loads(request.args.get('symptoms'))
    except Exception:
        return jsonify({"error": "Invalid input for symptoms"}), 400

    valid_symptoms = [s for s in symptoms if s.replace('_', ' ').lower() in map(str.lower, symptom_index.keys())]
    if len(valid_symptoms) < 3:
        return jsonify({"error": "Please enter at least 3 valid symptoms."}), 400

    prediction = predictDisease(valid_symptoms)
    return jsonify({"disease": prediction})

@app.route('/api/medications', methods=["GET"])
def get_medications():
    disease = request.args.get("disease")
    return jsonify({"medications": ["Medication A", "Medication B"]})

@app.route('/api/doctors', methods=['GET'])
@jwt_required()
def get_doctors():
    try:
        specialization = request.args.get('specialization', '').strip()
        query = {}
        if specialization:
            query = {'specialization': {'$regex': f'^{specialization}$', '$options': 'i'}}
        doctors_cursor = doctors_collection.find(query)
        doctors = []
        for doc in doctors_cursor:
            doc['_id'] = str(doc['_id'])
            doc.pop('password', None)
            doctors.append(doc)
        return jsonify({'doctors': doctors})
    except Exception as e:
        print(f"Error in get_doctors: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Registration Routes
@app.route('/register/doctor', methods=['POST'])
def register_doctor():
    try:
        data = request.json
        if not all(key in data for key in ['name', 'email', 'password', 'specialization']):
            return jsonify({"error": "Missing required fields"}), 400

        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, data['email']):
            return jsonify({"error": "Invalid email format"}), 400

        if doctors_collection.find_one({"email": data.get("email")}):
            return jsonify({"error": "Doctor already exists"}), 409

        hashed_pw = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
        doctor = {
            "name": data["name"],
            "email": data["email"],
            "password": hashed_pw.decode('utf-8'),
            "specialization": data["specialization"],
            "role": "doctor",
            "created_at": datetime.datetime.utcnow(),
            "profilePhoto": ""
        }
        result = doctors_collection.insert_one(doctor)
        return jsonify({"message": "Doctor registered successfully", "id": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Error in register_doctor: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/register/patient', methods=['POST'])
def register_patient():
    try:
        data = request.json
        if not all(key in data for key in ['name', 'email', 'password']):
            return jsonify({"error": "Missing required fields"}), 400

        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, data['email']):
            return jsonify({"error": "Invalid email format"}), 400

        if patients_collection.find_one({"email": data.get("email")}):
            return jsonify({"error": "Patient already exists"}), 409

        hashed_pw = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
        patient = {
            "name": data["name"],
            "email": data["email"],
            "password": hashed_pw.decode('utf-8'),
            "role": "patient",
            "created_at": datetime.datetime.utcnow(),
            "profilePhoto": ""
        }
        result = patients_collection.insert_one(patient)
        return jsonify({"message": "Patient registered successfully", "id": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Error in register_patient: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/register/admin', methods=['POST'])
def register_admin():
    try:
        data = request.get_json()
        if not all(key in data for key in ['email', 'password']):
            return jsonify({"error": "Missing required fields"}), 400

        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, data['email']):
            return jsonify({"error": "Invalid email format"}), 400

        if admins_collection.find_one({"email": data["email"]}):
            return jsonify({"error": "Admin already exists"}), 409

        hashed_pw = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admins_collection.insert_one({
            "email": data["email"],
            "password": hashed_pw,
            "role": "admin",
            "created_at": datetime.datetime.utcnow(),
            "profilePhoto": ""
        })
        return jsonify({"message": "Admin registered successfully"}), 201
    except Exception as e:
        print(f"Error in register_admin: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Login Route
@app.route('/login/<role>', methods=['POST', 'OPTIONS'])
def login(role):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200

    try:
        data = request.json
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid request body"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if role not in ['doctor', 'patient', 'admin']:
            return jsonify({"error": "Invalid role"}), 400

        collection = db[f"{role}s"] if role != 'admin' else admins_collection
        user = collection.find_one({"email": email})

        if user and bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
            token = create_access_token(
                identity={"id": str(user["_id"]), "email": user["email"], "role": role},
                expires_delta=timedelta(hours=24)
            )
            response = {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": role,
                "token": token,
                "profilePhoto": user.get("profilePhoto", "")
            }
            if role == "doctor":
                response["specialization"] = user.get("specialization", "")
            return jsonify(response), 200

        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        print(f"Error in login for role {role}, email {email}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Forgot Password and Reset Password
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get("email")
        if not email:
            return jsonify({"error": "Email is required"}), 400

        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, email):
            return jsonify({"error": "Invalid email format"}), 400

        user = None
        role = None
        for collection_name, collection in [("doctors", doctors_collection), ("patients", patients_collection), ("admins", admins_collection)]:
            user = collection.find_one({"email": email})
            if user:
                role = collection_name[:-1] if collection_name != "admins" else "admin"
                break

        if not user:
            return jsonify({"error": "User not found"}), 404

        reset_token = str(uuid.uuid4())
        reset_token_doc = {
            "email": email,
            "token": reset_token,
            "created_at": datetime.datetime.utcnow(),
            "expires_at": datetime.datetime.utcnow() + timedelta(hours=1)
        }
        reset_tokens_collection.insert_one(reset_token_doc)

        return jsonify({"message": "Proceed to reset password", "token": reset_token}), 200
    except Exception as e:
        print(f"Error in forgot_password: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        email = data.get("email")
        token = data.get("token")
        new_password = data.get("newPassword")

        if not all([email, token, new_password]):
            return jsonify({"error": "Missing required fields"}), 400

        reset_token_doc = reset_tokens_collection.find_one({
            "email": email,
            "token": token,
            "expires_at": {"$gt": datetime.datetime.utcnow()}
        })
        if not reset_token_doc:
            return jsonify({"error": "Invalid or expired token"}), 400

        user = None
        collection = None
        for coll_name, coll in [("doctors", doctors_collection), ("patients", patients_collection), ("admins", admins_collection)]:
            user = coll.find_one({"email": email})
            if user:
                collection = coll
                break

        if not user:
            return jsonify({"error": "User not found"}), 404

        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_pw.decode('utf-8')}}
        )

        reset_tokens_collection.delete_one({"email": email, "token": token})

        return jsonify({"message": "Password reset successful"}), 200
    except Exception as e:
        print(f"Error in reset_password: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Appointments
@app.route('/api/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    try:
        data = request.json
        required_fields = ['patientName', 'disease', 'patientEmail', 'patientPhone', 'date', 'time', 'doctorName', 'doctorEmail', 'symptoms']
        if not all(field in data for field in required_fields):
            if 'patientName' in data and 'firstName' not in data:
                data['firstName'], data['lastName'] = data['patientName'].split(' ', 1) if ' ' in data['patientName'] else (data['patientName'], '')
            else:
                return jsonify({"error": "Missing required fields"}), 400

        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, data['patientEmail']):
            return jsonify({"error": "Invalid email format"}), 400

        try:
            age = int(data['age'])
            if age < 0 or age > 100:
                return jsonify({"error": "Age must be between 0 and 100"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid age"}), 400

        appointment = {
            "firstName": data['firstName'],
            "lastName": data['lastName'],
            "patientName": f"{data['firstName']} {data['lastName']}",
            "disease": data['disease'],
            "patientEmail": data['patientEmail'],
            "patientPhone": data['patientPhone'],
            "gender": data['gender'],
            "age": age,
            "date": data['date'],
            "time": data['time'],
            "doctorName": data['doctorName'],
            "doctorEmail": data['doctorEmail'],
            "symptoms": data['symptoms'],
            "created_by": get_jwt_identity()['email'],
            "status": "pending",
            "created_at": datetime.datetime.utcnow()
        }
        result = appointments_collection.insert_one(appointment)
        appointment['_id'] = str(result.inserted_id)

        current_time = datetime.datetime.utcnow()
        notifications_collection.insert_one({
            "patient_email": data['patientEmail'],
            "message": f"Your appointment with Dr. {data['doctorName']} on {data['date']} at {data['time']} is pending.",
            "appointment_id": str(result.inserted_id),
            "status": "pending",
            "read": False,
            "created_at": current_time,
            "expires_at": current_time + timedelta(hours=24)
        })

        return jsonify({"message": "Appointment booked", "appointment": appointment}), 201
    except Exception as e:
        print(f"Error in create_appointment: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/appointments/doctor/<doctor_id>', methods=['GET'])
@jwt_required()
def get_appointments_for_doctor(doctor_id):
    try:
        doctor = doctors_collection.find_one({'_id': ObjectId(doctor_id)})
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404

        appointments = list(appointments_collection.find({'doctorEmail': doctor['email']}))
        for appt in appointments:
            appt['_id'] = str(appt['_id'])
            appt['patientName'] = appt.get('patientName', '')
            appt['patientEmail'] = appt.get('patientEmail', '')
            appt['patientPhone'] = appt.get('patientPhone', '')
            appt['status'] = appt.get('status', 'pending')
            appt['doctorName'] = appt.get('doctorName', '')
        return jsonify(appointments)
    except Exception as e:
        print(f"Error in get_appointments_for_doctor: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/appointments/patient/<patient_email>', methods=['GET'])
def get_appointments_for_patient(patient_email):
    try:
        appointments = list(appointments_collection.find({'patientEmail': patient_email}))
        for appt in appointments:
            appt['_id'] = str(appt['_id'])
            appt['patientName'] = appt.get('patientName', '')
            appt['patientEmail'] = appt.get('patientEmail', '')
            appt['patientPhone'] = appt.get('patientPhone', '')
            appt['status'] = appt.get('status', 'pending')
            appt['doctorName'] = appt.get('doctorName', '')
        return jsonify(appointments)
    except Exception as e:
        print(f"Error in get_appointments_for_patient: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/appointments/<appointment_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_appointment(appointment_id):
    try:
        appointment_obj_id = ObjectId(appointment_id)
        data = request.json
        status = data.get('status')
        if status not in ['approved', 'rejected']:
            return jsonify({"error": "Invalid status"}), 400

        result = appointments_collection.update_one(
            {'_id': appointment_obj_id},
            {'$set': {'status': status}}
        )
        if result.matched_count == 0:
            print(f"Appointment not found: {appointment_id}")
            return jsonify({"error": "Appointment not found"}), 404

        appointment = appointments_collection.find_one({'_id': appointment_obj_id})
        current_time = datetime.datetime.utcnow()
        notifications_collection.update_one(
            {'appointment_id': appointment_id, 'patient_email': appointment['patientEmail']},
            {
                '$set': {
                    'message': f"Your appointment with Dr. {appointment['doctorName']} on {appointment['date']} has been {status}.",
                    'status': status,
                    'read': False,
                    'created_at': current_time,
                    'expires_at': current_time + timedelta(hours=24)
                }
            },
            upsert=True
        )

        return jsonify({"message": f"Appointment {status}"}), 200
    except Exception as e:
        print(f"Error in respond_to_appointment: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/appointments/<appointment_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_appointment(appointment_id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "DELETE, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200

    try:
        if not appointment_id or appointment_id.lower() == 'undefined':
            return jsonify({"error": "Invalid appointment ID"}), 400

        try:
            object_id = ObjectId(appointment_id)
        except Exception:
            return jsonify({"error": "Invalid appointment ID format"}), 400

        appointment = appointments_collection.find_one({'_id': object_id})
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404

        result = appointments_collection.delete_one({'_id': object_id})
        if result.deleted_count == 0:
            return jsonify({"error": "Failed to delete appointment"}), 500

        notifications_collection.delete_many({'appointment_id': appointment_id})

        return jsonify({"message": "Appointment deleted successfully"}), 200
    except Exception as e:
        print(f"Error in delete_appointment: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/doctor-appointments', methods=['GET'])
@jwt_required()
def get_doctor_appointments():
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Doctor email is required'}), 400

        appointments = list(appointments_collection.find({'doctorEmail': email}))
        for appt in appointments:
            appt['_id'] = str(appt['_id'])
        return jsonify(appointments)
    except Exception as e:
        print(f"Error in get_doctor_appointments: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Notifications
@app.route('/api/notifications', methods=['POST'])
@jwt_required()
def create_notification():
    try:
        data = request.json
        required_fields = ['patientEmail', 'message', 'appointmentId']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        existing_notification = notifications_collection.find_one({
            'patient_email': data['patientEmail'],
            'appointment_id': data['appointmentId']
        })
        if existing_notification:
            return jsonify({"error": "Notification already exists"}), 409

        current_time = datetime.datetime.utcnow()
        notification = {
            "patient_email": data['patientEmail'],
            "message": data['message'],
            "appointment_id": data['appointmentId'],
            "status": data.get('status', 'pending'),
            "read": data.get('read', False),
            "created_at": current_time,
            "expires_at": current_time + timedelta(hours=24)
        }
        result = notifications_collection.insert_one(notification)
        notification['_id'] = str(result.inserted_id)
        return jsonify({"message": "Notification created", "notification": notification}), 201
    except Exception as e:
        print(f"Error in create_notification: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/notifications/<patient_email>', methods=['GET'])
def get_notifications(patient_email):
    try:
        notifications = list(notifications_collection.find({'patient_email': patient_email}))
        for notif in notifications:
            notif['_id'] = str(notif['_id'])
            notif['appointmentId'] = notif.pop('appointment_id', '')
            notif['status'] = notif.get('status', 'pending')
            notif['created_at'] = notif['created_at'].isoformat()
        return jsonify(notifications), 200
    except Exception as e:
        print(f"Error in get_notifications: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/notifications/<notification_id>/read', methods=['PUT', 'OPTIONS'])
@jwt_required()
def mark_notification_read(notification_id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "PUT, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200

    try:
        result = notifications_collection.update_one(
            {'_id': ObjectId(notification_id)},
            {'$set': {'read': True}}
        )
        if result.matched_count == 0:
            print(f"Notification not found: {notification_id}")
            return jsonify({"error": "Notification not found"}), 404
        return jsonify({"message": "Notification marked as read"}), 200
    except Exception as e:
        print(f"Error in mark_notification_read: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Doctor Deletion
@app.route('/api/doctors/<doctor_id>', methods=['DELETE'])
@jwt_required()
def delete_doctor(doctor_id):
    try:
        identity = get_jwt_identity()
        if identity['role'] != 'admin':
            return jsonify({"error": "Unauthorized: Admin access required"}), 403

        if not doctor_id or doctor_id.lower() == 'undefined':
            return jsonify({"error": "Invalid doctor ID"}), 400

        try:
            object_id = ObjectId(doctor_id)
        except Exception:
            return jsonify({"error": "Invalid doctor ID format"}), 400

        result = doctors_collection.delete_one({'_id': object_id})
        if result.deleted_count == 0:
            return jsonify({"error": "Doctor not found"}), 404

        return jsonify({"message": "Doctor deleted successfully"}), 200
    except Exception as e:
        print(f"Error in delete_doctor: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Patients
@app.route('/api/patients', methods=['GET'])
@jwt_required()
def get_patients():
    try:
        identity = get_jwt_identity()
        if identity['role'] != 'admin':
            return jsonify({"error": "Unauthorized: Admin access required"}), 403

        patients_cursor = patients_collection.find()
        patients = []
        for patient in patients_cursor:
            patient['_id'] = str(patient['_id'])
            patient.pop('password', None)
            patients.append(patient)
        return jsonify({'patients': patients})
    except Exception as e:
        print(f"Error in get_patients: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/patients/<patient_id>', methods=['DELETE'])
@jwt_required()
def delete_patient(patient_id):
    try:
        identity = get_jwt_identity()
        if identity['role'] != 'admin':
            return jsonify({"error": "Unauthorized: Admin access required"}), 403

        if not patient_id or patient_id.lower() == 'undefined':
            return jsonify({"error": "Invalid patient ID"}), 400

        try:
            object_id = ObjectId(patient_id)
        except Exception:
            return jsonify({"error": "Invalid patient ID format"}), 400

        result = patients_collection.delete_one({'_id': object_id})
        if result.deleted_count == 0:
            return jsonify({"error": "Patient not found"}), 404

        return jsonify({"message": "Patient deleted successfully"}), 200
    except Exception as e:
        print(f"Error in delete_patient: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Profile Update
@app.route('/api/update-profile', methods=['POST', 'OPTIONS'])
@jwt_required()
def update_profile():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200

    try:
        identity = get_jwt_identity()
        collection = (
            doctors_collection if identity['role'] == 'doctor' else
            patients_collection if identity['role'] == 'patient' else
            admins_collection
        )
        user = collection.find_one( {'_id': ObjectId(identity['id'])})
        if not user:
            print(f"User not found: {identity['id']}")
            return jsonify({"error": "User not found"}), 404

        name = request.form.get('name', user.get('name', ''))
        photo = request.files.get('photo')
        if not name and not photo:
            return jsonify({"error": "At least one field (name or photo) is required"}), 400

        profile_photo = user.get('profilePhoto', '')
        if photo:
            if not photo.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                return jsonify({"error": "Invalid file type. Only JPEG, PNG, GIF allowed."}), 400
            if len(photo.read()) > 5 * 1024 * 1024:
                return jsonify({"error": "File size must be less than 5MB."}), 400
            photo.seek(0)

            upload_folder = 'Uploads'
            os.makedirs(upload_folder, exist_ok=True)
            filename = secure_filename(
                f"{identity['id']}_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{photo.filename}"
            )
            photo_path = os.path.join(upload_folder, filename)
            photo.save(photo_path)
            profile_photo = f"/Uploads/{filename}"
            print(f"Photo uploaded: {profile_photo}")

        collection.update_one(
            {'_id': ObjectId(identity['id'])},
            {'$set': {'name': name, 'profilePhoto': profile_photo}}
        )

        return jsonify({
            'id': str(user['_id']),
            "name": name,
            "email": user["email"],
            "role": identity["role"],
            "profilePhoto": profile_photo
        }), 200
    except Exception as e:
        print(f"Error in update_profile: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Current User
@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        identity = get_jwt_identity()
        collection = (
            doctors_collection if identity['role'] == 'doctor' else
            patients_collection if identity['role'] == 'patient' else
            admins_collection
        )
        user = collection.find_one({'_id': ObjectId(identity['id'])})
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "id": str(user["_id"]),
            "email": user["email"],
            "role": identity["role"],
            "name": user.get("name", ""),
            "profilePhoto": user.get("profilePhoto", "")
        }), 200
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        return jsonify({"error": "Unauthorized or invalid token"}), 401

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)