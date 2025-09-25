-- Initial seed data for PostgreSQL
-- Created: 2025-09-26

-- Insert default platforms
INSERT INTO platforms (name_en, name_cn, url, description, age_groups, enabled) VALUES
('National Geographic Kids', '国家地理儿童版', 'https://kids.nationalgeographic.com/', 'Explore nature, science, and world cultures', '["young", "older"]', true),
('Khan Academy Kids', '可汗学院儿童版', 'https://www.khanacademy.org/kids', 'Educational games and videos for young learners', '["preschool", "young"]', true),
('YouTube Kids', 'YouTube 儿童版', 'https://www.youtubekids.com/', 'Safe, educational videos curated for children', '["young", "older"]', true)
ON CONFLICT (url) DO NOTHING;

-- Insert question templates
INSERT INTO question_templates (type, subject, difficulty, content, options, correct_answer, explanation_en, explanation_cn, language, age_groups, tags, enabled) VALUES
('calculation', 'math', 'beginner', 'What is 2 + 3?', NULL, '5', '2 + 3 = 5. This is basic addition.', '2 + 3 = 5。这是基本的加法。', 'en', '["preschool", "young"]', '["math", "addition", "beginner"]', true),
('multiple-choice', 'english', 'easy', 'What color is the sky?', '["Blue", "Green", "Red", "Yellow"]', 'Blue', 'The sky is usually blue during the day due to light scattering.', '天空通常是蓝色的，因为光线散射。', 'en', '["preschool", "young"]', '["english", "colors", "easy"]', true),
('multiple-choice', 'math', 'easy', 'What is 5 - 2?', '["2", "3", "4", "5"]', '3', '5 - 2 = 3. This is basic subtraction.', '5 - 2 = 3。这是基本的减法。', 'en', '["preschool", "young"]', '["math", "subtraction", "easy"]', true),
('true-false', 'science', 'easy', 'The sun rises in the east.', NULL, 'true', 'Yes, the sun always rises in the east and sets in the west.', '是的，太阳总是从东方升起，从西方落下。', 'en', '["young", "older"]', '["science", "astronomy", "easy"]', true),
('fill-blank', 'english', 'medium', 'The capital of France is _____.', NULL, 'Paris', 'Paris is the capital and largest city of France.', '巴黎是法国的首都和最大城市。', 'en', '["older", "teen"]', '["english", "geography", "medium"]', true)
ON CONFLICT (content, subject) DO NOTHING;
