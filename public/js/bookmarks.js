const jobsPerPage = 8; // Jobs per page

function fixUnclosedTags(description) {
    // Handle empty/non-string input
    if (typeof(description) !== 'string' || !description.trim()) return '';
    try {
        // Create a temporary div element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(description, 'text/html');
        return doc.body.innerHTML.trim();  // Returns properly closed HTML and trims whitespaces for cleaner output
    } catch (error) {
        console.error('Error fixing unclosed tags:', error);
        return description; // Return original if parsing fails
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
        button.onclick = () => fetchJobs(filter, i); // Re-render jobs
        paginationContainer.appendChild(button);
    }
}

// Function to render jobs based on the current filter and page
function renderJobs(jobs, currentPage, totalJobs) {
    const jobsList = document.getElementById('jobs-list');
    const noJobsMsg = document.getElementById('no-jobs-msg');
    const paginationContainer = document.querySelector('.pagination-container');

    if (!jobsList || !noJobsMsg || !paginationContainer) {
        console.error("One or more required elements not found.");
        return;
    }

    if (totalJobs === 0 || jobs.length === 0) {
        jobsList.innerHTML = '';
        paginationContainer.innerHTML = '';
        noJobsMsg.style.display = 'block';
        return;
    }

    jobsList.innerHTML = ''; // Clear previous content
    noJobsMsg.style.display = 'none';

    const fragment = document.createDocumentFragment();

    jobs.forEach(job => {
        const jobElement = document.createElement('div');
        jobElement.classList.add('job-item', 'mb-4');
        jobElement.dataset.site = job.site.toLowerCase();
        jobElement.innerHTML = `
            <div class="job-card p-3">
                <div class="d-flex align-items-center">
                    <img src="${job.company_logo || '/images/default-logo.png'}" 
                    alt="${job.company} logo" class="job-logo">
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
                    <button data-id="${job._id}" class="btn btn-1 bookmark-btn"><i class="fa-regular fa-bookmark"></i></button>
                    <a href="/dashboard/jobs/${job._id}" target="_blank" class="btn btn-1">View Job</a>
                    <a href="${job.job_url}" target="_blank" class="btn btn-1">Apply</a>
                </div>
            </div>
        `;
        fragment.appendChild(jobElement);
    });

    jobsList.appendChild(fragment); // Append all elements at once for better performance

    // Render pagination
    renderPagination(totalJobs, currentPage);
}

// Function to fetch jobs
async function fetchJobs(jobs) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        console.error("Loading overlay element not found");
        return;
    }
    try {

        // Show loading overlay
        loadingOverlay.style.display = 'flex';

        const url = '/bookmarks';
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'Application/JSON'},
        });

        // Check for errors in the API response
        if (!response.ok) {
            throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            const data = response.JSON();

            if (data.jobs && Array.isArray(data.jobs)) {
                currentPage = page
                // Render fetched jobs
                renderJobs(data.jobs, currentPage, data.jobs.length);
            } else {
                const jobsList = document.getElementById('jobs-list');
                jobsList.innerHTML = '<p>No jobs found.</p>';
                document.querySelector('.pagination-container').innerHTML = '';
            }
        }
    } catch (err) {
        console.error('Error fetching jobs:', err);
        jobsList.innerHTML = `<p style="color: red;">${err.message || "An unexpected error occurred. Please try again later."}</p>`;
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {

    // Render jobs
    await fetchJobs();
});