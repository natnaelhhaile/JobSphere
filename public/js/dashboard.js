const jobsPerPage = 8; // Jobs per page

function fixUnclosedTags(description) {
    // Create a temporary div element to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(description, 'text/html');
    return doc.body.innerHTML;  // Returns properly closed HTML
}

// Function to render jobs based on the current filter and page
function renderJobs(filter, jobs, currentPage, totalJobs) {
    const jobsList = document.getElementById('jobs-list');
    const noJobsMsg = document.getElementById('no-jobs-msg');
    const paginationContainer = document.querySelector('.pagination-container');
    
    if (totalJobs === 0 || jobs.length === 0) {
        jobsList.innerHTML = '';
        paginationContainer.innerHTML = '';
        noJobsMsg.style.display = 'block'; // Show "No jobs" message
    } else {
        jobsList.innerHTML = ''; // Clear the previous content
        noJobsMsg.style.display = 'none'; // Hide "No jobs" message

        // Render job cards
        jobsList.innerHTML = jobs
            .map(
                (job) => `
            <div class="job-item mb-4" data-site="${job.site.toLowerCase()}">
                <div class="job-card p-3">
                    <div class="d-flex align-items-center">
                        <img src="${job.company_logo ? job.company_logo : '/images/default-logo.png'}" alt="${job.company} logo" class="job-logo">
                        <div class="ms-3">
                            <h5 class="job-title">${job.title}</h5>
                            <p><strong>${job.company}</strong></p>
                        </div>
                    </div>
                    <p class="job-location"><strong>Location:</strong> ${job.location}</p>
                    ${fixUnclosedTags(job.description.length > 150 ? job.description.slice(0, 150) + '...' : job.description)}
                    <p class="job-salary"><strong>Salary:</strong> ${
                        job.salary && job.salary.min_amount !== null && job.salary.max_amount !== null
                            ? `${job.salary.min_amount} - ${job.salary.max_amount} ${job.salary.currency}`
                            : 'Not specified'
                    }</p>
                    <p class="remote-status"><strong>Remote:</strong> ${job.is_remote ? 'Yes' : 'No'}</p>
                    <div class="text-center">
                        <a href="/dashboard/jobs/${job._id}" target="_blank" class="btn btn-1">View Job</a>
                    </div>
                </div>
            </div>`
            )
            .join('');

        // Render pagination
        renderPagination(filter, totalJobs, currentPage);
    }
}

// Function to render pagination
function renderPagination(filter, totalJobs, currentPage) {
    const paginationContainer = document.querySelector('.pagination-container');
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalJobs / jobsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.className = "btn btn-2 pagination-btn";
        if (i === currentPage) {
            button.classList.replace('btn-2', 'btn-1');
            button.setAttribute('aria-current', 'page'); // Accessibility enhancement
        }
        button.textContent = i;
        button.onclick = () => {
            fetchJobs(filter, i); // Re-render jobs
        };
        paginationContainer.appendChild(button);
    }
}

// Filter jobs when a button is clicked
function filterJobs(site) {
    currentPage = 1; // Reset to the first page
    document.querySelectorAll('.job-filter.btn').forEach((btn) =>
        btn.classList.remove('active-filter')
    );
    document.querySelector(`.btn-${site}`).classList.add('active-filter'); // Highlight the selected button
    fetchJobs(site, currentPage); // Re-render jobs
}

// Fetch jobs and render them
async function fetchJobs(filter = 'all', page = 1) {
    const loadingOverlay = document.getElementById('loading-overlay');
    try {

        // Show loading overlay
        loadingOverlay.style.display = 'flex';

        const url = `/dashboard/jobs?site=${filter}&page=${page}`;
        const response = await fetch(url, {
             credentials: 'include',
             headers: {
                'Cache-Control': 'no-cache', // Prevent caching
                'Pragma': 'no-cache',
            }
        });

        // Check for errors in the API response
        if (!response.ok) {
            console.log("response not ok")
            console.error('Failed to fetch jobs:', response.status, response.statusText);
            return;
        }

        const data = await response.json();

        if (data.jobs) {
            currentPage = page
            renderJobs(filter, data.jobs, currentPage, data.totalJobs);
        } else {
            const jobsList = document.getElementById('jobs-list');
            jobsList.innerHTML = '<p>No jobs found.</p>';
            document.querySelector('.pagination-container').innerHTML = '';
        }
    } catch (err) {
        console.error('Error fetching jobs:', err);
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    fetchJobs();
});
