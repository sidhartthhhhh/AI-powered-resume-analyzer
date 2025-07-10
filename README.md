# 🧠 AI-Powered Resume Analyzer

A full-stack intelligent web application that analyzes resumes against job descriptions using NLP and AI to highlight skill matches, missing keywords, and generate recommendations.

## 🚀 Live Demo
🚧 *[Add deployed link if available]*  
🔧 Or clone and run locally — steps below!

---

## 🔧 Tech Stack

| Layer        | Technologies |
|--------------|--------------|
| **Frontend** | React.js, React Router DOM, Vite |
| **Backend**  | Django, Django REST Framework |
| **AI/NLP**   | Python, NumPy, Pandas, PyTorch |
| **Database** | MongoDB (via PyMongo) |
| **Others**   | JWT Auth, Bcrypt, Git, ESLint |

---

## 🔐 Authentication
JWT Token-Based Auth

Register & Login

Token refresh mechanism included

---

## 📚 Learnings / Contributions
This project helped me gain real-world experience in:

Building full-stack applications

Working with REST APIs

AI/ML integration with PyTorch

Frontend logic + backend data sync

Git versioning & deployment

---

🤝 Contributing
Want to improve it? Fork and contribute!
---

## 📦 Features

✅ Upload resume in `.pdf/.doc/.docx`  
✅ Paste job description  
✅ Match Score calculation  
✅ Keyword Matching & Recommendations  
✅ User Auth (JWT)  
✅ Real-time AI Resume Analysis  
✅ Modern UI with React + Vite


---

## ⚙️ How to Run Locally

### 🐍 Backend (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # For Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver


