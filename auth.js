// ============================================
// AUTHENTICATION LOGIC
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        showToast('Қате: ' + error.message);
        return;
    }

    showToast('Қош келдіңіз!');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (password !== confirm) {
        showToast('Құпия сөздер сәйкес келмейді');
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: name,
                avatar_url: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=4f46e5&color=fff'
            }
        }
    });

    if (error) {
        showToast('Қате: ' + error.message);
        return;
    }

    if (data.user) {
        await supabaseClient.from('users').insert([{
            id: data.user.id,
            name: name,
            email: email,
            role: 'student',
            created_at: new Date().toISOString()
        }]);
    }

    showToast('Тіркелу сәтті өтті! Email-ді растаңыз.');
    setTimeout(() => window.location.href = 'login.html', 2000);
}

async function loginWithGoogle() {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/index.html'
        }
    });

    if (error) {
        showToast('Қате: ' + error.message);
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
