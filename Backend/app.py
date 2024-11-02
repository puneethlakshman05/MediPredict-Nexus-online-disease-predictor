from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
import statistics

app = Flask(__name__)
CORS(app)

# Define global variables

symptoms_list = ['back_pain','constipation','abdominal_pain','diarrhoea','mild_fever','yellow_urine',
'yellowing_of_eyes','acute_liver_failure','fluid_overload','swelling_of_stomach',
'swelled_lymph_nodes','malaise','blurred_and_distorted_vision','phlegm','throat_irritation',
'redness_of_eyes','sinus_pressure','runny_nose','congestion','chest_pain','weakness_in_limbs',
'fast_heart_rate','pain_during_bowel_movements','pain_in_anal_region','bloody_stool',
'irritation_in_anus','neck_pain','dizziness','cramps','bruising','obesity','swollen_legs',
'swollen_blood_vessels','puffy_face_and_eyes','enlarged_thyroid','brittle_nails',
'swollen_extremeties','excessive_hunger','extra_marital_contacts','drying_and_tingling_lips',
'slurred_speech','knee_pain','hip_joint_pain','muscle_weakness','stiff_neck','swelling_joints',
'movement_stiffness','spinning_movements','loss_of_balance','unsteadiness',
'weakness_of_one_body_side','loss_of_smell','bladder_discomfort','foul_smell_of urine',
'continuous_feel_of_urine','passage_of_gases','internal_itching','toxic_look_(typhos)',
'depression','irritability','muscle_pain','altered_sensorium','red_spots_over_body','belly_pain',
'abnormal_menstruation','dischromic _patches','watering_from_eyes','increased_appetite','polyuria','family_history','mucoid_sputum',
'rusty_sputum','lack_of_concentration','visual_disturbances','receiving_blood_transfusion',
'receiving_unsterile_injections','coma','stomach_bleeding','distention_of_abdomen',
'history_of_alcohol_consumption','fluid_overload','blood_in_sputum','prominent_veins_on_calf',
'palpitations','painful_walking','pus_filled_pimples','blackheads','scurring','skin_peeling',
'silver_like_dusting','small_dents_in_nails','inflammatory_nails','blister','red_sore_around_nose',
'yellow_crust_ooze','skin_rash','itching','nodal_skin_eruptions','continuous_sneezing','shivering','chills','joint_pain','stomach_pain'
,'acidity','ulcers_on_tongue','muscle_wasting','vomiting','burning_micturition','spotting_urination','fatigue','weight_gain',
'anxiety','cold_hands_and_feets','mood_swings','weight_loss','restlessness','lethargy','patches_in_throat','irregular_sugar_level',
'cough','high_fever','sunken_eyes','breathlessness','sweating','dehydration','indigestion','headache','yellowish_skin','dark_urine',
'nausea','loss_of_appetite','pain_behind_the_eyes','low_blood_pressure','high_blood_pressure']

Disease={'Fungal infection':0,'Allergy':1,'GERD':2,'Chronic ayipoyindhicholestasis':3,'Drug Reaction':4,
 'Peptic ulcer diseae':5,'AIDS':6,'Diabetes ':7,'Gastroenteritis':8,'Bronchial Asthma':9,'Hypertension ':10,
 'Migraine':11,'Cervical spondylosis':12,
 'Paralysis (brain hemorrhage)':13,'Jaundice':14,'Malaria':15,'Chicken pox':16,'Dengue':17,'Typhoid':18,'hepatitis A':19,
 'Hepatitis B':20,'Hepatitis C':21,'Hepatitis D':22,'Hepatitis E':23,'Alcoholic hepatitis':24,'Tuberculosis':25,
 'Common Cold':26,'Pneumonia':27,'Dimorphic hemmorhoids(piles)':28,'Heart attack':29,'Varicose veins':30,'Hypothyroidism':31,
 'Hyperthyroidism':32,'Hypoglycemia':33,'Osteoarthristis':34,'Arthritis':35,
 '(vertigo) Paroymsal  Positional Vertigo':36,'Acne':37,'Urinary tract infection':38,'Psoriasis':39,
 'Impetigo':40}
 
medications_tips = {
    'Fungal infection': {
        'medications': ['Topical antifungals (Clotrimazole)', 'Oral antifungals (Fluconazole)'],
        'tips': ['Keep affected areas clean and dry', 'Avoid tight clothing', 'Use antifungal powder to reduce moisture']
    },
    'Allergy': {
        'medications': ['Antihistamines (Loratadine, Cetirizine)', 'Nasal corticosteroids'],
        'tips': ['Avoid known allergens', 'Use a humidifier at home', 'Stay hydrated']
    },
    'GERD': {
        'medications': ['Proton pump inhibitors (Omeprazole)', 'Antacids'],
        'tips': ['Avoid trigger foods (spicy, acidic foods)', 'Eat smaller meals', 'Don’t lie down immediately after eating']
    },
    'Chronic cholestasis': {
        'medications': ['Ursodeoxycholic acid', 'Cholestyramine'],
        'tips': ['Reduce fat intake', 'Take vitamin supplements as advised', 'Avoid alcohol']
    },
    'Drug Reaction': {
        'medications': ['Antihistamines', 'Corticosteroids'],
        'tips': ['Avoid the drug causing the reaction', 'Report all drug allergies to your healthcare provider', 'Monitor for worsening symptoms']
    },
    'Peptic ulcer disease': {
        'medications': ['Proton pump inhibitors', 'H2 blockers', 'Antibiotics if H. pylori infection is present'],
        'tips': ['Avoid NSAIDs', 'Limit caffeine and alcohol', 'Eat smaller meals more frequently']
    },
    'AIDS': {
        'medications': ['Antiretroviral therapy (ART)', 'Protease inhibitors'],
        'tips': ['Avoid infections through hygiene', 'Take medications consistently', 'Practice safe sexual behaviors']
    },
    'Diabetes': {
        'medications': ['Insulin', 'Metformin', 'Sulfonylureas'],
        'tips': ['Monitor blood glucose levels', 'Eat balanced meals', 'Exercise regularly']
    },
    'Gastroenteritis': {
        'medications': ['Oral rehydration salts (ORS)', 'Antidiarrheals (Loperamide)'],
        'tips': ['Stay hydrated', 'Avoid solid foods until symptoms improve', 'Practice good hygiene']
    },
    'Bronchial Asthma': {
        'medications': ['Inhaled corticosteroids', 'Short-acting beta agonists (Albuterol)'],
        'tips': ['Avoid allergens and irritants', 'Use inhalers as directed', 'Practice breathing exercises']
    },
    'Hypertension': {
        'medications': ['ACE inhibitors', 'Beta-blockers', 'Calcium channel blockers'],
        'tips': ['Limit salt intake', 'Exercise regularly', 'Avoid excessive alcohol intake']
    },
    'Migraine': {
        'medications': ['Triptans', 'NSAIDs', 'Anti-nausea medications'],
        'tips': ['Maintain a headache diary to track triggers', 'Practice relaxation techniques', 'Get adequate sleep']
    },
    'Cervical spondylosis': {
        'medications': ['NSAIDs', 'Muscle relaxants'],
        'tips': ['Practice neck exercises', 'Maintain good posture', 'Apply warm compresses to relieve pain']
    },
    'Paralysis (brain hemorrhage)': {
        'medications': ['Anticoagulants', 'Anti-hypertensive drugs'],
        'tips': ['Follow physical therapy regimens', 'Limit salt and cholesterol intake', 'Monitor blood pressure']
    },
    'Jaundice': {
        'medications': ['Vitamin supplements', 'Medications as per underlying cause'],
        'tips': ['Limit alcohol intake', 'Eat a balanced diet', 'Get adequate rest']
    },
    'Malaria': {
        'medications': ['Chloroquine', 'Artemisinin-based combination therapies (ACTs)'],
        'tips': ['Use mosquito nets', 'Take preventive medications in high-risk areas', 'Seek early treatment if symptoms arise']
    },
    'Chicken pox': {
        'medications': ['Antihistamines for itching', 'Antivirals if necessary'],
        'tips': ['Avoid scratching blisters', 'Stay hydrated', 'Rest and avoid contact with others']
    },
    'Dengue': {
        'medications': ['Analgesics (Paracetamol)'],
        'tips': ['Stay hydrated', 'Rest and monitor symptoms', 'Avoid mosquito bites']
    },
    'Typhoid': {
        'medications': ['Antibiotics (Ciprofloxacin)', 'Azithromycin'],
        'tips': ['Drink boiled water', 'Eat only cooked foods', 'Practice good hygiene']
    },
    'Hepatitis A': {
        'medications': ['Supportive treatment', 'Analgesics'],
        'tips': ['Avoid alcohol', 'Practice good hygiene', 'Rest and maintain a healthy diet']
    },
    'Hepatitis B': {
        'medications': ['Antiviral medications', 'Interferon injections'],
        'tips': ['Avoid alcohol', 'Get vaccinated if not already', 'Follow a balanced diet']
    },
    'Hepatitis C': {
        'medications': ['Direct-acting antivirals (DAAs)', 'Interferon'],
        'tips': ['Avoid alcohol', 'Practice safe hygiene', 'Eat liver-friendly foods']
    },
    'Alcoholic hepatitis': {
        'medications': ['Corticosteroids', 'Pentoxifylline'],
        'tips': ['Avoid alcohol completely', 'Maintain a balanced diet', 'Monitor liver health']
    },
    'Tuberculosis': {
        'medications': ['Isoniazid', 'Rifampin', 'Ethambutol'],
        'tips': ['Take medication as prescribed', 'Avoid contact with others during contagious periods', 'Eat a nutrient-rich diet']
    },
    'Common Cold': {
        'medications': ['Decongestants', 'Antihistamines'],
        'tips': ['Stay hydrated', 'Rest', 'Avoid close contact with others']
    },
    'Pneumonia': {
        'medications': ['Antibiotics for bacterial pneumonia', 'Antipyretics'],
        'tips': ['Rest', 'Stay hydrated', 'Follow doctor’s advice on breathing exercises']
    },
    'Heart attack': {
        'medications': ['Aspirin', 'ACE inhibitors', 'Beta-blockers'],
        'tips': ['Follow a heart-healthy diet', 'Exercise as advised', 'Avoid smoking']
    },
    'Varicose veins': {
        'medications': ['Compression stockings', 'Pain relievers'],
        'tips': ['Avoid standing for long periods', 'Elevate legs when resting', 'Exercise regularly']
    },
    'Hypothyroidism': {
        'medications': ['Levothyroxine'],
        'tips': ['Take medication as prescribed', 'Maintain a balanced diet', 'Get regular thyroid check-ups']
    },
    'Hyperthyroidism': {
        'medications': ['Methimazole', 'Beta-blockers'],
        'tips': ['Avoid iodine-rich foods', 'Reduce stress', 'Get regular thyroid check-ups']
    },
    'Hypoglycemia': {
        'medications': ['Glucose tablets', 'Hormone injections if needed'],
        'tips': ['Eat small, frequent meals', 'Carry a glucose source', 'Monitor blood sugar levels']
    },
    'Osteoarthritis': {
        'medications': ['NSAIDs', 'Pain relievers'],
        'tips': ['Stay active with low-impact exercises', 'Use hot and cold compresses', 'Maintain a healthy weight']
    },
    'Urinary tract infection': {
        'medications': ['Antibiotics (Ciprofloxacin, Nitrofurantoin)'],
        'tips': ['Stay hydrated', 'Practice good hygiene', 'Avoid holding urine for long periods']
    },
    'Psoriasis': {
        'medications': ['Topical corticosteroids', 'Vitamin D analogues'],
        'tips': ['Keep skin moisturized', 'Avoid skin irritants', 'Manage stress']
    },
    'Impetigo': {
        'medications': ['Antibiotics (Mupirocin ointment)', 'Oral antibiotics if severe'],
        'tips': ['Keep affected areas clean', 'Avoid touching affected areas', 'Practice good hygiene']
    }
}


DATA_PATH = "Training.csv"
data = pd.read_csv(DATA_PATH).dropna(axis = 1)


# Encoding the target(String Data type format) value into numerical
# value using LabelEncoder
encoder = LabelEncoder()
data["prognosis"] = encoder.fit_transform(data["prognosis"])


X = data.iloc[:,:-1]
y = data.iloc[:, -1]
X_train, X_test, y_train, y_test =train_test_split(X, y, test_size = 0.2)

# print(f"Train: {X_train.shape}, {y_train.shape}")
# print(f"Test: {X_test.shape}, {y_test.shape}")
# print()


# Defining scoring metric for k-fold cross validation
def cv_scoring(estimator, X, y):
    return accuracy_score(y, estimator.predict(X))

# Initializing Models
models = {
    "SVC":SVC(),
    "Gaussian NB":GaussianNB(),
    "Random Forest":RandomForestClassifier(random_state=18),
    "Decision Tree": DecisionTreeClassifier(criterion = 'entropy',random_state=100),
    "KNeighbors": KNeighborsClassifier(n_neighbors=2,p=2)
}

# Producing cross validation score for the models
for model_name in models:
    model = models[model_name]
    scores = cross_val_score(model, X, y, cv = 10, 
                            n_jobs = -1, 
                            scoring = cv_scoring)
    # print("=="*20)
    # print(model_name)
    # print(f"Scores: {scores}")
    # print(f"Mean Score: {np.mean(scores)}")
    # print()


#           Printing Accuracy of each model

svm_model = SVC()
svm_model.fit(X_train, y_train)
preds = svm_model.predict(X_test)
# print(f"Accuracy on train data by SVM Classifier: {accuracy_score(y_train, svm_model.predict(X_train))}")
# print(f"Accuracy on test data by SVM Classifier: {accuracy_score(y_test, preds)}")
# print()

# Training and testing Naive Bayes Classifier
nb_model = GaussianNB()
nb_model.fit(X_train, y_train)
preds = nb_model.predict(X_test)
# print(f"Accuracy on train data by Naive Bayes Classifier: {accuracy_score(y_train, nb_model.predict(X_train))}")
# print(f"Accuracy on test data by Naive Bayes Classifier: {accuracy_score(y_test, preds)}")
# print()

# Training and testing Random Forest Classifier
rf_model = RandomForestClassifier(random_state=18)
rf_model.fit(X_train, y_train)
preds = rf_model.predict(X_test)
# print(f"Accuracy on train data by Random Forest Classifier: {accuracy_score(y_train, rf_model.predict(X_train))}")
# print(f"Accuracy on test data by Random Forest Classifier: {accuracy_score(y_test, preds)}")
# print()

#Training and testing of DecisionTreeClassifier
dt_model = DecisionTreeClassifier(criterion='entropy',random_state=100)
dt_model.fit(X_train,y_train)
preds = dt_model.predict(X_test)
# print(f"Accuracy on train data by Decision Tree Classifier: {accuracy_score(y_train, dt_model.predict(X_train))}")
# print(f"Accuracy on test data by Decision tree Classifier: {accuracy_score(y_test, preds)}")
# print()

#Training and Testing of KNeighbors Classifier
kn_model = KNeighborsClassifier(n_neighbors=2,p=2)
kn_model.fit(X_train,y_train)
preds = kn_model.predict(X_test)
# print(f"Accuracy on train data by Kneighbors Classifier: {accuracy_score(y_train, kn_model.predict(X_train))}")
# print(f"Accuracy on test data by Kneighbors Classifier: {accuracy_score(y_test, preds)}")
# print()


# Training the models on whole data
final_svm_model = SVC()
final_nb_model = GaussianNB()
final_rf_model = RandomForestClassifier(random_state=18)
final_dt_model = DecisionTreeClassifier(criterion='entropy',random_state=100)
final_kn_model = KNeighborsClassifier(n_neighbors=2,p=2)
final_svm_model.fit(X, y)
final_nb_model.fit(X, y)
final_rf_model.fit(X, y)
final_dt_model.fit(X,y)
final_kn_model.fit(X,y)

# Reading the test data
test_data = pd.read_csv("Testing.csv").dropna(axis=1)

test_X = test_data.iloc[:, :-1]
test_Y = encoder.transform(test_data.iloc[:, -1])

# Making prediction by take mode of predictions 
# made by all the classifiers
svm_preds = final_svm_model.predict(test_X)
nb_preds = final_nb_model.predict(test_X)
rf_preds = final_rf_model.predict(test_X)
dt_preds = final_dt_model.predict(test_X)
kn_preds = final_kn_model.predict(test_X)

from scipy import stats
final_preds = [stats.mode([i,j,k])[0] for i,j,k in zip(svm_preds, nb_preds, rf_preds)]
# print(f"Accuracy on Test dataset by the combined model: {accuracy_score(test_Y, final_preds)}")
# print()



symptoms = X.columns.values
# Creating a symptom index dictionary to encode the
# input symptoms into numerical form
symptom_index = {}
for index, value in enumerate(symptoms):
    symptom = " ".join(value.split("_"))
    symptom_index[symptom] = index

data_dict = {
    "symptom_index":symptom_index,
    "predictions_classes":encoder.classes_
}


# Defining the Function
# Input: string containing symptoms separated by commas
# Output: Generated predictions by models
def predictDisease(symptoms):
    #symptoms = symptoms.split(",")
    
    # creating input data for the models
    input_data = [0] * len(data_dict["symptom_index"])
    for symptom in symptoms:
        no_under=symptom.replace('_',' ')
        index = data_dict["symptom_index"][no_under]
        input_data[index] = 1
        
    # reshaping the input data and converting it
    # into suitable format for model predictions
    input_data = np.array(input_data).reshape(1,-1)
    
    # generating individual models outputs
    rf_prediction = data_dict["predictions_classes"][final_rf_model.predict(input_data)[0]]
    nb_prediction = data_dict["predictions_classes"][final_nb_model.predict(input_data)[0]]
    svm_prediction = data_dict["predictions_classes"][final_svm_model.predict(input_data)[0]]
    dt_prediction = data_dict["predictions_classes"][final_dt_model.predict(input_data)[0]]
    kn_prediction = data_dict["predictions_classes"][final_kn_model.predict(input_data)[0]]

    # making final prediction by taking mode of all predictions
    # Use statistics.mode instead of scipy.stats.mode
    import statistics
    final_prediction = statistics.mode([rf_prediction, nb_prediction, svm_prediction, dt_prediction, kn_prediction])
#    predictions = {
#        "rf_model_prediction": rf_prediction,
#        "naive_bayes_prediction": nb_prediction,
#        "svm_model_prediction": svm_prediction,
#        "decision_tree_prediction":dt_prediction,
#        "kNeighbors_prediction": kn_prediction,

#       "final_prediction":final_prediction
#  }
    return final_prediction
# Testing the function






# Routes
@app.route("/")
def main():
    return "connected   "

@app.route('/symptoms', methods=["GET"])
def symptoms():
    return jsonify(symptoms_list)

@app.route('/disease', methods=["GET"])
def disease():
    try:
        # Load symptoms from the query parameters
        symptoms = json.loads(request.args.get('symptoms'))
        
        # Filter valid symptoms
        valid_symptoms = [symptom for symptom in symptoms if symptom in symptoms_list]
        print(valid_symptoms)  # For debugging; consider using logging in production
        
        # Ensure at least 3 valid symptoms
        if len(valid_symptoms) < 3:
            return jsonify({"error": "Please enter at least 3 valid symptoms."}), 400
        
        # Predict disease based on valid symptoms
        predictions = predictDisease(valid_symptoms)
        
        # Get disease name from predictions
        disease_name = predictions  # Adjust this based on your prediction function
        medications_data = medications_tips.get(disease_name, {})
        
        return jsonify({
            "predicted_disease": disease_name, 
            "medications": medications_data.get("medications", []), 
            "tips": medications_data.get("tips", [])
        })
    
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid JSON format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/medications', methods=["GET"])
def medications():
    disease = request.args.get("disease")

    # Check if the disease exists in the medications_tips dictionary
    if disease in medications_tips:
        return jsonify(medications_tips[disease])
    else:
        return jsonify({"error": "Disease not found."}), 404


@app.route('/doctors', methods=["GET"])
def doctors():
    specialization = request.args.get("specialization")
    # Replace with actual doctor data logic
    return jsonify({"doctors": [{"name": "Dr. Smith", "specialization": specialization}]})

if __name__ == "__main__":
    app.run(debug=True)