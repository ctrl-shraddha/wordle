from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from flask_mysqldb import MySQL
from datetime import date
import random
import hashlib

app = Flask(__name__)
app.secret_key = 'wordle123'

# MySQL Config
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'root'
app.config['MYSQL_DB'] = 'wordle'
mysql = MySQL(app)

# Utility function to hash passwords
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Get the word of the day
def get_word_of_the_day():
    today = date.today().strftime('%Y-%m-%d')
    cur = mysql.connection.cursor()
    cur.execute("SELECT word FROM words WHERE date = %s", (today,))
    word = cur.fetchone()
    if word:
        print(word)
        return word[0]
    else:
        # Select a random word if none exists for today
        cur.execute("SELECT word FROM words ORDER BY RAND() LIMIT 1")
        new_word = cur.fetchone()[0]
        cur.execute("INSERT INTO words (date, word) VALUES (%s, %s)", (today, new_word))
        mysql.connection.commit()
        return 
    
@app.route("/get-word", methods=["GET"])
def get_word():
    word = get_word_of_the_day()
    return jsonify({"word": word.lower()})

# Home Route
@app.route('/')
def home():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

# Login Route
# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     if request.method == 'POST':
#         username = request.form['username']
#         password = hash_password(request.form['password'])
#         cur = mysql.connection.cursor()
#         cur.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
#         user = cur.fetchone()
#         if user:
#             session['user'] = username
#             return redirect(url_for('home'))
#     return render_template('login.html')
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = hash_password(request.form['password'])
        print("Login Username:", username)
        print("Login Password:", password)
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
        user = cur.fetchone()
        print(user)
        if user:
            session['user'] = username
            return redirect(url_for('home'))
    return render_template('login.html')

# Registration Route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        firstname = request.form['fname']
        lastname = request.form['lname']
        age = request.form['age']
        username = request.form['username']
        password = hash_password(request.form['password'])
        print("Reg Username:", username)
        print("Reg Password:", password)
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO users (fname, lname, age, username, password) VALUES (%s, %s, %s, %s, %s)", 
                    (firstname, lastname, age, username, password))
        mysql.connection.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

# Logout Route
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

# API for Word of the Day
@app.route('/word')
def word():
    return jsonify({'word': get_word_of_the_day()})

# API for checking word validity
@app.route('/check_word', methods=['POST'])
def check_word():
    data = request.get_json()
    guessed_word = data['word'].lower()
    correct_word = get_word_of_the_day()
    
    response = {'correct': guessed_word == correct_word, 'letters': []}
    
    for i, letter in enumerate(guessed_word):
        if letter == correct_word[i]:
            response['letters'].append({'letter': letter, 'status': 'correct'})
        elif letter in correct_word:
            response['letters'].append({'letter': letter, 'status': 'present'})
        else:
            response['letters'].append({'letter': letter, 'status': 'absent'})
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)