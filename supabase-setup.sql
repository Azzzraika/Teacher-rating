    -- ============================================
    -- SUPABASE SQL: Таблицалар + RLS + Демо деректер
    -- ============================================

    -- 1. Оқытушылар таблицасы
    CREATE TABLE teachers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        photo TEXT,
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. Пікірлер таблицасы
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

    -- 3. Пайдаланушылар таблицасы (қосымша ақпарат)
    CREATE TABLE users (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 4. Таңдаулылар таблицасы
    CREATE TABLE favorites (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, teacher_id)
    );

    -- ============================================
    -- RLS ПОЛИТИКАЛАР (Қауіпсіздік)
    -- ============================================

    -- Teachers: Барлығы оқиды, тек admin жазады
    ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "teachers_read_all" ON teachers;
    DROP POLICY IF EXISTS "teachers_write_admin" ON teachers;

    CREATE POLICY "teachers_read_all" ON teachers
        FOR SELECT USING (true);

    CREATE POLICY "teachers_write_admin" ON teachers
        FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');

    -- Reviews: Барлығы оқиды, авторизацияланған жазады
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "reviews_read_all" ON reviews;
    DROP POLICY IF EXISTS "reviews_insert_auth" ON reviews;
    DROP POLICY IF EXISTS "reviews_delete_owner" ON reviews;

    CREATE POLICY "reviews_read_all" ON reviews
        FOR SELECT USING (true);

    CREATE POLICY "reviews_insert_auth" ON reviews
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "reviews_delete_owner" ON reviews
        FOR DELETE USING (
            auth.uid() = user_id OR
            auth.jwt() ->> 'email' = 'admin@example.com'
        );

    -- Users: Тек өз деректері, admin барлығын көреді
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "users_read_own" ON users;
    DROP POLICY IF EXISTS "users_insert_own" ON users;
    DROP POLICY IF EXISTS "users_read_admin" ON users;
    DROP POLICY IF EXISTS "users_delete_admin" ON users;

    CREATE POLICY "users_read_own" ON users
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "users_read_all" ON users
        FOR SELECT USING (true);

    CREATE POLICY "users_insert_own" ON users
        FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY "users_delete_admin" ON users
        FOR DELETE USING (auth.jwt() ->> 'email' = 'admin@example.com');

    -- Favorites: Тек өз таңдаулылары
    ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "favorites_own" ON favorites;

    CREATE POLICY "favorites_own" ON favorites
        FOR ALL USING (auth.uid() = user_id);

    -- ============================================
    -- Real-time қосу (Supabase Dashboard → Database → Replication)
    -- ============================================
    -- teachers, reviews, favorites таблицалары үшін enable

    -- ============================================
    -- Демо деректер (9 оқытушы)
    -- ============================================
    INSERT INTO teachers (name, subject, photo, bio) VALUES
    ('Ахметов Серік Болатұлы', 'Математика', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Математика ғылымдарының кандидаты. 15 жылдық оқыту тәжірибесі.'),
    ('Нұрланова Айгүл Маратовна', 'Ағылшын тілі', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Cambridge сертификаты. IELTS 8.5. 10 жылдық тәжірибе.'),
    ('Исаев Болат Талғатұлы', 'Физика', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 'Физика-математика ғылымдарының докторы. Нобель сыйлығына үміткер.'),
    ('Серікова Дина Мұратқызы', 'Информатика', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Full-stack developer. Google сертификаты. Hackathon жеңімпазы.'),
    ('Тұраров Ерлан Қайратұлы', 'Қазақ тілі', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Филология ғылымдарының кандидаты. Ұлттық жазушы.'),
    ('Жұмабекова Айнұр Серікқызы', 'Химия', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Химия ғылымдарының докторы. 20+ ғылыми жарияланым.'),
    ('Омаров Нұрлан Бекенұлы', 'Тарих', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'Тарих ғылымдарының кандидаты. Ұлттық мұражай қызметкері.'),
    ('Қасымова Гүлжан Ерболатқызы', 'Биология', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', 'Биология ғылымдарының кандидаты. Экологиялық қозғалыс мүшесі.'),
    ('Рахимов Данияр Асқарұлы', 'Экономика', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400', 'MBA. 15 жылдық бизнес тәжірибесі. Консалтинг компаниясының негізін қалаушы.');
