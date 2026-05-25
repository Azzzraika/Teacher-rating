// ============================================
// MAIN APPLICATION LOGIC
// ============================================

let currentUser = null;
let allTeachers = [];
let allReviews = [];
let currentTeacherId = null;
let selectedRating = 0;
let favorites = [];
let teachersSubscription = null;
let reviewsSubscription = null;

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    loadTeachers();
    loadReviews();
    initStarRating();
});

// ========== AUTH ==========
function initAuth() {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            currentUser = session.user;
            updateUI();
            loadFavorites();
        }
    });

    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session ? session.user : null;
        updateUI();
        if (currentUser) {
            loadFavorites();
        }
    });
}

function updateUI() {
    const userInfo = document.getElementById('user-info');
    const authButtons = document.getElementById('auth-buttons');
    const adminLink = document.getElementById('admin-link');
    const mobileAdminLink = document.getElementById('mobile-admin-link');

    if (currentUser) {
        userInfo.style.display = 'flex';
        authButtons.style.display = 'none';
        document.getElementById('user-name').textContent = 
            currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        document.getElementById('user-avatar').src = 
            currentUser.user_metadata?.avatar_url || 
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.email) + '&background=4f46e5&color=fff';

        if (isAdmin(currentUser)) {
            if (adminLink) adminLink.style.display = 'flex';
            if (mobileAdminLink) mobileAdminLink.style.display = 'flex';
        }
    } else {
        userInfo.style.display = 'none';
        authButtons.style.display = 'flex';
        if (adminLink) adminLink.style.display = 'none';
        if (mobileAdminLink) mobileAdminLink.style.display = 'none';
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    showToast('Сіз шықтыңыз');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

// ========== TEACHERS ==========
async function loadTeachers() {
    if (teachersSubscription) {
        teachersSubscription.unsubscribe();
    }

    const { data, error } = await supabaseClient
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading teachers:', error);
        return;
    }

    allTeachers = data.map(t => ({ id: t.id, ...t }));
    renderTeachers(allTeachers);
    updateStats();

    teachersSubscription = supabaseClient
        .channel('teachers-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
            loadTeachers();
        })
        .subscribe();
}

// ========== REVIEWS ==========
async function loadReviews() {
    if (reviewsSubscription) {
        reviewsSubscription.unsubscribe();
    }

    const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading reviews:', error);
        return;
    }

    allReviews = data.map(r => ({ id: r.id, ...r }));
    updateStats();

    reviewsSubscription = supabaseClient
        .channel('reviews-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
            loadReviews();
        })
        .subscribe();
}

// ========== RENDER ==========
function renderTeachers(teachers) {
    const grid = document.getElementById('teachers-grid');
    if (!grid) return;

    if (teachers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-search"></i>
                <h3>Ештеңе табылмады</h3>
                <p>Басқа іздеу сұранысыңызды енгізіңіз</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = teachers.map(teacher => {
        const avgRating = calculateAverageRating(teacher.id);
        const reviewCount = getReviewCount(teacher.id);
        const isFav = favorites.includes(teacher.id);

        return `
            <div class="teacher-card" onclick="openTeacherDetail('${teacher.id}')">
                <div class="teacher-card-header">
                    <img src="${teacher.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(teacher.name) + '&background=4f46e5&color=fff&size=128'}" 
                         alt="${teacher.name}" class="teacher-avatar">
                    <button class="teacher-fav-btn ${isFav ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleFavorite('${teacher.id}')">
                        <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
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

    document.getElementById('results-count').textContent = teachers.length + ' нәтиже';
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= Math.round(rating) ? 'filled' : ''}"><i class="fas fa-star"></i></span>`;
    }
    return stars;
}

function calculateAverageRating(teacherId) {
    const teacherReviews = allReviews.filter(r => r.teacher_id === teacherId);
    if (teacherReviews.length === 0) return 0;
    return teacherReviews.reduce((sum, r) => sum + r.rating, 0) / teacherReviews.length;
}

function getReviewCount(teacherId) {
    return allReviews.filter(r => r.teacher_id === teacherId).length;
}

// ========== FILTER ==========
function filterTeachers() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const subject = document.getElementById('subject-filter').value;
    const sort = document.getElementById('sort-filter').value;

    let filtered = allTeachers.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(search) || 
                           t.subject.toLowerCase().includes(search);
        const matchSubject = !subject || t.subject === subject;
        return matchSearch && matchSubject;
    });

    filtered.sort((a, b) => {
        switch(sort) {
            case 'rating-desc': return calculateAverageRating(b.id) - calculateAverageRating(a.id);
            case 'rating-asc': return calculateAverageRating(a.id) - calculateAverageRating(b.id);
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'reviews': return getReviewCount(b.id) - getReviewCount(a.id);
            default: return 0;
        }
    });

    renderTeachers(filtered);
}

// ========== TEACHER DETAIL ==========
function openTeacherDetail(teacherId) {
    const teacher = allTeachers.find(t => t.id === teacherId);
    if (!teacher) return;

    currentTeacherId = teacherId;
    const avgRating = calculateAverageRating(teacherId);
    const teacherReviews = allReviews.filter(r => r.teacher_id === teacherId);
    const isFav = favorites.includes(teacherId);

    const ratingBreakdown = {};
    for (let i = 1; i <= 5; i++) ratingBreakdown[i] = 0;
    teacherReviews.forEach(r => ratingBreakdown[r.rating]++);
    const maxCount = Math.max(...Object.values(ratingBreakdown), 1);

    const detailHTML = `
        <div class="teacher-detail-header">
            <img src="${teacher.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(teacher.name) + '&background=4f46e5&color=fff&size=200'}" 
                 alt="${teacher.name}" class="teacher-detail-avatar">
            <h2 class="teacher-detail-name">${teacher.name}</h2>
            <p class="teacher-detail-subject">${teacher.subject}</p>
            <div class="teacher-detail-rating">
                <div class="stars">${renderStars(avgRating)}</div>
                <span class="rating-value">${avgRating.toFixed(1)}</span>
                <span class="rating-count">(${teacherReviews.length} пікір)</span>
            </div>
        </div>
        <div class="teacher-detail-body">
            <div class="detail-section">
                <h4>Туралы</h4>
                <p class="teacher-bio">${teacher.bio || 'Ақпарат жоқ'}</p>
            </div>
            <div class="detail-section">
                <h4>Баға бөлінуі</h4>
                <div class="rating-breakdown">
                    ${[5,4,3,2,1].map(star => `
                        <div class="rating-bar">
                            <span class="rating-bar-label">${star} жұлд</span>
                            <div class="rating-bar-track">
                                <div class="rating-bar-fill" style="width: ${(ratingBreakdown[star] / maxCount * 100) || 0}%"></div>
                            </div>
                            <span class="rating-bar-count">${ratingBreakdown[star]}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="detail-section">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <h4>Пікірлер (${teacherReviews.length})</h4>
                    ${currentUser ? `<button onclick="openRatingModal()" class="btn btn-primary btn-sm"><i class="fas fa-pen"></i> Пікір жазу</button>` : ''}
                </div>
                <div class="reviews-list" id="reviews-list">
                    ${teacherReviews.length === 0 ? '<p style="color:var(--gray-500); text-align:center; padding:2rem;">Әлі пікір жоқ. Бірінші болып пікір қалдырыңыз!</p>' : ''}
                    ${teacherReviews.map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="review-author">
                                    <img src="${review.user_photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.user_name) + '&background=4f46e5&color=fff'}" alt="">
                                    <span>${review.user_name}</span>
                                </div>
                                <span class="review-date">${new Date(review.created_at).toLocaleDateString('kk-KZ')}</span>
                            </div>
                            <div class="review-rating">${renderStars(review.rating)}</div>
                            <p class="review-text">${review.text || 'Баға берілді'}</p>
                            ${currentUser && (currentUser.id === review.user_id || isAdmin(currentUser)) ? `
                                <div class="review-actions">
                                    <button onclick="deleteReview('${review.id}')" class="btn btn-danger btn-sm">Жою</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('teacher-detail').innerHTML = detailHTML;
    document.getElementById('teacher-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('teacher-modal').classList.remove('show');
    document.body.style.overflow = '';
    currentTeacherId = null;
}

// ========== RATING MODAL ==========
function openRatingModal() {
    if (!currentUser) {
        showToast('Пікір қалдыру үшін кіріңіз');
        return;
    }
    document.getElementById('rating-modal').classList.add('show');
    selectedRating = 0;
    updateStarDisplay();
    document.getElementById('review-text').value = '';
}

function closeRatingModal() {
    document.getElementById('rating-modal').classList.remove('show');
}

function initStarRating() {
    const stars = document.querySelectorAll('.star-rating-input .star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.value);
            updateStarDisplay();
        });
        star.addEventListener('mouseenter', function() {
            const val = parseInt(this.dataset.value);
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < val);
            });
        });
    });

    document.querySelector('.star-rating-input')?.addEventListener('mouseleave', updateStarDisplay);
}

function updateStarDisplay() {
    const stars = document.querySelectorAll('.star-rating-input .star');
    stars.forEach((star, i) => {
        star.classList.toggle('active', i < selectedRating);
    });
}

async function submitReview() {
    if (!currentUser) {
        showToast('Кіру керек');
        return;
    }
    if (selectedRating === 0) {
        showToast('Жұлдыздарды таңдаңыз');
        return;
    }

    const text = document.getElementById('review-text').value;
    const review = {
        teacher_id: currentTeacherId,
        user_id: currentUser.id,
        user_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
        user_photo: currentUser.user_metadata?.avatar_url || '',
        rating: selectedRating,
        text: text
    };

    const { error } = await supabaseClient.from('reviews').insert([review]);

    if (error) {
        showToast('Қате: ' + error.message);
        return;
    }

    showToast('Пікір сақталды!');
    closeRatingModal();
    openTeacherDetail(currentTeacherId);
}

async function deleteReview(reviewId) {
    if (!confirm('Пікірді жоюға сенімдісіз бе?')) return;

    const { error } = await supabaseClient.from('reviews').delete().eq('id', reviewId);

    if (error) {
        showToast('Қате: ' + error.message);
        return;
    }

    showToast('Пікір жойылды');
    openTeacherDetail(currentTeacherId);
}

// ========== FAVORITES ==========
async function toggleFavorite(teacherId) {
    if (!currentUser) {
        showToast('Таңдаулыларға қосу үшін кіріңіз');
        return;
    }

    const index = favorites.indexOf(teacherId);

    if (index > -1) {
        const { error } = await supabaseClient
            .from('favorites')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('teacher_id', teacherId);

        if (!error) {
            favorites.splice(index, 1);
            showToast('Таңдаулылардан алынды');
        }
    } else {
        const { error } = await supabaseClient
            .from('favorites')
            .insert([{ user_id: currentUser.id, teacher_id: teacherId }]);

        if (!error) {
            favorites.push(teacherId);
            showToast('Таңдаулыларға қосылды');
        }
    }

    filterTeachers();
}

async function loadFavorites() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from('favorites')
        .select('teacher_id')
        .eq('user_id', currentUser.id);

    if (!error && data) {
        favorites = data.map(f => f.teacher_id);
        filterTeachers();
    }
}

// ========== STATS ==========
function updateStats() {
    const totalTeachers = allTeachers.length;
    const totalReviews = allReviews.length;

    document.getElementById('total-teachers') && (document.getElementById('total-teachers').textContent = totalTeachers);
    document.getElementById('total-reviews') && (document.getElementById('total-reviews').textContent = totalReviews);
    document.getElementById('total-students') && (document.getElementById('total-students').textContent = '150+');
}

// ========== TOAST ==========
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== MOBILE MENU ==========
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('show');
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
        closeRatingModal();
    }
}
