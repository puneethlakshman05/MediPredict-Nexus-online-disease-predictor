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
 
medications_tips =  {
    'Fungal infection': {
        'medications': ['Topical antifungals (Clotrimazole)', 'Oral antifungals (Fluconazole)', 'Antifungal shampoos for scalp infections'],
        'tips': ['Keep affected areas clean and dry', 'Avoid tight clothing', 'Use antifungal powder to reduce moisture', 'Avoid sharing personal items like towels']
    },
    'Allergy': {
        'medications': ['Antihistamines (Cetirizine)', 'Nasal corticosteroids (Fluticasone)', 'Epinephrine (for severe allergic reactions)'],
        'tips': ['Identify and avoid allergens', 'Use air purifiers to reduce airborne allergens', 'Wear a medical alert bracelet if severe allergies are present']
    },
    'GERD': {
        'medications': ['Proton pump inhibitors (Omeprazole)', 'H2 receptor antagonists (Ranitidine)', 'Antacids (Calcium carbonate)'],
        'tips': ['Avoid large meals and lying down after eating', 'Elevate the head of the bed while sleeping', 'Limit intake of spicy and fatty foods']
    },
    'Chronic Cholecystitis': {
        'medications': ['Ursodeoxycholic acid', 'Pain relievers (Ibuprofen)', 'Antibiotics if infection is suspected'],
        'tips': ['Maintain a low-fat diet', 'Regular check-ups with a healthcare provider', 'Avoid rapid weight loss']
    },
    'Drug Reaction': {
        'medications': ['Antihistamines for mild reactions', 'Corticosteroids for severe reactions', 'Epinephrine for anaphylaxis'],
        'tips': ['Inform healthcare providers of drug allergies', 'Keep a list of all medications taken', 'Wear a medical alert bracelet for severe drug allergies']
    },
    'Peptic ulcer disease': {
        'medications': ['Proton pump inhibitors (Lansoprazole)', 'Antibiotics if caused by H. pylori', 'Antacids for symptom relief'],
        'tips': ['Avoid NSAIDs and alcohol', 'Eat smaller, more frequent meals', 'Manage stress through relaxation techniques']
    },
    'AIDS': {
        'medications': ['Antiretroviral therapy (ART)', 'Protease inhibitors (Ritonavir)'],
        'tips': ['Regular check-ups and adherence to medication', 'Safe sex practices to prevent transmission', 'Maintain a healthy lifestyle with proper nutrition']
    },
    'Diabetes': {
        'medications': ['Metformin', 'Insulin as needed', 'SGLT2 inhibitors (Empagliflozin)'],
        'tips': ['Monitor blood sugar levels regularly', 'Follow a balanced diet and exercise plan', 'Stay hydrated and avoid sugary drinks']
    },
    'Gastroenteritis': {
        'medications': ['Antidiarrheals (Loperamide)', 'Rehydration solutions', 'Probiotics to restore gut flora'],
        'tips': ['Stay hydrated with clear fluids', 'Avoid dairy and fatty foods until recovery', 'Wash hands regularly to prevent spread']
    },
    'Bronchial Asthma': {
        'medications': ['Inhaled corticosteroids (Budesonide)', 'Bronchodilators (Albuterol)', 'Leukotriene modifiers (Montelukast)'],
        'tips': ['Avoid known triggers', 'Use a peak flow meter to monitor breathing', 'Maintain a regular medication routine']
    },
    'Hypertension': {
        'medications': ['ACE inhibitors (Lisinopril)', 'Beta-blockers (Atenolol)', 'Calcium channel blockers (Amlodipine)'],
        'tips': ['Maintain a low-sodium diet', 'Regular exercise and weight management', 'Limit alcohol intake and manage stress']
    },
    'Migraine': {
        'medications': ['Triptans (Sumatriptan)', 'NSAIDs (Ibuprofen)', 'Ergotamine preparations'],
        'tips': ['Identify and avoid migraine triggers', 'Maintain a regular sleep schedule', 'Stay hydrated and avoid skipping meals']
    },
    'Cervical spondylosis': {
        'medications': ['Pain relievers (Acetaminophen)', 'Muscle relaxants', 'Physical therapy exercises'],
        'tips': ['Physical therapy to improve neck strength', 'Use ergonomic furniture', 'Apply heat/cold therapy as needed']
    },
    'Paralysis (brain hemorrhage)': {
        'medications': ['Anticoagulants for certain conditions', 'Pain management medications', 'Physical rehabilitation support'],
        'tips': ['Immediate medical attention is crucial', 'Rehabilitation therapies post-recovery', 'Supportive care to maintain quality of life']
    },
    'Jaundice': {
        'medications': ['Treat underlying causes (e.g., antivirals for hepatitis)', 'Cholestyramine for itching'],
        'tips': ['Stay hydrated', 'Avoid alcohol and liver-damaging substances', 'Rest and follow a balanced diet']
    },
    'Malaria': {
        'medications': ['Antimalarial drugs (Artemisinin-based combination therapies)', 'Chloroquine for certain strains'],
        'tips': ['Use mosquito nets and repellents', 'Seek immediate medical attention if symptoms arise', 'Take preventive medication when traveling to endemic areas']
    },
    'Chicken pox': {
        'medications': ['Antihistamines for itching', 'Acetaminophen for fever', 'Antiviral medication (Acyclovir) for severe cases'],
        'tips': ['Keep nails trimmed to prevent scratching', 'Isolate to prevent spreading', 'Keep skin moisturized to prevent scarring']
    },
    'Dengue': {
        'medications': ['Pain relievers (Acetaminophen)', 'Hydration solutions', 'Platelet transfusion in severe cases'],
        'tips': ['Use mosquito repellent and nets', 'Monitor for severe symptoms', 'Avoid aspirin or NSAIDs due to bleeding risk']
    },
    'Typhoid': {
        'medications': ['Antibiotics (Ciprofloxacin)', 'Azithromycin for drug-resistant cases'],
        'tips': ['Ensure safe drinking water', 'Practice good hygiene', 'Rest and proper nutrition']
    },
    'Hepatitis A': {
        'medications': ['Vaccination for prevention', 'Supportive care for symptoms'],
        'tips': ['Practice good hygiene and sanitation', 'Avoid contaminated food and water', 'Rest and stay hydrated']
    },
    'Hepatitis B': {
        'medications': ['Antiviral medications (Tenofovir)', 'Interferon injections'],
        'tips': ['Vaccination for prevention', 'Avoid sharing needles', 'Routine liver function monitoring']
    },
    'Hepatitis C': {
        'medications': ['Direct-acting antivirals (DAAs)', 'Ribavirin for combination therapy'],
        'tips': ['Regular medical check-ups', 'Avoid sharing personal items', 'Adhere to treatment regimens for effectiveness']
    },
    'Hepatitis D': {
        'medications': ['Interferon therapy', 'Supportive care'],
        'tips': ['Vaccination against hepatitis B', 'Regular monitoring of liver function', 'Maintain a healthy diet and avoid alcohol']
    },
    'Hepatitis E': {
        'medications': ['No specific treatment; supportive care', 'Rest and hydration'],
        'tips': ['Ensure safe drinking water', 'Practice good hygiene', 'Avoid raw or undercooked food']
    },
    'Alcoholic hepatitis': {
        'medications': ['Corticosteroids for severe cases', 'Pentoxifylline as an alternative'],
        'tips': ['Abstain from alcohol', 'Nutritional support and counseling', 'Regular medical follow-ups']
    },
    'Tuberculosis': {
        'medications': ['Antibiotics (Isoniazid, Rifampicin)', 'Ethambutol and Pyrazinamide'],
        'tips': ['Complete the full course of treatment', 'Regular check-ups to monitor progress', 'Maintain a nutritious diet']
    },
    'Common Cold': {
        'medications': ['Decongestants (Pseudoephedrine)', 'Cough suppressants', 'Antihistamines for runny nose'],
        'tips': ['Rest and stay hydrated', 'Use saline nasal sprays', 'Avoid cold and dry air']
    },
    'Pneumonia': {
        'medications': ['Antibiotics if bacterial', 'Cough medicine', 'Fever reducers (Acetaminophen)'],
        'tips': ['Get vaccinated (Pneumonia vaccine)', 'Rest and drink fluids', 'Use a humidifier for easier breathing']
    },
    'Dimorphic hemmorhoids(piles)': {
        'medications': ['Topical creams (Hydrocortisone)', 'Oral pain relievers', 'Laxatives for stool softening'],
        'tips': ['Increase fiber intake', 'Stay hydrated and exercise regularly', 'Avoid prolonged sitting and straining']
    },
    'Heart attack': {
        'medications': ['Antiplatelet agents (Aspirin)', 'Beta-blockers', 'ACE inhibitors'],
        'tips': ['Follow a heart-healthy diet', 'Regular exercise and monitoring', 'Avoid smoking and manage stress']
    },
    'Varicose veins': {
        'medications': ['Compression stockings', 'Sclerotherapy for severe cases', 'Pain relievers'],
        'tips': ['Elevate legs when resting', 'Avoid standing for long periods', 'Exercise to improve circulation']
    },
    'Hypothyroidism': {
        'medications': ['Levothyroxine (Thyroid hormone replacement)'],
        'tips': ['Regular monitoring of thyroid levels', 'Maintain a balanced diet', 'Avoid certain foods that can interfere with absorption']
    },
    'Hyperthyroidism': {
        'medications': ['Antithyroid drugs (Methimazole)', 'Beta-blockers for symptoms'],
        'tips': ['Avoid caffeine and excess iodine', 'Regular check-ups with an endocrinologist', 'Maintain a healthy lifestyle with stress management']
    },
     'Hypoglycemia': {
        'medications': ['Glucose tablets', 'Glucose gel', 'Dextrose injections for emergency use', 'Fast-acting carbohydrates (fruit juice, candy)'],
        'tips': ['Keep quick sources of sugar on hand at all times', 'Eat regular meals and snacks with balanced carbohydrates and proteins', 'Monitor blood glucose levels regularly', 'Avoid skipping meals or prolonged fasting']
    },
    'Osteoarthritis': {
        'medications': ['Pain relievers (Acetaminophen, NSAIDs)', 'Topical analgesics (Capsaicin cream)', 'Corticosteroid injections', 'Hyaluronic acid injections'],
        'tips': ['Engage in regular low-impact physical activity such as swimming or walking', 'Maintain a healthy weight to reduce joint stress', 'Practice gentle stretching exercises for flexibility', 'Use supportive devices like braces or shoe inserts']
    },
    'Arthritis': {
        'medications': ['Disease-modifying antirheumatic drugs (DMARDs)', 'NSAIDs', 'Biologic agents (Etanercept, Infliximab)', 'Corticosteroids'],
        'tips': ['Perform regular low-impact exercise like yoga or swimming', 'Use hot/cold therapy for pain relief and inflammation reduction', 'Maintain a healthy diet rich in anti-inflammatory foods', 'Practice joint protection techniques']
    },
    '(Vertigo) Paroxysmal Positional Vertigo': {
        'medications': ['Vestibular suppressants (Meclizine)', 'Antihistamines (Dimenhydrinate)', 'Benzodiazepines (Diazepam) for severe cases'],
        'tips': ['Avoid sudden head movements or quick changes in posture', 'Follow specific maneuvers such as the Epley maneuver recommended by a healthcare provider', 'Stay hydrated to help maintain inner ear balance', 'Sleep with the head slightly elevated']
    },
    'Acne': {
        'medications': ['Topical retinoids (Adapalene, Tretinoin)', 'Oral antibiotics (Doxycycline, Minocycline)', 'Topical antibiotics (Clindamycin)', 'Oral isotretinoin for severe cases'],
        'tips': ['Keep skin clean and moisturized with non-comedogenic products', 'Avoid touching the face to prevent bacteria transfer', 'Use gentle cleansers without harsh scrubbing', 'Limit exposure to greasy environments and avoid oily cosmetics']
    },
    'Urinary tract infection': {
        'medications': ['Antibiotics (Nitrofurantoin, Trimethoprim-Sulfamethoxazole)', 'Pain relievers (Phenazopyridine)', 'Cranberry supplements as preventive'],
        'tips': ['Stay hydrated by drinking plenty of water', 'Urinate after intercourse to flush out bacteria', 'Avoid using harsh soaps or douches', 'Wear cotton underwear and avoid tight clothing']
    },
    'Psoriasis': {
        'medications': ['Topical corticosteroids', 'Phototherapy (UVB light therapy)', 'Biologic drugs (Adalimumab, Ustekinumab)', 'Systemic agents (Methotrexate, Cyclosporine)'],
        'tips': ['Moisturize skin regularly to reduce dryness', 'Avoid known triggers such as stress, smoking, or alcohol', 'Take warm baths with added bath oil or oatmeal', 'Manage stress through mindfulness or relaxation techniques']
    },
    'Impetigo': {
        'medications': ['Topical antibiotics (Mupirocin)', 'Oral antibiotics for severe cases (Cephalexin)', 'Antiseptic washes (Chlorhexidine)', 'Topical retapamulin for resistant cases'],
        'tips': ['Keep the affected area clean and dry', 'Avoid scratching or touching the rash', 'Wash hands frequently to prevent the spread of infection', 'Cover the sores with loose clothing or bandages to prevent contact']
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

        if no_under not in data_dict["symptom_index"]:
         print(f"Symptom '{no_under}' not found in symptom index.")

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
    print(f"Predicted disease: {final_prediction}")
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
        print(f"valid_symptoms:{valid_symptoms}")  # For debugging; consider using logging in production
        
        # Ensure at least 3 valid symptoms
        if len(valid_symptoms) < 3:
            return jsonify({"error": "Please enter at least 3 valid symptoms."}), 400
        
        # Predict disease based on valid symptoms
        predictions = predictDisease(valid_symptoms)
        
        # Get disease name from predictions
        disease_name = predictions  # Adjust this based on your prediction function
        medications_data = medications_tips.get(disease_name, {})
        print(f"Predicted Disease: {disease_name}, Medications Data: {medications_data}") 
       
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
    # Normalize the input to ensure consistent formatting
    normalized_disease = disease.strip().lower().replace(' ', '_')
    
    # Debug print
    print(f"Received request for disease: {normalized_disease}")
    print("Available diseases:", list(medications_tips.keys()))

    # Check against the normalized keys in the dictionary
    for key in medications_tips.keys():
        normalized_key = key.lower().replace(' ', '_')
        if normalized_key == normalized_disease:
            return jsonify(medications_tips[key])

    return jsonify({"error": "Disease not found."}), 404



@app.route('/doctors', methods=["GET"])
def doctors():
    specialization = request.args.get("specialization")
    # Replace with actual doctor data logic
    return jsonify({"doctors": [{"name": "Dr. Smith", "specialization": specialization}]})

if __name__ == "__main__":
    app.run(debug=True)