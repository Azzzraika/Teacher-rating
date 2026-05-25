// ============================================
// ADMIN PANEL LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.admin-section')) {
        checkAdminAccess();
    }
});

function checkAdminAccess() {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session || !isAdmin(session.user)) {
            showToast('Рұқсат жоқ');
            window.location.href = 'index.html';
            return;
        }
        loadAdminData();
    });
}

function loadAdminData() {
    renderAdminTeachers();
    renderAdminReviews();
    renderAdminUsers();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    event.target.closest('.tab-btn').classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

function renderAdminTeachers() {
    const tbody = document.getElementById('admin-teachers-table');
    if (!tbody) return;

    tbody.innerHTML = allTeachers.map(t => {
        const avgRating = calculateAverageRating(t.id);
        const reviewCount = getReviewCount(t.id);

        return `
            <tr>
                <td><img src="${t.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(t.name) + '&background=4f46e5&color=fff'}" alt=""></td>
                <td>${t.name}</td>
                <td>${t.subject}</td>
                <td>${avgRating.toFixed(1)}</td>
                <td>${reviewCount}</td>
                <td>
                    <div class="table-actions">
                        <button onclick="editTeacher('${t.id}')" class="btn btn-secondary btn-sm">Өзгерту</button>
                        <button onclick="deleteTeacher('${t.id}')" class="btn btn-danger btn-sm">Жою</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAdminReviews() {
    const tbody = document.getElementById('admin-reviews-table');
    if (!tbody) return;

    tbody.innerHTML = allReviews.slice().reverse().map(r => {
        const teacher = allTeachers.find(t => t.id === r.teacher_id);

        return `
            <tr>
                <td>${teacher ? teacher.name : 'Жойылған'}</td>
                <td>${r.user_name}</td>
                <td>${r.rating} <i class="fas fa-star" style="color:var(--accent);"></i></td>
                <td>${r.text || '-'}</td>
                <td>${new Date(r.created_at).toLocaleDateString('kk-KZ')}</td>
                <td>
                    <button onclick="deleteReview('${r.id}')" class="btn btn-danger btn-sm">Жою</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function renderAdminUsers() {
    const tbody = document.getElementById('admin-users-table');
    if (!tbody) return;

    const { data: users, error } = await supabaseClient
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading users:', error);
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td><img src="${u.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name) + '&background=4f46e5&color=fff'}" alt=""></td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span class="teacher-subject">${u.role || 'student'}</span></td>
            <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('kk-KZ') : '-'}</td>
            <td>
                <button onclick="deleteUser('${u.id}')" class="btn btn-danger btn-sm">Жою</button>
            </td>
        </tr>
    `).join('');
}

// Teacher CRUD
function openAddTeacherModal() {
    document.getElementById('teacher-modal-title').textContent = 'Оқытушы қосу';
    document.getElementById('edit-teacher-id').value = '';
    document.getElementById('edit-name').value = '';
    document.getElementById('edit-subject').value = 'Математика';
    document.getElementById('edit-photo').value = '';
    document.getElementById('edit-bio').value = '';
    document.getElementById('teacher-edit-modal').classList.add('show');
}

function editTeacher(teacherId) {
    const teacher = allTeachers.find(t => t.id === teacherId);
    if (!teacher) return;

    document.getElementById('teacher-modal-title').textContent = 'Оқытушыны өзгерту';
    document.getElementById('edit-teacher-id').value = teacherId;
    document.getElementById('edit-name').value = teacher.name;
    document.getElementById('edit-subject').value = teacher.subject;
    document.getElementById('edit-photo').value = teacher.photo || '';
    document.getElementById('edit-bio').value = teacher.bio || '';
    document.getElementById('teacher-edit-modal').classList.add('show');
}

function closeTeacherEditModal() {
    document.getElementById('teacher-edit-modal').classList.remove('show');
}

async function saveTeacher(e) {
    e.preventDefault();
    const id = document.getElementById('edit-teacher-id').value;
    const teacher = {
        name: document.getElementById('edit-name').value,
        subject: document.getElementById('edit-subject').value,
        photo: document.getElementById('edit-photo').value,
        bio: document.getElementById('edit-bio').value
    };

    if (id) {
        const { error } = await supabaseClient.from('teachers').update(teacher).eq('id', id);
        if (!error) {
            showToast('Оқытушы жаңартылды');
            closeTeacherEditModal();
        }
    } else {
        const { error } = await supabaseClient.from('teachers').insert([teacher]);
        if (!error) {
            showToast('Оқытушы қосылды');
            closeTeacherEditModal();
        }
    }
}

async function deleteTeacher(teacherId) {
    if (!confirm('Оқытушыны жоюға сенімдісіз бе? Барлық пікірлер де жойылады.')) return;

    await supabaseClient.from('reviews').delete().eq('teacher_id', teacherId);
    const { error } = await supabaseClient.from('teachers').delete().eq('id', teacherId);

    if (!error) {
        showToast('Оқытушы жойылды');
    }
}

async function deleteUser(userId) {
    if (!confirm('Пайдаланушыны жоюға сенімдісіз бе?')) return;

    const { error } = await supabaseClient.from('users').delete().eq('id', userId);

    if (!error) {
        showToast('Пайдаланушы жойылды');
        renderAdminUsers();
    }
}
