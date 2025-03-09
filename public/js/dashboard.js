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

// Filter jobs when a button is clicked
function filterJobs(site) {
    currentPage = 1; // Reset to the first page
    
    const filterButtons = document.querySelectorAll('.job-filter.btn');
    if (!filterButtons) {
        console.error('No filter buttons found.');
        return;
    }

    // Batch DOM updates for better performance
    requestAnimationFrame(() => {
        filterButtons.forEach(btn => btn.classList.remove('active-filter'));
        const selectedButton = document.querySelector(`.btn-${site}`);
        if (selectedButton) {
            selectedButton.classList.add('active-filter'); // Highlight the selected button
        } else {
            console.warn(`Filter button for '${site}' not found.`);
        }
    });
    fetchJobs(site, currentPage); // Re-render jobs
}

function updateFilterButtons(jobCounts) {
    // Loop through job count keys and update only the count inside the button
    Object.keys(jobCounts).forEach(site => {
        const button = document.querySelector(`.btn-${site}`);
        if (button) {
            let countElement = button.querySelector('.site-count');
            if (!countElement) {
                console.warn(`Count element for '${site}' not found inside button.`);
                return;
            }
            // Find the count and update it
            countElement.textContent = ` (${jobCounts[site] || 0})`;
        } else {
            console.warn(`Filter button for '${site}' not found.`);
        }
    });

    const totalCount = Object.values(jobCounts).reduce((total, count) => total + count, 0);
    document.querySelector('.btn-all .site-count').textContent = ` (${totalCount})`;
}


// Function to render pagination
function renderPagination(filter, totalJobs, currentPage) {
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
        button.onclick = () => fetchJobs(filter, i); // Re-render jobs
        paginationContainer.appendChild(button);
    }
}

// Function to render jobs based on the current filter and page
function renderJobs(filter, jobs, currentPage, totalJobs, savedJobs, jobCounts) {
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
                    <button data-id="${job._id}" class="btn btn-1 bookmark-btn"><i class="${
                        savedJobs.includes(job._id) ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'
                    }"></i></button>
                    <a href="/dashboard/jobs/${job._id}" target="_blank" class="btn btn-1">View Job</a>
                    <a href="${job.job_url}" target="_blank" class="btn btn-1">Apply</a>
                </div>
            </div>
        `;
        fragment.appendChild(jobElement);
    });

    jobsList.appendChild(fragment); // Append all elements at once for better performance

    // Render filter buttons
    updateFilterButtons(jobCounts);

    // Render pagination
    renderPagination(filter, totalJobs, currentPage);
}

// Function to fetch jobs
async function fetchJobs(filter = 'all', page = 1) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const jobsList = document.getElementById('jobs-list');
    if (!loadingOverlay) {
        console.error("Loading overlay element not found");
        return;
    }
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
            throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.jobs && Array.isArray(data.jobs)) {
            currentPage = page
            // Render fetched jobs
            renderJobs(filter, data.jobs, currentPage, data.totalJobs, data.savedJobs, data.jobCounts);
        } else {
            jobsList.innerHTML = '<p>No jobs found.</p>';
            document.querySelector('.pagination-container').innerHTML = '';
        }

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

    /* Check if user's on dashboard -- this condition force-executes 
    fetchJobs() when navigating back from other pages as DOM elements might
    not have loaded yet and hence avoids the need to refresh the page to see
    jobs */
    if (window.location.pathname === "/dashboard") {
        await fetchJobs();  //  Initial load
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