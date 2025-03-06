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
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

#Game Route
@app.route('/game')
def game():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('game.html')

#Game Route
@app.route('/history')
def history():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('history.html')

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
        print(user[0])
        if user:
            session['user_id'] = user[0]
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
    session.pop('user_id', None)
    return redirect(url_for('login'))

def update_game_history(user_id, game_date, status):
    cur = mysql.connection.cursor()
    # Check if an entry already exists
    cur.execute("SELECT id FROM game_history WHERE user_id = %s AND date = %s", (user_id, game_date))
    existing_entry = cur.fetchone()

    if existing_entry:
        # Update status if already exists
        cur.execute("UPDATE game_history SET status = %s WHERE id = %s", (status, existing_entry[0]))
    else:
        # Insert new record
        cur.execute("INSERT INTO game_history (user_id, date, status) VALUES (%s, %s, %s)", 
                    (user_id, game_date, status))

    mysql.connection.commit()
    cur.close()

from datetime import datetime, timedelta

@app.route("/get-history", methods=["GET"])
def get_history():
    if 'user_id' not in session:
        return jsonify({"error": "User not logged in"}), 401

    user_id = session['user_id']
    # user_id = '108'
    today = date.today()
    month = request.args.get('month', type=int, default=date.today().month)
    year = request.args.get('year', type=int, default=date.today().year)
    first_day = date(year, month, 1)
    last_day = (first_day.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    
    cur = mysql.connection.cursor()
    cur.execute("SELECT date, status FROM game_history WHERE user_id = %s AND date BETWEEN %s AND %s", (user_id, first_day, last_day))
    history = {row[0].strftime("%Y-%m-%d"): row[1] for row in cur.fetchall()}
    cur.close()
    
    return jsonify(history)


    # first_day = today.replace(day=1)
    # last_day = today.replace(day=28) + timedelta(days=4)  # Ensures we get up to 31st
    # last_day = last_day - timedelta(days=last_day.day - 1)  # Adjust to last day of month

    # cur = mysql.connection.cursor()
    # cur.execute("SELECT date, status FROM game_history WHERE user_id = %s AND date BETWEEN %s AND %s", 
    #             (user_id, first_day, last_day))
    
    # history = {row[0].strftime("%Y-%m-%d"): row[1] for row in cur.fetchall()}
    # cur.close()

    # return jsonify(history)    

@app.route("/update-history", methods=["POST"])
def update_history():
    if "user_id" not in session:
        return jsonify({"error": "User not logged in"}), 401

    data = request.get_json()
    status = data.get("status")  # 'win' or 'lose'
    
    if status not in ["win", "lose"]:
        return jsonify({"error": "Invalid status"}), 400

    user_id = session["user_id"]
    # user_id = '108'
    print(f"Updating history for user_id: {user_id}, status: {status}")  # Debugging

    update_game_history(user_id, date.today(), status)
    
    return jsonify({"message": "History updated successfully"})

if __name__ == '__main__':
    app.run(debug=True)