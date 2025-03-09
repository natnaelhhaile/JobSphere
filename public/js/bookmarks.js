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
function renderPagination(totalJobs, currentPage) {
    const jobsPerPage = 8; // Jobs per page
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
        button.onclick = () => fetchJobs(i); // Re-render jobs
        paginationContainer.appendChild(button);
    }
}

// Function to render jobs based on the current filter and page
function renderJobs(jobs, currentPage, totalJobs, savedJobs) {
    const jobsList = document.getElementById('jobs-list');
    const noJobsMsg = document.getElementById('no-jobs-msg');
    const paginationContainer = document.querySelector('.pagination-container');
    const bookmarkNumbersHeader = document.querySelector('.bookmark-numbers');

    if (!jobsList || !noJobsMsg || !paginationContainer) {
        console.error("One or more required elements not found.");
        return;
    }

    if (totalJobs === 0 || jobs.length === 0 || savedJobs === 0) {
        jobsList.innerHTML = '';
        paginationContainer.innerHTML = '';
        bookmarkNumbersHeader.innerHTML = '0';
        noJobsMsg.style.display = 'block';
        return;
    }

    jobsList.innerHTML = ''; // Clear previous content
    bookmarkNumbersHeader.innerHTML = savedJobs.length;
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
                    <button data-id="${job._id}" class="btn btn-1 bookmark-btn"><i class="${
                        (savedJobs && Array.isArray(savedJobs)) ?
                        (savedJobs.includes(job._id) ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark') :
                        'fa-regular fa-bookmark'
                    }"></i></button>
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
// Function that executes if an api returns unexpected data
function wrongFormatNoData() {
    console.log('jobs is not an array')
    jobsList.innerHTML = '<p>No jobs found.</p>';
    document.querySelector('.pagination-container').innerHTML = '';
    return;
}

// Function to fetch jobs
async function fetchJobs(currentPage = 1) {
    const jobsList = document.getElementById('jobs-list');
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        console.error("Loading overlay element not found");
        return;
    }
    try {

        // Show loading overlay
        loadingOverlay.style.display = 'flex';

        const url = `/bookmarks?page=${currentPage}`;
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache', // Prevent caching
                'Pragma': 'no-cache',
            }
        });
        console.log(response);
        // Check for errors in the API response
        if (!response.ok) {
            throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
        }

        console.log(jobs);
        console.log(jobs.length);
        console.log(currentPage);

        // Validate response before calling fetchJobs
        if (!window.jobs || !Array.isArray(window.jobs)) {
            console.warn('Invalid or missing jobs data in response.');
            wrongFormatNoData();
        }
        if (!window.savedJobs || !Array.isArray(window.savedJobs)) {
            console.warn('Invalid or missing savedJobs data in response.');
            wrongFormatNoData();
        }
        if (!window.currentPage || typeof window.currentPage !== 'number') {
            console.warn('Invalid or missing currentPage data in response.');
            wrongFormatNoData();
        }

        // Render fetched jobs
        console.log('jobs is an array')
        renderJobs(window.jobs, currentPage, window.savedJobs.length, window.savedJobs);

    } catch (err) {
        console.error('Error fetching jobs:', err);
        jobsList.innerHTML = `<p style="color: red;">${err.message || "An unexpected error occurred. Please try again later."}</p>`;
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
    }
}

// Function to process flash alerts
function processFlashAlert(alertElement) {
    if (!alertElement || !alertElement.textContent.trim()) {
        if (alertElement) alertElement.style.display = 'none';
        return;
    }
    alertElement.style.display = 'block';
    fadeOutAlert(alertElement);
}

// Function to handle fade-out and removal of alert
function fadeOutAlert(alertElement) {
    if (!alertElement) return;

    alertElement.classList.add('fade-out'); // Start the animation

    alertElement.addEventListener('animationend', () => {
        alertElement.style.display = 'none';
    }, { once: true }); // Ensures it runs only once
}

// Toggle bookmark helper function
async function toggleBookmark(jobId, button) {
    try {
        const response = await fetch('/bookmarks/toggle', {
            method: 'POST',
            headers: {'Content-Type': 'Application/JSON'},
            body: JSON.stringify({jobId})
        });

        if (!response.ok) {
            throw new Error(`Failed to bookmark/unbookmark job: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // toggle UI based on new bookmark status
        const icon = button.querySelector('i');
        if (result.saved) {
            icon.classList.replace('fa-regular', 'fa-solid');
        } else {
            icon.classList.replace('fa-solid', 'fa-regular');
        }

        // Validate response before calling fetchJobs
        if (!result.jobs || !Array.isArray(result.jobs)) {
            console.warn('Invalid or missing jobs data in response.');
            return;
        }
        if (!result.savedJobs || !Array.isArray(result.savedJobs)) {
            console.warn('Invalid or missing savedJobs data in response.');
            return;
        }
        if (!result.currentPage || typeof result.currentPage !== 'number') {
            console.warn('Invalid or missing currentPage data in response.');
            return;
        }

        // Fetch updated job list
        await fetchJobs(result.currentPage);

    } catch (err) {
        console.error('Error toggling bookmark:', err);
        // Todo: redesign #flash-messages to show error or success messages on the dashboard page without Express-flash
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {

    document.addEventListener('click', (event) => {
        // Ensure event.target is a valid DOM element
        if (!(event.target instanceof Element)) return;

        // Ignore clicks inside elements with class "profile-logout"
        if (event.target.closest('.profile-logout a')) {
            console.log("Profile or Logout clicked. Skipping event.");
            return; // Do nothing
        }

        // Other click event logic here
        console.log("Clicked outside profile-logout");
    });

    /* Check if user's on bookmarks page -- this condition force-executes 
    fetchJobs() when navigating back from other pages as DOM elements might
    not have loaded yet and hence avoids the need to refresh the page to see
    jobs */
    if (window.location.pathname === "/bookmarks") {
        await fetchJobs(window.currentPage);
    }

    // Express-flash message handles
    processFlashAlert(document.querySelector('.alert-success'));
    processFlashAlert(document.querySelector('.alert-danger'));

    // Event listener to all bookmark buttons - Event Delegation
    document.addEventListener('click', async (event) => {
        const button = event.target.closest('.bookmark-btn');
        if (button) {
            event.preventDefault();
            const jobId = button.dataset.id;
            await toggleBookmark(jobId, button)
        }
    });
});