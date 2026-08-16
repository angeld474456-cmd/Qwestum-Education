BEGIN;

INSERT INTO public.education_programs (code, name, country_code)
VALUES (
  'kz-school-general',
  'Общеобразовательная школа Казахстана',
  'KZ'
);

INSERT INTO public.disciplines (code, name)
VALUES
  ('literacy', 'Обучение грамоте'),
  ('literary-reading', 'Литературное чтение'),
  ('kazakh-language', 'Казахский язык'),
  ('kazakh-literature', 'Казахская литература'),
  ('russian-language', 'Русский язык'),
  ('russian-literature', 'Русская литература'),
  ('english-language', 'Английский язык'),
  ('mathematics', 'Математика'),
  ('algebra', 'Алгебра'),
  ('geometry', 'Геометрия'),
  ('digital-literacy', 'Цифровая грамотность'),
  ('computer-science', 'Информатика'),
  ('natural-science', 'Естествознание'),
  ('biology', 'Биология'),
  ('physics', 'Физика'),
  ('chemistry', 'Химия'),
  ('geography', 'География'),
  ('world-studies', 'Познание мира'),
  ('history-of-kazakhstan', 'История Казахстана'),
  ('world-history', 'Всемирная история'),
  ('music', 'Музыка'),
  ('visual-arts', 'Изобразительное искусство'),
  ('labor-education', 'Трудовое обучение'),
  ('artistic-labor', 'Художественный труд'),
  ('physical-education', 'Физическая культура'),
  ('literature', 'Литература');

COMMIT;
