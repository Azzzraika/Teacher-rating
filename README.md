# 🎓 College Teacher Rating System

Студенттер оқытушыларды бағалайтын және пікір қалдыратын веб-платформа. Supabase Backend.

## 📋 Мазмұны

- [Функциялар](#-функциялар)
- [Технологиялар](#-технологиялар)
- [Supabase орнату](#-supabase-орнату)
- [Жоба құрылымы](#-жоба-құрылымы)
- [Деплой](#-деплой)

## ✨ Функциялар

### Негізгі:
- ✅ **Тіркелу/Кіру** — Email/құпия сөз + Google OAuth
- ✅ **Оқытушылар тізімі** — Карточкалар түрінде
- ✅ **Рейтинг жүйесі** — 1-5 жұлдыз
- ✅ **Пікір CRUD** — Құру, оқу, жою
- ✅ **Іздеу/Сүзгі** — Аты, пән бойынша + сұрыптау
- ✅ **Таңдаулылар** — Жүрек белгішесі
- ✅ **Админ панелі** — CRUD барлық деректер үшін

### Қосымша:
- 🔄 **Realtime** — Supabase Realtime арқылы лездік жаңартулар
- 📊 **Аналитика** — Chart.js диаграммалары (ТОП-5, пәндер, динамика)
- 🔔 **Хабарландыру** — Toast notifications
- 📱 **Адаптивті** — Барлық құрылғыларға

## 🛠 Технологиялар

| Технология | Назначение |
|-----------|-----------|
| HTML5/CSS3 | Frontend |
| Vanilla JS | Логика |
| Supabase | Backend (Auth + PostgreSQL + Realtime) |
| Chart.js | Диаграммалар |
| Font Awesome | Иконкалар |

## 🚀 Supabase орнату

### 1. Жоба құру
[supabase.com](https://supabase.com) → New Project

### 2. Authentication қосу
Dashboard → Authentication → Providers:
- **Email** → Enabled
- **Google** → Enabled (Client ID + Secret)

### 3. Database таблицаларын құру
SQL Editor → New query → `supabase-setup.sql` файлын жіберу:

```sql
-- Таблица: teachers
CREATE TABLE teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    photo TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: reviews
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_photo TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: users (қосымша ақпарат)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: favorites
CREATE TABLE favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, teacher_id)
);

-- RLS Политикалар
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers_read_all" ON teachers FOR SELECT USING (true);
CREATE POLICY "teachers_write_admin" ON teachers FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_read_all" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_auth" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_delete_owner" ON reviews FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_read_admin" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Realtime қосу (Dashboard → Database → Replication)
-- teachers, reviews, favorites үшін enable

-- Демо деректер
INSERT INTO teachers (name, subject, photo, bio) VALUES
('Ахметов Серік Болатұлы', 'Математика', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Математика ғылымдарының кандидаты. 15 жылдық тәжірибе.'),
('Нұрланова Айгүл Маратовна', 'Ағылшын тілі', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Cambridge сертификаты. IELTS 8.5.'),
('Исаев Болат Талғатұлы', 'Физика', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 'Физика-математика ғылымдарының докторы.'),
('Серікова Дина Мұратқызы', 'Информатика', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Full-stack developer. Google сертификаты.'),
('Тұраров Ерлан Қайратұлы', 'Қазақ тілі', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Филология ғылымдарының кандидаты.'),
('Жұмабекова Айнұр Серікқызы', 'Химия', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Химия ғылымдарының докторы.'),
('Омаров Нұрлан Бекенұлы', 'Тарих', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Тарих ғылымдарының кандидаты.'),
('Қасымова Гүлжан Ерболатқызы', 'Биология', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', 'Биология ғылымдарының кандидаты.'),
('Рахимов Данияр Асқарұлы', 'Экономика', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400', 'MBA. 15 жылдық бизнес тәжірибесі.');
```

### 4. Конфигурация
`supabase-config.js` файлында өз деректеріңізді енгізіңіз:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

**Қайдан алу:** Supabase Dashboard → Settings → API → Project URL / anon public

### 5. Жергілікті іске қосу

```bash
# Live Server (VS Code кеңейтімі)
# Немесе:
npx serve .

# Содан кейін браузерде: http://localhost:3000
```

## 📁 Жоба құрылымы

```
teacher-rating-system/
├── index.html          # Басты бет
├── login.html          # Кіру
├── register.html       # Тіркелу
├── favorites.html      # Таңдаулылар
├── analytics.html      # Аналитика
├── admin.html          # Админ панелі
├── styles.css          # Барлық стильдер
├── supabase-config.js  # Supabase конфигурация
├── app.js              # Негізгі логика
├── auth.js             # Аутентификация
├── favorites.js        # Таңдаулылар
├── analytics.js        # Диаграммалар
├── admin.js            # Админ CRUD
├── supabase-setup.sql  # Деректер базасы SQL
└── README.md           # Құжаттама
```

## 🌐 Деплой

### GitHub Pages:
1. Репозиторийді public ету
2. Settings → Pages → Source: main branch
3. `https://username.github.io/repo-name`

### Netlify:
1. Жобаны GitHub-қа жүктеу
2. [netlify.com](https://netlify.com) → Import from GitHub
3. Auto-deploy

### Vercel:
```bash
npm i -g vercel
vercel --prod
```

## 📝 License

MIT License — Академиялық мақсаттар үшін.
#   T e a c h e r - r a t i n g  
 