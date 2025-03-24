<h1 align="center">JobSphere</h1>

<p align="center">
  <img width="300" alt="JobSphere Logo" src="https://github.com/user-attachments/assets/d2dc221c-bc60-4f09-ae25-81903a291a66" />
</p>

**JobSphere** is a job-matching web application that helps users find job opportunities tailored to their resumes. It leverages **resume parsing, job scraping, bookmarking, and authentication** to enhance the job search experience. The application enables users to upload their resumes, extract relevant skills and experience, and receive **personalized job recommendations**.

---

## 🚀 Features

### 🔑 **Authentication & Security**
- **Social Login Integration**: Sign up and log in seamlessly using **Google & Facebook** (implemented via Passport.js).
- **JWT Authentication**: Secure user sessions with token-based authentication.

### 📄 **Resume Upload & Parsing**
- Upload resumes to **automatically extract skills, experience, and keywords**.
- **Resume parsing** to analyze and extract relevant job-matching criteria.

### 🏢 **Job Search & Recommendations**
- **Web Scraping**: Fetch jobs from **Indeed, Glassdoor, and ZipRecruiter**.
- **Dashboard with Tailored Job Listings**: Personalized job postings based on parsed resume data.
- **Bookmarking System**: Users can **save jobs** they’re interested in and access them later via the **Bookmarks Page**.
- **Job Detail Pages**: View full job descriptions, application links, and company details.

### 📌 **Profile & User Management**
- Update user profile details (email, password, second email, phone number).
- Resume management: Upload, replace, or delete your resume.

### 🎨 **Responsive & Modern UI**
- Fully **responsive design** for desktop and mobile screens.
- **Intuitive job dashboard** for a streamlined job search experience.

---

## 📸 Screenshots

<p align="center"><strong>Landing Page</strong></p>
<p align="center">
  <img width="1470" alt="Landing Page" src="https://github.com/user-attachments/assets/952932d6-9c51-412e-893f-11721cfd32b0" />
</p>

<p align="center"><strong>Social Login & Sign-Up Pages</strong></p>
<p align="center">
  <img width="1424" alt="image" src="https://github.com/user-attachments/assets/4cb49596-bc27-41cd-a4f7-39040cb17f4a" />
  <img width="1452" alt="Login Page" src="https://github.com/user-attachments/assets/d516d6ee-108d-40fa-a2de-a8fdba7c2339" />
</p>

<p align="center"><strong>Dashboard with Job Recommendations</strong></p>
<p align="center">
  <img width="1470" alt="Dashboard Page" src="https://github.com/user-attachments/assets/8e4571fa-3372-4cc6-b866-d4b59d8d5eec" />
  <img width="488" alt="Dashboard Page" src="https://github.com/user-attachments/assets/dad7273a-8102-4153-9958-bbad2acb3ad9" />
</p>

<p align="center"><strong>Bookmarking System</strong></p>
<p align="center">
  <img width="490" alt="Bookmarks Page" src="https://github.com/user-attachments/assets/27368947-3725-4126-9286-51fab0bafc74" />
</p>

<p align="center"><strong>Profile Page</strong></p>
<p align="center">
  <img width="488" alt="Profile Page" src="https://github.com/user-attachments/assets/0d1e0635-53a9-459d-99d0-86c64f4d205a" />
</p>

---

## 🛠 Technologies Used

- **Frontend:** HTML5, CSS3, Bootstrap, EJS, Fetch API
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** Passport.js (Google & Facebook Login), JSON Web Tokens (JWT), Bcrypt.js
- **Resume Parsing:** Integrated with the Resume Parser API
- **Job Scraping:** Python-based web scraping (`jobspy` module)
- **APIs/Middleware:** Multer, Axios, Connect-Flash, Cookie-Parser, Express-Session

---

## 📥 Project Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (local or cloud via MongoDB Atlas)
- **Python 3.x** (for running the job scraper script)

### Installation

```bash
# Clone the repository
git clone https://github.com/curiousityDrives/JobSphere.git
cd jobsphere

# Install Node.js dependencies
npm install

# Set up MongoDB (local or cloud-based)
# If using MongoDB Atlas, update the connection URI in app.js

# Install Python dependencies for job scraping
pip install jobspy

# Create a .env file and add required environment variables
```
**Example `.env` file:**
```env
JWT_SECRET=your_jwt_secret
API_KEY=your_resume_parser_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

```bash
# Start the server
npm start

# Open in browser: http://localhost:3000
```

---

## 🔮 Future Enhancements

🚀 **Advanced AI-Powered Job Matching**
- Implementing a **machine learning model** to rank and sort scraped jobs based on their relevance to the user's resume.

🤖 **GenAI-Powered Resume Parsing**
- Integrating **Generative AI (LLMs)** to enhance resume parsing and improve **data context retention**, ensuring better job recommendations.

📌 **Job Tracker & Application Management**
- Users will be able to **track job applications**, manage their **in-progress interviews**, and monitor **reviewed applications**.

Stay tuned for these exciting updates! 🎯

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or find any issues, feel free to open an issue or submit a pull request.

```bash
# Fork the repository
# Create a new branch
git checkout -b feature/your-feature-name
# Make your changes
# Commit changes
git commit -m 'Added new feature'
# Push to GitHub
git push origin feature/your-feature-name
# Open a pull request
```

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎤 Acknowledgments
- Thanks to **[JobSpy](https://github.com/username/jobspy)** for web scraping capabilities.
- Thanks to **[Resume Parser API](https://apilayer.com/marketplace/resume-parser-api)** for resume data extraction.

---

<p align="center">Developed & maintained by <strong>Natnael Haile</strong>.</p>

