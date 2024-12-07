# JobSphere

JobSphere is a web application that helps users find job opportunities based on their resumes. It uses a combination of resume parsing, job scraping from multiple platforms, and MongoDB to store user data and job listings. The application allows users to upload their resumes, extract relevant skills and experience, and automatically generate job recommendations based on their profile.

This project is currently a work in progress, and additional features will be implemented as development continues.

## Features

- **User Authentication:** Users can sign up, log in, and securely store their information.
- **Resume Upload:** Users can upload their resumes, which will be parsed to extract relevant details (skills, experience, etc.).
- **Job Scraping:** Automatically fetch jobs from platforms like Indeed, Glassdoor, and ZipRecruiter using parsed resume data.
- **Job Dashboard:** Displays a list of relevant job opportunities tailored to the user based on their resume.
- **Profile Management:** Users can view and manage their profile information.
- **Responsive Design:** The application is designed to be responsive and works well on various screen sizes.

## Work in Progress

- The web scraping function is being improved to handle different types of job data more accurately.
- Additional job platforms are being integrated.
- Enhanced user profile and dashboard features are being implemented.

## Technologies Used

- **Frontend:** HTML5, CSS3, Bootstrap, EJS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Resume Parsing:** Integrated with the Resume Parser API
- **Job Scraping:** Python-based web scraping using the `jobspy` module
- **Authentication:** JSON Web Tokens (JWT), Bcrypt.js for password hashing

## Project Setup

To get this project up and running locally, follow the instructions below.

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

4. Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

5. Add the `jobspy` module and any other necessary Python packages for web scraping.

6. Set up environment variables:
    - Create a `.env` file in the root directory and add the following:
      ```env
      JWT_SECRET=your_jwt_secret
      API_KEY=your_resume_parser_api_key
      ```

7. Run the server:
    ```bash
    npm start
    ```

8. Navigate to `http://localhost:3000` in your browser to access the application.

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
- Currently, it supports basic profile information.

## Future Features

- Enhanced job filtering and sorting based on salary, location, and job type.
- Integrate additional job platforms for more comprehensive job scraping.
- Add the ability for users to save job postings and receive notifications.
- Improve the UI with modern design trends and better responsiveness.

## Contributing

Contributions are welcome! If you find any bugs or have ideas for new features, feel free to open an issue or submit a pull request.

### How to Contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Create a new pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to [JobSpy](https://github.com/username/jobspy) for the web scraping module.
- Thanks to [Resume Parser API](https://apilayer.com/marketplace/resume-parser-api) for resume parsing.
- Bootstrap for the responsive design.

---

**Note:** This project is still a work in progress, and many features and improvements are in the pipeline. Feel free to contribute or suggest enhancements!
