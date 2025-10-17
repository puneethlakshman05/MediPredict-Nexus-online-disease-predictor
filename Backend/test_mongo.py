from pymongo import MongoClient
import certifi
import os

uri = os.getenv("MONGODB_URI")
if not uri:
    uri = "mongodb+srv://puneethlaksh05:SkuX8g4qIJeVOf8P@cluster0.xrufj86.mongodb.net/hospital_db?retryWrites=true&w=majority&appName=Cluster0"

try:
    client = MongoClient(uri, tlsCAFile=certifi.where())
    db = client.get_database("hospital_db")
    # print("Connected to database:", db.name)
    # Try a simple command
    # print("Collections:", db.list_collection_names())
except Exception as e:
    print("Error connecting to MongoDB:", e)
