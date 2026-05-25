// ============================================
// FAVORITES PAGE LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('favorites-grid')) {
        loadFavoriteTeachers();
    }
});

async function loadFavoriteTeachers() {
    if (!currentUser) {
        document.getElementById('favorites-grid').innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-lock"></i>
                <h3>Кіру керек</h3>
                <p>Таңдаулыларды көру үшін аккаунтқа кіріңіз</p>
                <a href="login.html" class="btn btn-primary">Кіру</a>
            </div>
        `;
        return;
    }

    const { data: favData, error: favError } = await supabaseClient
        .from('favorites')
        .select('teacher_id')
        .eq('user_id', currentUser.id);

    if (favError) {
        console.error('Error loading favorites:', favError);
        return;
    }

    const favIds = favData.map(f => f.teacher_id);
    document.getElementById('fav-count').textContent = favIds.length + ' оқытушы';

    if (favIds.length === 0) {
        document.getElementById('favorites-grid').innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-heart-broken"></i>
                <h3>Таңдаулылар бос</h3>
                <p>Оқытушыларды таңдаулыларға қосу үшін жүрек белгішесін басыңыз</p>
                <a href="index.html" class="btn btn-primary">Оқытушыларды қарау</a>
            </div>
        `;
        return;
    }

    const favTeachers = allTeachers.filter(t => favIds.includes(t.id));
    renderFavorites(favTeachers);
}

function renderFavorites(teachers) {
    const grid = document.getElementById('favorites-grid');
    grid.innerHTML = teachers.map(teacher => {
        const avgRating = calculateAverageRating(teacher.id);
        const reviewCount = getReviewCount(teacher.id);

        return `
            <div class="teacher-card" onclick="openTeacherDetail('${teacher.id}')">
                <div class="teacher-card-header">
                    <img src="${teacher.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(teacher.name) + '&background=4f46e5&color=fff&size=128'}" 
                         alt="${teacher.name}" class="teacher-avatar">
                    <button class="teacher-fav-btn active" 
                            onclick="event.stopPropagation(); toggleFavorite('${teacher.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="teacher-card-body">
                    <h3 class="teacher-name">${teacher.name}</h3>
                    <span class="teacher-subject">${teacher.subject}</span>
                    <div class="teacher-rating">
                        <div class="stars">${renderStars(avgRating)}</div>
                        <span class="rating-value">${avgRating.toFixed(1)}</span>
                    </div>
                    <span class="rating-count">${reviewCount} пікір</span>
                    <div class="teacher-stats">
                        <div class="teacher-stat">
                            <span class="teacher-stat-value">${reviewCount}</span>
                            <span class="teacher-stat-label">Пікір</span>
                        </div>
                        <div class="teacher-stat">
                            <span class="teacher-stat-value">${avgRating.toFixed(1)}</span>
                            <span class="teacher-stat-label">Рейтинг</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
