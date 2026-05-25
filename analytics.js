// ============================================
// ANALYTICS PAGE LOGIC
// ============================================

let charts = {};

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('topTeachersChart')) {
        initAnalytics();
    }
});

function initAnalytics() {
    const checkData = setInterval(() => {
        if (allTeachers.length > 0) {
            clearInterval(checkData);
            renderCharts();
            updateAnalyticsStats();
        }
    }, 500);
}

function renderCharts() {
    renderTopTeachersChart();
    renderSubjectsChart();
    renderReviewsChart();
}

function renderTopTeachersChart() {
    const sorted = [...allTeachers].sort((a, b) => calculateAverageRating(b.id) - calculateAverageRating(a.id)).slice(0, 5);
    const ctx = document.getElementById('topTeachersChart').getContext('2d');

    charts.topTeachers = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(t => t.name.split(' ')[0]),
            datasets: [{
                label: 'Рейтинг',
                data: sorted.map(t => calculateAverageRating(t.id).toFixed(1)),
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 5, ticks: { stepSize: 1 } }
            }
        }
    });
}

function renderSubjectsChart() {
    const subjectData = {};
    allTeachers.forEach(t => {
        if (!subjectData[t.subject]) subjectData[t.subject] = { count: 0, totalRating: 0 };
        subjectData[t.subject].count++;
        subjectData[t.subject].totalRating += calculateAverageRating(t.id);
    });

    const subjects = Object.keys(subjectData);

    const ctx = document.getElementById('subjectsChart').getContext('2d');

    charts.subjects = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: subjects,
            datasets: [{
                data: subjects.map(s => subjectData[s].count),
                backgroundColor: [
                    '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', 
                    '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 11 } }
                }
            }
        }
    });
}

function renderReviewsChart() {
    const days = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'short' });
        days[key] = 0;
    }

    allReviews.forEach(r => {
        const date = new Date(r.created_at);
        const key = date.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'short' });
        if (days.hasOwnProperty(key)) days[key]++;
    });

    const ctx = document.getElementById('reviewsChart').getContext('2d');

    charts.reviews = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(days),
            datasets: [{
                label: 'Пікірлер',
                data: Object.values(days),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

async function updateAnalyticsStats() {
    document.getElementById('stat-teachers').textContent = allTeachers.length;
    document.getElementById('stat-reviews').textContent = allReviews.length;

    const { data: users, error } = await supabaseClient.from('users').select('id', { count: 'exact' });
    if (!error) {
        document.getElementById('stat-users').textContent = users?.length || 0;
    }

    const avgRating = allReviews.length > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : '0.0';
    document.getElementById('stat-avg').textContent = avgRating;
}
