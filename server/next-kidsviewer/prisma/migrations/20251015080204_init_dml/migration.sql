-- Insert initial platform data based on MockAPIService.ts
INSERT INTO "t_platform" ("name_en", "name_cn", "url", "description", "age_groups", "is_active", "create_date", "update_date") VALUES
('National Geographic Kids', '国家地理儿童版', 'https://kids.nationalgeographic.com/', 'Explore nature, science, and world cultures', ARRAY['young', 'older'], true, NOW(), NOW()),
('Khan Academy Kids', '可汗学院儿童版', 'https://www.khanacademy.org/kids', 'Educational games and videos for young learners', ARRAY['preschool', 'young'], true, NOW(), NOW()),
('YouTube Kids', 'YouTube 儿童版', 'https://www.youtubekids.com/', 'Safe, educational videos curated for children', ARRAY['young', 'older'], true, NOW(), NOW()),
('Douyin', '抖音', 'https://www.douyin.com/', 'Safe, educational videos curated for children', ARRAY['young', 'older'], true, NOW(), NOW()),
('Xiaohongshu', '小红书', 'https://www.xiaohongshu.com/', 'Safe, educational videos curated for children', ARRAY['older'], true, NOW(), NOW()),
('Kuaishou', '快手', 'https://www.kuaishou.com/', 'Safe, educational videos curated for children', ARRAY['young', 'older'], true, NOW(), NOW()),
('Bilibili', '哔哩哔哩', 'https://www.bilibili.com/', 'Safe, educational videos curated for children', ARRAY['older'], true, NOW(), NOW()),
('Qiyiguo', '奇异果', 'https://www.qiyiguo.com/', 'Safe, educational videos curated for children', ARRAY['preschool', 'young', 'older'], true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert initial question data based on MockAPIService.ts
INSERT INTO "t_question" ("type", "subject", "difficulty", "content", "options", "correct_answer", "explanation_en", "explanation_cn", "language", "age_groups", "tags", "is_active", "create_date", "update_date") VALUES
-- Math questions - Beginner level
('calculation', 'math', 'beginner', 'What is 2 + 3?', NULL, '5', '2 + 3 = 5. This is basic addition.', '2 + 3 = 5。这是基本的加法。', 'en', ARRAY['preschool', 'young'], ARRAY['math', 'addition', 'beginner'], true, NOW(), NOW()),

-- Math questions - Easy level
('calculation', 'math', 'easy', 'What is 7 + 5?', NULL, '12', '7 + 5 = 12. Count up from 7: 8, 9, 10, 11, 12.', '7 + 5 = 12。从7开始数：8、9、10、11、12。', 'en', ARRAY['young'], ARRAY['math', 'addition', 'easy'], true, NOW(), NOW()),

-- Math questions - Medium level
('calculation', 'math', 'medium', 'What is 18 ÷ 3?', NULL, '6', '18 ÷ 3 = 6. Division means how many groups of 3 can we make from 18.', '18 ÷ 3 = 6。除法意思是18可以分成多少个3。', 'en', ARRAY['young', 'older'], ARRAY['math', 'division', 'medium'], true, NOW(), NOW()),

-- Math questions - Hard level
('calculation', 'math', 'hard', 'What is 4 × 5 + 3?', NULL, '23', '4 × 5 + 3 = 23. First multiply: 4 × 5 = 20, then add: 20 + 3 = 23.', '4 × 5 + 3 = 23。先乘法：4 × 5 = 20，再加法：20 + 3 = 23。', 'en', ARRAY['older'], ARRAY['math', 'multiplication', 'addition', 'hard'], true, NOW(), NOW()),

-- Math questions - Expert level
('multiple-choice', 'math', 'expert', 'What is 3² + 4²?', ARRAY['7', '12', '25', '49'], '25', '3² + 4² = 9 + 16 = 25. This uses the Pythagorean theorem.', '3² + 4² = 9 + 16 = 25。这使用了勾股定理。', 'en', ARRAY['older', 'teen'], ARRAY['math', 'squares', 'expert'], true, NOW(), NOW()),

-- Chinese questions
('multiple-choice', 'chinese', 'easy', '识别大写数字：壹', ARRAY['1', '2', '3', '4'], '1', '壹 = 1 (Chinese traditional number)', '壹 = 1 (中文大写数字)', 'zh', ARRAY['young', 'older'], ARRAY['chinese', 'numbers', 'easy'], true, NOW(), NOW()),

-- English questions
('multiple-choice', 'english', 'easy', 'What color is the sky?', ARRAY['Blue', 'Green', 'Red', 'Yellow'], 'Blue', 'The sky is usually blue during the day due to light scattering.', '天空通常是蓝色的，因为光线散射。', 'en', ARRAY['preschool', 'young'], ARRAY['english', 'colors', 'easy'], true, NOW(), NOW()),

-- Additional math questions
('calculation', 'math', 'easy', 'What is 9 - 3?', NULL, '6', '9 - 3 = 6. Subtraction means taking away.', '9 - 3 = 6。减法意思是拿走。', 'en', ARRAY['young'], ARRAY['math', 'subtraction', 'easy'], true, NOW(), NOW()),

('calculation', 'math', 'easy', 'What is 4 × 6?', NULL, '24', '4 × 6 = 24. Multiplication means repeated addition.', '4 × 6 = 24。乘法意思是重复加法。', 'en', ARRAY['young'], ARRAY['math', 'multiplication', 'easy'], true, NOW(), NOW()),

('multiple-choice', 'math', 'easy', 'Which number comes after 15?', ARRAY['14', '16', '17', '18'], '16', 'The number after 15 is 16.', '15后面的数字是16。', 'en', ARRAY['young'], ARRAY['math', 'counting', 'easy'], true, NOW(), NOW()),

('calculation', 'math', 'easy', 'What is 10 + 2?', NULL, '12', '10 + 2 = 12. Adding 2 to 10 gives 12.', '10 + 2 = 12。10加2等于12。', 'en', ARRAY['young'], ARRAY['math', 'addition', 'easy'], true, NOW(), NOW()),

-- More Chinese questions
('multiple-choice', 'chinese', 'easy', '识别大写数字：贰', ARRAY['1', '2', '3', '4'], '2', '贰 = 2 (Chinese traditional number)', '贰 = 2 (中文大写数字)', 'zh', ARRAY['young', 'older'], ARRAY['chinese', 'numbers', 'easy'], true, NOW(), NOW()),

('multiple-choice', 'chinese', 'easy', '识别大写数字：叁', ARRAY['1', '2', '3', '4'], '3', '叁 = 3 (Chinese traditional number)', '叁 = 3 (中文大写数字)', 'zh', ARRAY['young', 'older'], ARRAY['chinese', 'numbers', 'easy'], true, NOW(), NOW()),

-- More English questions
('multiple-choice', 'english', 'easy', 'How many fingers do you have?', ARRAY['8', '9', '10', '11'], '10', 'You have 10 fingers (5 on each hand)', '你有10个手指（每只手5个）', 'en', ARRAY['preschool', 'young'], ARRAY['english', 'counting', 'easy'], true, NOW(), NOW())

ON CONFLICT DO NOTHING;

-- Insert initial person data based on MockAPIService.ts
-- Note: This assumes there's already a user with id=1 (parental user)
-- You may need to adjust the user_id and parental_id based on your actual user data

INSERT INTO "t_person" ( "user_id", "parental_id", "name", "alias", "age_group", "avatar", "difficulty", "max_daily_time", "parental_password", "settings", "statistics", "is_active", "create_date", "update_date" )
VALUES (
    1, -- user_id (assuming parental user has id=1)
    1, -- parental_id (same as user_id for parental user)
    'Barry', 
    'Barry', 
    'young', 
    NULL, 
    'easy', 
    120, -- max_daily_time in minutes
    '123456', -- parental_password
    '{
        "perTimeLimitMinutes": 20,
        "dailyTimeLimitMinutes": 120,
        "questionCount": 3,
        "questionsPerDay": 15,
        "subjects": [
            {"id": 1, "name": "Math", "enabled": true, "difficulty": "easy"},
            {"id": 2, "name": "Chinese", "enabled": true, "difficulty": "easy"},
            {"id": 3, "name": "English", "enabled": true, "difficulty": "easy"}
        ],
        "platformIds": [1, 2, 3]
    }'::jsonb,
    '{
        "dailyUsage": [],
        "questionStats": {
            "totalAnswered": 15,
            "totalCorrect": 12,
            "accuracyRate": 80,
            "subjectPreference": {},
            "repeatedQuestions": []
        },
        "learningProgress": {
            "subjects": {},
            "overallScore": 75,
            "level": "beginner"
        }
    }'::jsonb,
    true, 
    NOW(), 
    NOW()
) ON CONFLICT DO NOTHING;
