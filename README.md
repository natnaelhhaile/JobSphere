<h1 align="center">jobSphere</h1>

<p align="center">
  <img width="577" alt="JobSphere Logo" src="https://github.com/user-attachments/assets/d2dc221c-bc60-4f09-ae25-81903a291a66" />
</p>

JobSphere is a web application that helps users find job opportunities based on their resumes. It uses a combination of resume parsing, job scraping from multiple platforms, and MongoDB to store user data and job listings. The application allows users to upload their resumes, extract relevant skills and experience, and automatically generate job recommendations based on their profile.

---

## Features

- **User Authentication:** Users can sign up, log in, and securely store their information.
- **Resume Upload:** Users can upload their resumes, which will be parsed to extract relevant details (skills, experience, etc.).
- **Job Scraping:** Automatically fetch jobs from platforms like Indeed, Glassdoor, and ZipRecruiter using parsed resume data.
- **Job Dashboard:** Displays a list of relevant job opportunities tailored to the user based on their resume.
- **Profile Management:** Users can view and manage their profile information.
- **Responsive Design:** The application is designed to be responsive and works well on various screen sizes.

---

## Screenshots

<p align="center"><strong>Landing Page</strong></p>
<p align="center">
  <img width="700" alt="Landing Page" src="https://github.com/user-attachments/assets/de8245ae-85ba-408a-884c-8bc9adff1cc2" />
  <img width="350" alt="Landing Page - Mobile View" src="https://github.com/user-attachments/assets/d66c3a94-d05e-4071-bee2-ff6981f0408f" />
  <img width="350" alt="Landing Page - Alternate Mobile View" src="https://github.com/user-attachments/assets/3046c6c5-4d2a-4d3b-beb2-ebb9f5c40d13" />
</p>

<p align="center"><strong>Dashboard with Job Recommendations</strong></p>
<p align="center">
  <img width="700" alt="Dashboard" src="https://github.com/user-attachments/assets/86f97948-50a0-4c9f-b06d-324d402ae90b" />
  <img width="700" alt="Job Listings" src="https://github.com/user-attachments/assets/36a14a62-94fc-4cf2-9815-725b41d948e9" />
</p>

<p align="center"><strong>Profile Page</strong></p>
<p align="center">
  <img width="700" alt="Profile Page" src="https://github.com/user-attachments/assets/8a3e7858-62f3-43ce-93d1-eada813791fe" />
</p>

<p align="center"><strong>Modal for Editing Username</strong></p>
<p align="center">
  <img width="700" alt="Edit Username Modal" src="https://github.com/user-attachments/assets/6b5d0cfb-b8ba-4c70-80a7-2af15ca891b7" />
</p>

<p align="center"><strong>Sign-Up Page</strong></p>
<p align="center">
  <img width="350" alt="Sign-Up Page" src="https://github.com/user-attachments/assets/4d59de7e-fd43-4fb8-a0ec-011828927e3a" />
</p>

---

## Technologies Used

- **Frontend:** HTML5, CSS3, Bootstrap, EJS, AJAX
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Resume Parsing:** Integrated with the Resume Parser API
- **Job Scraping:** Python-based web scraping using the `jobspy` module
- **Authentication:** JSON Web Tokens (JWT), Bcrypt.js for password hashing
- **APIs/ Middleware:** Multer, Axios, Connect-Flash, Cookie-Parser, Express-Session

---

## Project Setup

### Prerequisites

Make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (or use a MongoDB cloud service like Atlas)
- Python 3.x (for running the job scraper script)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/jobsphere.git
    cd jobsphere
    ```

2. Install Node.js dependencies:
    ```bash
    npm install
    ```

3. Set up MongoDB:
    - If you’re using a local MongoDB instance, make sure MongoDB is running.
    - If you prefer to use MongoDB Atlas, update the `mongoose.connect()` URI in `app.js` with your MongoDB Atlas credentials.

4. Add the `jobspy` module and any other necessary Python packages for web scraping.

5. Set up environment variables:
    - Create a `.env` file in the root directory and add the following:
      ```env
      JWT_SECRET=your_jwt_secret
      API_KEY=your_resume_parser_api_key
      ```

6. Run the server:
    ```bash
    npm start
    ```

7. Navigate to `http://localhost:3000` in your browser to access the application.

---

## Usage

### Sign Up & Log In

- Create an account by clicking the "Sign Up" link and filling out the registration form with your username, email, and password.
- After signing up, you can log in using your credentials.

### Upload Resume

- Once logged in, you can upload your resume by navigating to the "Upload Resume" page.
- The resume will be parsed, and relevant job recommendations will be displayed based on the extracted data.

### Job Dashboard

- After uploading your resume, the dashboard will show you a list of job opportunities that match your experience and skills.
- If no jobs are found, you will be prompted to upload a resume.

### Profile

- The profile page allows you to view and manage your user details.

---

## Future Features

- Enhanced job filtering and sorting based on salary, location, and job type.
- Integrate additional job platforms for more comprehensive job scraping.
- Add the ability for users to save job postings and receive notifications.
- Improve the UI with modern design trends and better responsiveness.

---

## Contributing

Contributions are welcome! If you find any bugs or have ideas for new features, feel free to open an issue or submit a pull request.

### How to Contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Create a new pull request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Thanks to [JobSpy](https://github.com/username/jobspy) for the web scraping module.
- Thanks to [Resume Parser API](https://apilayer.com/marketplace/resume-parser-api) for resume parsing.

---

**Note:** This project is still a work in progress, and many features and improvements are in the pipeline. Feel free to contribute or suggest enhancements!

---

<p align="center">Created and maintained by Natnael Haile.</p>
