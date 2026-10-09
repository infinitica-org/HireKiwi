-- CreateTable
CREATE TABLE "education_degrees" (
    "id" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_degrees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_specializations" (
    "id" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_specializations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "education_degrees_level_sort_order_idx" ON "education_degrees"("level", "sort_order");

-- CreateIndex
CREATE INDEX "education_specializations_category_sort_order_idx" ON "education_specializations"("category", "sort_order");

-- Seed: catalog rows ship with the schema so every environment gets them on `migrate deploy`.
-- Source of truth: prisma/data/degrees.json and prisma/data/specializations.json
-- (prisma/seed-education-catalog.ts re-syncs them idempotently).

INSERT INTO "education_degrees" ("id", "name", "full_name", "level", "sort_order") VALUES
  ('D01', '10th / SSLC', 'Secondary School Certificate (10th, SSLC, Matriculation)', 'School', 0),
  ('D02', '12th / HSC', 'Higher Secondary Certificate (12th, Intermediate, PUC)', 'School', 1),
  ('D03', 'ITI', 'Industrial Training Institute Certificate (IT / computer trades)', 'Vocational / Diploma', 2),
  ('D04', 'Diploma', 'Diploma in Computer Engineering / IT (Polytechnic)', 'Vocational / Diploma', 3),
  ('D05', 'PG Diploma', 'Post Graduate Diploma in Computer Applications / IT (PGDCA and similar)', 'Vocational / Diploma', 4),
  ('D06', 'BCA', 'Bachelor of Computer Applications', 'Undergraduate', 5),
  ('D07', 'B.Sc', 'Bachelor of Science (Computer Science / IT / Data Science and similar)', 'Undergraduate', 6),
  ('D08', 'B.Tech', 'Bachelor of Technology (CSE / IT and related)', 'Undergraduate', 7),
  ('D09', 'B.E', 'Bachelor of Engineering (CSE / IT and related)', 'Undergraduate', 8),
  ('D10', 'B.Voc', 'Bachelor of Vocation (Software Development)', 'Undergraduate', 9),
  ('D11', 'MCA', 'Master of Computer Applications', 'Postgraduate', 10),
  ('D12', 'M.Sc', 'Master of Science (Computer Science / IT / Data Science and similar)', 'Postgraduate', 11),
  ('D13', 'M.Tech', 'Master of Technology (CSE / IT and related)', 'Postgraduate', 12),
  ('D14', 'M.E.', 'Master of Engineering (CSE / IT and related)', 'Postgraduate', 13),
  ('D15', 'M.Phil', 'Master of Philosophy (Computer Science / IT)', 'Doctorate / Research', 14),
  ('D16', 'Ph.D', 'Doctor of Philosophy (Computer Science / IT)', 'Doctorate / Research', 15),
  ('D17', 'B.Com', 'Bachelor of Commerce (General / Hons)', 'Undergraduate', 16),
  ('D18', 'B.Com (CA)', 'Bachelor of Commerce (Computer Applications)', 'Undergraduate', 17),
  ('D19', 'BBA', 'Bachelor of Business Administration', 'Undergraduate', 18),
  ('D20', 'M.Com', 'Master of Commerce', 'Postgraduate', 19),
  ('D21', 'MBA', 'Master of Business Administration (IT / Business Analytics)', 'Postgraduate', 20),
  ('D22', 'PGDM', 'Post Graduate Diploma in Management (IT / Analytics)', 'Postgraduate', 21),
  ('D23', 'CA / CMA / CS', 'Professional qualifications (Chartered Accountant, Cost & Management Accountant, Company Secretary)', 'Professional', 22),
  ('D24', 'Other', 'Other (please specify)', 'Other', 23)
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "full_name" = EXCLUDED."full_name", "level" = EXCLUDED."level", "sort_order" = EXCLUDED."sort_order";

INSERT INTO "education_specializations" ("id", "name", "category", "sort_order") VALUES
  ('S01', 'Computer Science', 'Core Computing', 0),
  ('S02', 'Information Technology', 'Core Computing', 1),
  ('S03', 'Computer Applications', 'Core Computing', 2),
  ('S04', 'Software Engineering', 'Core Computing', 3),
  ('S05', 'Full Stack Development', 'Software & Development', 4),
  ('S06', 'Web Development', 'Software & Development', 5),
  ('S07', 'Mobile App Development', 'Software & Development', 6),
  ('S08', 'Software Testing', 'Software & Development', 7),
  ('S09', 'DevOps', 'Software & Development', 8),
  ('S10', 'Artificial Intelligence', 'AI & Data', 9),
  ('S11', 'Machine Learning', 'AI & Data', 10),
  ('S12', 'Deep Learning', 'AI & Data', 11),
  ('S13', 'Generative AI', 'AI & Data', 12),
  ('S14', 'Natural Language Processing (NLP)', 'AI & Data', 13),
  ('S15', 'Computer Vision', 'AI & Data', 14),
  ('S16', 'Data Science', 'AI & Data', 15),
  ('S17', 'Data Analytics', 'AI & Data', 16),
  ('S18', 'Big Data', 'AI & Data', 17),
  ('S19', 'Data Engineering', 'AI & Data', 18),
  ('S20', 'Cyber Security', 'Security', 19),
  ('S21', 'Network Security', 'Security', 20),
  ('S22', 'Information Security', 'Security', 21),
  ('S23', 'Ethical Hacking', 'Security', 22),
  ('S24', 'Digital Forensics', 'Security', 23),
  ('S25', 'Cloud Computing', 'Cloud, Networks & Systems', 24),
  ('S26', 'Computer Networks', 'Cloud, Networks & Systems', 25),
  ('S27', 'Database Systems', 'Cloud, Networks & Systems', 26),
  ('S28', 'Distributed Systems', 'Cloud, Networks & Systems', 27),
  ('S29', 'Internet of Things (IoT)', 'Cloud, Networks & Systems', 28),
  ('S30', 'Embedded Systems', 'Cloud, Networks & Systems', 29),
  ('S31', 'AI & Data Science (AI&DS)', 'General / Trending Branches', 30),
  ('S32', 'AI & Machine Learning (AIML)', 'General / Trending Branches', 31),
  ('S33', 'Computer Science & Engineering (CSE)', 'General / Trending Branches', 32),
  ('S34', 'CSE (Artificial Intelligence & Machine Learning)', 'General / Trending Branches', 33),
  ('S35', 'CSE (Data Science)', 'General / Trending Branches', 34),
  ('S36', 'CSE (Cyber Security)', 'General / Trending Branches', 35),
  ('S37', 'CSE (IoT)', 'General / Trending Branches', 36),
  ('S38', 'Information Science & Engineering (ISE)', 'General / Trending Branches', 37),
  ('S39', 'Computer Science & Business Systems (CSBS)', 'General / Trending Branches', 38),
  ('S40', 'Blockchain Technology', 'Emerging Technologies', 39),
  ('S41', 'Robotics & Automation', 'Emerging Technologies', 40),
  ('S42', 'AR / VR (Extended Reality)', 'Emerging Technologies', 41),
  ('S43', 'Quantum Computing', 'Emerging Technologies', 42),
  ('S44', 'Game Development', 'Emerging Technologies', 43),
  ('S45', 'UI / UX Design', 'Emerging Technologies', 44),
  ('S46', 'Business Analytics', 'Emerging Technologies', 45)
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "category" = EXCLUDED."category", "sort_order" = EXCLUDED."sort_order";
