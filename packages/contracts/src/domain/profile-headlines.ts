/**
 * 100 professional profile headlines. A student who has not written their own gets one of
 * these, chosen deterministically from their user id: every student keeps the same line across
 * sessions and devices, and a new account gets one with no extra storage.
 */
export const PROFILE_HEADLINES: readonly string[] = [
  'Driven computer science candidate with hands-on project experience, seeking to solve real-world engineering challenges.',
  'Results-focused final-year student passionate about building scalable solutions and contributing to impactful team projects.',
  'Proactive learner skilled in modern technologies, dedicated to driving efficiency and delivering high-quality deliverables.',
  'Analytical problem-solver with a strong foundation in core engineering principles and a track record of project execution.',
  'Goal-driven student ready to leverage academic training and practical project experience in entry-level engineering roles.',
  'Detail-oriented candidate focused on developing clean, efficient code and collaborating on innovative product features.',
  'Adaptable tech enthusiast equipped with practical project skills, aiming to deliver immediate value in fast-paced teams.',
  'Self-motivated candidate with strong technical agility and a continuous drive for learning and performance excellence.',
  'Solutions-oriented student blending strong technical fundamentals with effective cross-functional team collaboration.',
  'Dedicated engineering candidate seeking to turn complex technical challenges into practical, user-focused applications.',
  'Aspiring Full Stack Developer proficient in React, Node.js, and PostgreSQL, passionate about building responsive web apps.',
  'Software engineering candidate focused on backend architecture, API design, and cloud-native application development.',
  'Frontend developer in training with a keen eye for UI/UX design, modern JavaScript frameworks, and performance tuning.',
  'Computer Science student passionate about clean architecture, object-oriented design, and test-driven development.',
  'Entry-level software engineer with hands-on experience building RESTful microservices and full-stack web applications.',
  'Full-stack developer candidate skilled in TypeScript, Next.js, and database optimization for modern web platforms.',
  'Passionate programmer experienced in Python and Java, looking to contribute to enterprise software development.',
  'Aspiring software engineer dedicated to building scalable backend systems, database schemas, and robust API endpoints.',
  'Web developer candidate combining modern JavaScript expertise with practical git collaboration and agile workflows.',
  'CS undergrad focused on data structures, algorithms, and practical web development using modern developer tools.',
  'Aspiring AI/ML Engineer with hands-on experience in Python, PyTorch, and machine learning model development.',
  'Data Science enthusiast skilled in statistical analysis, data cleaning, and predictive modeling using Python & SQL.',
  'AI/ML candidate passionate about NLP, computer vision, and building end-to-end Machine Learning pipelines.',
  'Analytics-driven student proficient in Pandas, Scikit-learn, and data visualization tools like Tableau & Power BI.',
  'Entry-level Data Analyst eager to turn unstructured dataset insights into actionable business recommendations.',
  'ML candidate experienced in model evaluation, feature engineering, and generative AI prompt integration.',
  'Computer Science student specializing in Machine Learning algorithms, neural networks, and Big Data processing.',
  'Data enthusiast passionate about exploratory data analysis, SQL query optimization, and automated reporting.',
  'Aspiring Data Engineer with foundational knowledge in ETL pipelines, SQL databases, and cloud data warehouses.',
  'Quantitative candidate blending strong mathematical foundations with practical Python data analysis techniques.',
  'Aspiring Cloud/DevOps Engineer passionate about AWS, Docker containerization, and CI/CD pipeline automation.',
  'Systems-focused engineering candidate skilled in Linux administration, Bash scripting, and cloud architecture basics.',
  'Entry-level Cloud Developer experienced in containerizing microservices and managing Infrastructure as Code (IaC).',
  'DevOps enthusiast dedicated to automating software delivery pipelines, monitoring, and cloud security practices.',
  'Computer Science student with a focus on cloud computing, Kubernetes basics, and microservice deployment workflows.',
  'Infrastructure enthusiast skilled in Linux, Networking, and automated deployment using Terraform & GitHub Actions.',
  'Aspiring Site Reliability Engineer (SRE) passionate about system availability, performance monitoring, and log triage.',
  'Cloud engineering candidate focused on designing resilient AWS serverless architectures and Dockerized apps.',
  'IT & Systems candidate trained in cloud platform administration, virtual networking, and IAM security policies.',
  'Tech candidate with practical experience in Linux environments, git version control, and continuous integration tools.',
  'Aspiring Cybersecurity Analyst trained in network security fundamentals, vulnerability assessment, and SOC triage.',
  'Information Security candidate passionate about ethical hacking, threat hunting, and web application security auditing.',
  'Cybersecurity enthusiast skilled in TCP/IP networking, Wireshark packet analysis, and security incident response.',
  'Entry-level SOC Analyst candidate with hands-on lab experience in SIEM tools, log analysis, and malware defense.',
  'Security-minded CS student focused on cryptography basics, secure coding practices, and OWASP Top 10 mitigation.',
  'Aspiring Pen-Tester with practical experience in vulnerability scanning, Linux security hardening, and CTF challenges.',
  'Cyber defense student eager to apply risk assessment, identity management, and compliance principles in enterprise IT.',
  'Security analyst candidate with a strong foundation in network protocols, firewalls, and endpoint protection.',
  'Dedicated IT Security candidate trained in incident handling procedures, security auditing, and threat analysis.',
  'Computer Science candidate specializing in cybersecurity, access control models, and cloud security best practices.',
  'MBA candidate in Finance passionate about financial modeling, corporate valuation, and strategic data analysis.',
  'Aspiring Business Analyst skilled in requirement gathering, SQL analysis, and bridging business needs with IT.',
  'Management candidate specializing in financial planning, market research, and data-driven business strategy.',
  'Business Analytics student experienced in Excel modeling, Power BI dashboards, and process optimization.',
  'Finance & Analytics enthusiast eager to apply quantitative research and portfolio management concepts in fintech.',
  'MBA Operations candidate focused on supply chain optimization, process improvement, and logistics management.',
  'Analytical MBA student dedicated to market forecasting, KPI tracking, and strategic business decision-making.',
  'Aspiring Financial Analyst with a strong background in financial reporting, ratio analysis, and valuation frameworks.',
  'Business Technology candidate trained in agile product management, business process modeling, and data analytics.',
  'Management graduate eager to contribute analytical thinking, client management, and project coordination skills.',
  'Data-driven Marketing candidate passionate about digital growth strategies, SEO optimization, and content creation.',
  'Aspiring Growth Marketer skilled in campaign analytics, social media strategy, and performance marketing tools.',
  'Creative Marketing student combining consumer insights with digital advertising and brand positioning strategies.',
  'Digital Marketing enthusiast experienced in Google Analytics, content strategy, and conversion rate optimization.',
  'Communications candidate passionate about brand storytelling, corporate public relations, and social media engagement.',
  'Marketing Analytics student focused on customer segmentation, email marketing automation, and funnel metrics.',
  'Aspiring Product Marketer combining technical understanding with compelling value proposition messaging.',
  'Creative content strategist with a strong background in digital media, audience engagement, and campaign tracking.',
  'Customer-focused marketing candidate eager to leverage market research and digital channels to drive lead generation.',
  'Media & Communications student specializing in digital brand management, copywriting, and campaign execution.',
  'Aspiring Associate Product Manager (APM) passionate about product discovery, user stories, and agile delivery.',
  'Product-minded CS student skilled in user research, wireframing, and translating customer feedback into product roadmaps.',
  'Tech-savvy APM candidate focused on data-driven feature prioritization, UX design principles, and sprint planning.',
  'Aspiring Product Owner experienced in backlog management, user journey mapping, and cross-team alignment.',
  'Agile enthusiast combining software development knowledge with product strategy and customer analytics.',
  'Entry-level Product Manager candidate passionate about solving user pain points through iterative design and testing.',
  'Business & Tech candidate dedicated to defining product requirements, metric tracking, and competitive analysis.',
  'Customer-centric APM candidate with a knack for translating complex technical concepts into intuitive user features.',
  'Aspiring PM with hands-on experience leading student tech projects using Scrum frameworks and Jira management.',
  'Product strategy candidate trained in user interviews, prototype testing, and data-informed decision-making.',
  'Creative problem solver with a passion for software craftmanship and a commitment to continuous self-improvement.',
  'Project-focused engineering student dedicated to building user-centric applications from concept to deployment.',
  'Resourceful tech candidate with a strong track record of winning hackathons and building open-source projects.',
  'Curiosity-driven developer candidate eager to tackle complex algorithmic challenges and design scalable software.',
  'Collaborative computer science student with strong communication skills and a passion for engineering teamwork.',
  'Fast learner skilled in adapting to new tech stacks quickly and delivering clean, well-documented code.',
  'Project-tested developer candidate with hands-on experience leading technical teams in university competitions.',
  'Innovation-focused candidate looking to apply modern technical methodologies to solve real-world industry problems.',
  'Analytical thinker who thrives in fast-paced environments, applying clean code principles to build useful tools.',
  'Technologist dedicated to building accessible, high-performance software solutions with a focus on code quality.',
  'CS Senior | Full-Stack Web Development | React & Node.js',
  'Final-Year Engineer | Python & Machine Learning | Data Analytics',
  'Cloud & DevOps Candidate | AWS & Docker | CI/CD Automation',
  'Cybersecurity Student | SOC Analysis & Network Defense | Linux Security',
  'Business Analyst Candidate | SQL & Power BI | Data-Driven Insights',
  'Full-Stack Developer | Next.js & PostgreSQL | Clean Code & Scalable Web Apps',
  'APM Candidate | Product Discovery & User Analytics | Agile Product Strategy',
  'Software Engineering Candidate | Java & Distributed Systems | Problem Solver',
  'Finance & Analytics Graduate | Financial Modeling & Business Strategy',
  'AI/ML Engineering Candidate | PyTorch & GenAI Pipelines | Predictive Analytics',
];

/** FNV-1a 32-bit hash: small, stable, and identical in the API and every web app. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** The headline assigned to this student (same user id always gives the same headline). */
export function profileHeadlineForUser(userId: string): string {
  return (
    PROFILE_HEADLINES[hashString(userId) % PROFILE_HEADLINES.length] ?? PROFILE_HEADLINES[0] ?? ''
  );
}
