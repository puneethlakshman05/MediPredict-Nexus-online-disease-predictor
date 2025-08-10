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
from datetime import datetime, timedelta 
import re
import os
import certifi
import smtplib
from email.mime.text import MIMEText
import random
import logging
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

app = Flask(__name__)
# Update CORS to allow dynamic frontend URL
CORS(app, resources={r"/*": {
    "origins": [os.getenv("FRONTEND_URL", "http://localhost:5173")],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# JWT Config
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your_secret_key")
jwt = JWTManager(app)

# Gmail SMTP Config
GMAIL_SMTP_USER = os.getenv('GMAIL_SMTP_USER')
GMAIL_APP_PASSWORD = os.getenv('GMAIL_APP_PASSWORD')

env_file = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_file)
if not os.path.exists('.env'):
    print("'.env' file not found in Backend directory. Ensure environment variables are set in Vercel.")

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Verify environment variables with warning instead of raising exception
required_env_vars = ['GMAIL_SMTP_USER', 'GMAIL_APP_PASSWORD', 'SENDER_EMAIL', 'JWT_SECRET_KEY', 'MONGODB_URI', 'FRONTEND_URL']
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    logger.warning(f"Missing environment variables: {', '.join(missing_vars)}. Using defaults where applicable.")

# MongoDB Connection with environment variable
try:
    client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"),    
                         tlsCAFile=certifi.where())
    db = client.get_database(os.getenv("MONGODB_DATABASE", "hospital_db"))
    doctors_collection = db["doctors"]
    patients_collection = db["patients"]
    appointments_collection = db["appointments"]
    admins_collection = db["admins"]
    notifications_collection = db["notifications"]
    reset_tokens_collection = db["reset_tokens"]
    notifications_collection.create_index("expires_at", expireAfterSeconds=0)
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    raise

# Ensure existing notifications have expires_at
try:
    current_time = datetime.utcnow()
    notifications_collection.update_many(
        {"expires_at": {"$exists": False}},
        {"$set": {"expires_at": current_time + timedelta(hours=24)}}
    )
except Exception as e:
    logger.error(f"Error updating notifications: {e}")

# Load and preprocess dataset
try:
    csv_path = os.path.join(os.path.dirname(__file__), "Training.csv")
    data = pd.read_csv(csv_path).dropna(axis=1)
    encoder = LabelEncoder()
    data["prognosis"] = encoder.fit_transform(data["prognosis"])
except Exception as e:
    logger.error(f"Error loading dataset: {e}")
    raise
try:
    csv_path = os.path.join(os.path.dirname(__file__), "disease_medications.csv")
    disease_medications = pd.read_csv(csv_path)
    medication_dict = {
        row["Disease"].lower(): {
            "medicines": row["Medicines"].split(",") if pd.notna(row["Medicines"]) else [],
            "injections": row["Injections"].split(",") if pd.notna(row["Injections"]) and row["Injections"] != "None" else []
        }
        for _, row in disease_medications.iterrows()
    }
except Exception as e:
    logger.error(f"Error loading disease_medications dataset: {e}")
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

# Send OTP via Gmail SMTP
def send_otp_email(email, otp):
    msg = MIMEText(f"<p>Your OTP for MediPredict Nexus password reset is: <strong>{otp}</strong>. It expires in 5 minutes.</p>", "html")
    msg['Subject'] = 'MediPredict Nexus Password Reset OTP'
    msg['From'] = os.getenv('SENDER_EMAIL')
    msg['To'] = email
    try:
        logger.debug(f"Attempting to send OTP to {email} via Gmail SMTP")
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(os.getenv('GMAIL_SMTP_USER'), os.getenv('GMAIL_APP_PASSWORD'))
            server.send_message(msg)
            logger.info(f"OTP email sent successfully to {email}")
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {e}")
        raise Exception("Invalid Gmail SMTP credentials")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {e}")
        raise Exception("Failed to send email due to SMTP error")
    except Exception as e:
        logger.error(f"Unexpected error sending email: {e}")
        raise Exception(f"Failed to send email: {str(e)}")

# Serve uploaded images from public directory
UPLOAD_FOLDER = 'public/Uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/Uploads/<filename>')
def serve_uploaded_file(filename):
    try:
        logger.debug(f"Attempting to serve file: {filename} from {app.config['UPLOAD_FOLDER']}")
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        logger.error(f"File not found: {filename}")
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        logger.error(f"Error serving file {filename}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Remove profile photo
@app.route('/api/remove-profile-photo', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def remove_profile_photo():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", os.getenv("FRONTEND_URL", "http://localhost:5173"))
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
            logger.error(f"User not found: {identity['id']}")
            return jsonify({"error": "User not found"}), 404
        profile_photo = user.get('profilePhoto', '')
        if profile_photo:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], profile_photo.lstrip('/Uploads/'))
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"File deleted: {file_path}")
            else:
                logger.warning(f"File not found for deletion: {file_path}")
        collection.update_one(
            {'_id': ObjectId(identity['id'])},
            {'$set': {'profilePhoto': ''}}
        )
        logger.info(f"Profile photo removed for user: {identity['email']}")
        return jsonify({
            'id': str(user['_id']),
            'name': user.get('name', ''),
            'email': user['email'],
            'role': identity['role'],
            'profilePhoto': ''
        }), 200
    except Exception as e:
        logger.error(f"Error in remove_profile_photo: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Global OPTIONS handler
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", os.getenv("FRONTEND_URL", "http://localhost:5173"))
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
@jwt_required()
def get_medications():
    disease = request.args.get("disease")
    if not disease:
        return jsonify({"error": "Disease parameter is required"}), 400
    disease_lower = disease.lower()
    if disease_lower in medication_dict:
        return jsonify({
            "medicines": medication_dict[disease_lower]["medicines"],
            "injections": medication_dict[disease_lower]["injections"]
        })
    else:
        return jsonify({"error": "No medications found for the specified disease"}), 404

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
        logger.error(f"Error in get_doctors: {str(e)}")
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
            "created_at": datetime.utcnow(),
            "profilePhoto": ""
        }
        result = doctors_collection.insert_one(doctor)
        return jsonify({"message": "Doctor registered successfully", "id": str(result.inserted_id)}), 201
    except Exception as e:
        logger.error(f"Error in register_doctor: {str(e)}")
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
            "created_at": datetime.utcnow(),
            "profilePhoto": ""
        }
        result = patients_collection.insert_one(patient)
        return jsonify({"message": "Patient registered successfully", "id": str(result.inserted_id)}), 201
    except Exception as e:
        logger.error(f"Error in register_patient: {str(e)}")
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
            "created_at": datetime.utcnow(),
            "profilePhoto": ""
        })
        return jsonify({"message": "Admin registered successfully"}), 201
    except Exception as e:
        logger.error(f"Error in register_admin: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Login Route
@app.route('/login/<role>', methods=['POST', 'OPTIONS'])
def login(role):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", os.getenv("FRONTEND_URL", "http://localhost:5173"))
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
        logger.error(f"Error in login for role {role}, email {email}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Forgot Password
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        logger.debug("Received forgot-password request")
        data = request.json
        email = data.get("email")
        if not email:
            logger.warning("Missing email in request")
            return jsonify({"error": "Email is required"}), 400
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, email):
            logger.warning(f"Invalid email format: {email}")
            return jsonify({"error": "Invalid email format"}), 400
        user = None
        role = None
        for collection_name, collection in [("doctors", doctors_collection), ("patients", patients_collection), ("admins", admins_collection)]:
            user = collection.find_one({"email": email})
            if user:
                role = collection_name[:-1] if collection_name != "admins" else "admin"
                break
        if not user:
            logger.info(f"User not found for email: {email}")
            return jsonify({"error": "User not found"}), 404
        otp = str(random.randint(100000, 999999))
        hashed_otp = bcrypt.hashpw(otp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        reset_token_doc = {
            "email": email,
            "otp": hashed_otp,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(seconds=300)
        }
        logger.debug(f"Deleting old reset tokens for {email}")
        reset_tokens_collection.delete_many({"email": email})
        logger.debug(f"Inserting new reset token for {email}")
        reset_tokens_collection.insert_one(reset_token_doc)
        logger.debug(f"Sending OTP to {email}")
        send_otp_email(email, otp)
        logger.info(f"Forgot password request processed for {email}")
        return jsonify({"message": "OTP sent to your email"}), 200
    except Exception as e:
        logger.error(f"Error in forgot_password: {str(e)}")
        return jsonify({"error": f"Failed to send OTP: {str(e)}"}), 500

# Reset Password
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        email = data.get("email")
        otp = data.get("otp")
        new_password = data.get("newPassword")
        if not all([email, otp, new_password]):
            return jsonify({"error": "Missing required fields"}), 400
        reset_token_doc = reset_tokens_collection.find_one({
            "email": email,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        if not reset_token_doc or not bcrypt.checkpw(otp.encode('utf-8'), reset_token_doc["otp"].encode('utf-8')):
            return jsonify({"error": "Invalid or expired OTP"}), 400
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
        reset_tokens_collection.delete_many({"email": email})
        return jsonify({"message": "Password reset successful"}), 200
    except Exception as e:
        logger.error(f"Error in reset_password: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Verify OTP
@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    try:
        logger.debug("Received verify-otp request")
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')

        if not email or not otp:
            logger.warning("Missing email or OTP in request")
            return jsonify({'error': 'Email and OTP are required'}), 400

        logger.debug(f"Looking up OTP for email: {email}")
        user_otp = reset_tokens_collection.find_one({
            'email': email,
            'expires_at': {'$gt': datetime.utcnow()}
        })
        if not user_otp:
            logger.info(f"No valid OTP found for email: {email}")
            return jsonify({'error': 'No valid OTP found for this email'}), 404

        logger.debug(f"Verifying OTP for email: {email}")
        if not bcrypt.checkpw(otp.encode('utf-8'), user_otp['otp'].encode('utf-8')):
            logger.info(f"Invalid OTP provided for email: {email}")
            return jsonify({'error': 'Invalid OTP'}), 401

        logger.info(f"OTP verified successfully for email: {email}")
        return jsonify({'message': 'OTP verified successfully'}), 200
    except Exception as e:
        logger.error(f"Error in verify_otp: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Appointments
@app.route('/api/appointments', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required()
def handle_appointments():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", os.getenv("FRONTEND_URL", "http://localhost:5173"))
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200
    try:
        identity = get_jwt_identity()
        role = identity['role']

        # Authorization for GET: Only admins can fetch all appointments
        if request.method == 'GET':
            if role != 'admin':
                return jsonify({"error": "Unauthorized: Admin access required to fetch all appointments"}), 403
            appointments = list(appointments_collection.find())
            for appt in appointments:
                appt['_id'] = str(appt['_id'])
                appt['patientName'] = appt.get('patientName', '')
                appt['patientEmail'] = appt.get('patientEmail', '')
                appt['patientPhone'] = appt.get('patientPhone', '')
                appt['status'] = appt.get('status', 'pending')
                appt['doctorName'] = appt.get('doctorName', '')
                appt['disease'] = appt.get('disease', '')
                appt['specialization'] = appt.get('specialization', '')
                appt['date'] = appt.get('date', '')
                appt['time'] = appt.get('time', '')
                appt['created_at'] = appt.get('created_at', datetime.utcnow()).isoformat()
            return jsonify(appointments), 200

        # Authorization for POST: Allow patients, doctors, and admins to create appointments
        elif request.method == 'POST':
            if role not in ['patient', 'doctor', 'admin']:
                return jsonify({"error": "Unauthorized: Only patients, doctors, or admins can book appointments"}), 403
            
            data = request.json
            required_fields = ['patientName', 'disease', 'patientEmail', 'patientPhone', 'date', 'time', 'doctorName', 'doctorEmail', 'symptoms']
            if not all(field in data for field in required_fields):
                if 'patientName' in data and 'firstName' not in data:
                    data['firstName'], data['lastName'] = data['patientName'].split(' ', 1) if ' ' in data['patientName'] else (data['patientName'], '')
                else:
                    return jsonify({"error": "Missing required fields"}), 400
            
            # Validate email format
            email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not re.match(email_regex, data['patientEmail']):
                return jsonify({"error": "Invalid email format"}), 400
            
            # Validate age
            try:
                age = int(data['age'])
                if age < 0 or age > 100:
                    return jsonify({"error": "Age must be between 0 and 100"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid age"}), 400

            # For patients, ensure they can only book appointments for themselves
            if role == 'patient' and data['patientEmail'] != identity['email']:
                return jsonify({"error": "Unauthorized: Patients can only book appointments for themselves"}), 403

            # Verify doctor exists
            doctor = doctors_collection.find_one({'email': data['doctorEmail']})
            if not doctor:
                return jsonify({"error": "Doctor not found"}), 404

            # Create appointment
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
                "created_by": identity['email'],
                "status": "pending",
                "created_at": datetime.utcnow()
            }
            result = appointments_collection.insert_one(appointment)
            appointment['_id'] = str(result.inserted_id)

            # Create notification for the patient
            current_time = datetime.utcnow()
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
        logger.error(f"Error in handle_appointments: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/appointments/doctor/<doctor_email>', methods=['GET'])
@jwt_required()
def get_appointments_for_doctor(doctor_email):
    try:
        doctor = doctors_collection.find_one({'email': doctor_email})
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
        logger.error(f"Error in get_appointments_for_doctor: {str(e)}")
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
        logger.error(f"Error in get_appointments_for_patient: {str(e)}")
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
            logger.error(f"Appointment not found: {appointment_id}")
            return jsonify({"error": "Appointment not found"}), 404
        appointment = appointments_collection.find_one({'_id': appointment_obj_id})
        current_time = datetime.utcnow()
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
        logger.error(f"Error in respond_to_appointment: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/appointments/<appointment_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_appointment(appointment_id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", os.getenv("FRONTEND_URL", "http://localhost:5173"))
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
        logger.error(f"Error in delete_appointment: {str(e)}")
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
        logger.error(f"Error in get_doctor_appointments: {str(e)}")
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
        current_time = datetime.utcnow()
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
        logger.error(f"Error in create_notification: {str(e)}")
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
        logger.error(f"Error in get_notifications: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/notifications/<notification_id>/read', methods=['PUT', 'OPTIONS'])
@jwt_required()
def mark_notification_read(notification_id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", os.getenv("FRONTEND_URL", "http://localhost:5173"))
        response.headers.add("Access-Control-Allow-Methods", "PUT, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200
    try:
        result = notifications_collection.update_one(
            {'_id': ObjectId(notification_id)},
            {'$set': {'read': True}}
        )
        if result.matched_count == 0:
            logger.error(f"Notification not found: {notification_id}")
            return jsonify({"error": "Notification not found"}), 404
        return jsonify({"message": "Notification marked as read"}), 200
    except Exception as e:
        logger.error(f"Error in mark_notification_read: {str(e)}")
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
        logger.error(f"Error in delete_doctor: {str(e)}")
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
        logger.error(f"Error in get_patients: {str(e)}")
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
        logger.error(f"Error in delete_patient: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Profile Update
@app.route('/api/update-profile', methods=['POST', 'OPTIONS'])
@jwt_required()
def update_profile():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", os.getenv("FRONTEND_URL", "http://localhost:5173"))
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
        user = collection.find_one({'_id': ObjectId(identity['id'])})
        if not user:
            logger.error(f"User not found: {identity['id']}")
            return jsonify({"error": "User not found"}), 404
        name = request.form.get('name', user.get('name', ''))
        photo = request.files.get('photo')
        if not name and not photo:
            return jsonify({"error": "At least one field (name or photo) is required"}), 400
        profile_photo = user.get('profilePhoto', '')
        if photo:
            if not photo.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                return jsonify({"error": "Invalid file type. Only JPEG, PNG, GIF allowed."}), 400
            photo.seek(0, os.SEEK_END)
            file_size = photo.tell()
            if file_size > 5 * 1024 * 1024:
                return jsonify({"error": "File size must be less than 5MB."}), 400
            photo.seek(0)
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            logger.debug(f"Created/verified Uploads directory: {app.config['UPLOAD_FOLDER']}")
            filename = secure_filename(f"{identity['id']}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{photo.filename}")
            photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            try:
                photo.save(photo_path)
                logger.info(f"Photo saved successfully: {photo_path}")
            except Exception as e:
                logger.error(f"Failed to save photo: {str(e)}")
                return jsonify({"error": "Failed to save photo"}), 500
            profile_photo = f"/Uploads/{filename}"
        collection.update_one(
            {'_id': ObjectId(identity['id'])},
            {'$set': {'name': name, 'profilePhoto': profile_photo}}
        )
        logger.info(f"Profile updated for user: {identity['email']}, new photo: {profile_photo}")
        return jsonify({
            'id': str(user['_id']),
            "name": name,
            "email": user["email"],
            "role": identity["role"],
            "profilePhoto": profile_photo
        }), 200
    except Exception as e:
        logger.error(f"Error in update_profile: {str(e)}")
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
        logger.error(f"Error in get_current_user: {str(e)}")
        return jsonify({"error": "Unauthorized or invalid token"}), 401

if __name__ == "__main__":
    # Removed local run for Vercel deployment
    pass