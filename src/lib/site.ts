export const site = {
  name: "Mikan Engineering & Construction",
  short: "Mikan",
  tagline: "Precision. Progress. Partnership.",
  description:
    "Structural steel detailing, BIM coordination and electrical & instrumentation design for contractors, fabricators and owners worldwide.",
  offices: [
    {
      country: "Singapore",
      role: "Client & commercial office",
      lines: ["35 Selegie Road, #09-02", "Parklane Shopping Mall", "Singapore 188307"],
      phone: "+65 90625963",
      uen: "UEN 202230417W",
    },
    {
      country: "Ireland",
      role: "European office",
      lines: ["32 Boughlone Way, Bellingham", "Portlaoise, Co. Laois", "R32 H7DT, Ireland"],
      phone: "+353 896047510",
      uen: "Mikan Engineering Limited",
    },
    {
      country: "India",
      role: "Engineering delivery centre",
      lines: ["Door No. 2/165/B, Mikan Complex", "Thenkaiprai Road, Chithanthopu", "Tamil Nadu 629 810"],
      phone: "+91 8344390703",
      uen: "CIN U31909TN2020PTC139123",
    },
  ],
  email: "info@mikan-groups.com",
  salesEmail: "sales@mikan-groups.com",
  phone: "+91 0465 2207603",
  phones: [
    { country: "India", number: "+91 0465 2207603" },
    { country: "India", number: "+91 8344390703" },
    { country: "Singapore", number: "+65 90625963" },
    { country: "Ireland", number: "+353 896047510" },
  ],
} as const;

export const nav = [
  { label: "About", href: "/about", icon: "Users" },
  { label: "Services", href: "/services", icon: "Layers" },
  { label: "Projects", href: "/projects", icon: "Building2" },
  { label: "Sectors", href: "/sectors", icon: "Factory" },
  { label: "Careers", href: "/careers", icon: "HardHat" },
  { label: "Contact", href: "/contact", icon: "Mail" },
] as const;

/** Reasons a visitor gets in touch — drives the contact form. */
export const enquiryTypes = [
  "Request a quote",
  "Structural steel detailing",
  "BIM & MEP coordination",
  "Electrical & instrumentation",
  "Offshore / process plant",
  "Careers",
  "General enquiry",
] as const;

export const services = [
  {
    id: "engineering-consultation",
    stages: [
      { title: "Brief & feasibility", body: "We review your concept, constraints and governing code, then report on viability, risk and indicative cost." },
      { title: "Design review", body: "Existing designs are validated against the standard, with findings issued as a marked-up report." },
      { title: "Compliance & permitting", body: "We prepare the documentation your approval authority needs and respond to their queries." },
      { title: "Construction support", body: "Technical queries answered during construction, with revised details issued where needed." },
    ],
    index: "01",
    title: "Engineering Consultation",
    image: "/media/s-consult.jpg",
    summary:
      "Feasibility studies, design review and technical advisory from concept through to construction phase support.",
    deliverables: ["Feasibility & viability studies", "Design review & validation", "Building code compliance", "Permitting support", "Construction phase consulting"],
    software: ["STAAD.Pro", "ETABS", "AutoCAD"],
    standards: ["ISO 9001", "Eurocode", "AISC 360"],
    accent: "bg-brand-green",
  },
  {
    id: "bim-service",
    stages: [
      { title: "Model setup", body: "Project template, shared coordinates and naming conventions agreed to ISO 19650 before modelling starts." },
      { title: "Discipline modelling", body: "Mechanical, electrical, plumbing and fire protection modelled to the agreed LOD." },
      { title: "Clash resolution", body: "Federated in Navisworks, clashes logged and resolved in weekly cycles with the design team." },
      { title: "Issue & as-built", body: "Coordinated drawings, schedules and openings issued, then updated to as-built on completion." },
    ],
    index: "02",
    title: "BIM Service",
    image: "/media/s-bim.jpg",
    summary:
      "Federated models coordinated to clash-free status, with documentation and as-built deliverables.",
    deliverables: ["3D/4D/5D BIM modelling", "Clash detection & resolution", "BIM documentation", "Energy & solar analysis", "As-built documentation"],
    software: ["Revit", "Navisworks", "Tekla", "BIM 360"],
    standards: ["ISO 19650", "LOD 300-400", "COBie"],
    accent: "bg-brand-blue",
  },
  {
    id: "structural-engineering",
    stages: [
      { title: "Analysis & design", body: "Member sizing and connection design to the governing code, with calculations issued for review." },
      { title: "3D modelling", body: "Full frame modelled in Tekla or Advance Steel to your connection standards." },
      { title: "Detailing & checking", body: "Shop, part and erection drawings produced, then checked by a second engineer against the model." },
      { title: "Issue & revision", body: "Drawings issued with a controlled register; comments return into the same register." },
    ],
    index: "03",
    title: "Structural Engineering",
    image: "/media/s-structural.jpg",
    summary:
      "Advanced structural analysis, steel detailing and construction documentation for complex structures.",
    deliverables: ["Structural analysis & design", "Steel detailing & shop drawings", "Progressive collapse analysis", "Connection design", "Construction documentation"],
    software: ["Tekla Structures", "Advance Steel", "STAAD.Pro"],
    standards: ["AS/NZS 5131", "AISC 360", "BS 5950", "EN 1090"],
    accent: "bg-brand-cyan",
  },
  {
    id: "manufacturing-supply",
    stages: [
      { title: "Fabrication planning", body: "Drawings released in packages aligned to your cutting and assembly schedule." },
      { title: "Quality control", body: "Dimensional and weld inspection against the issued drawings and execution class." },
      { title: "Logistics", body: "Marking, packing and shipping documentation prepared for international delivery." },
      { title: "Install & commission", body: "Onsite installation support and commissioning assistance through handover." },
    ],
    index: "04",
    title: "Manufacturing & Supply",
    image: "/media/s-fabrication.jpg",
    summary:
      "Fabrication, quality-controlled supply and global shipping, through to installation and commissioning.",
    deliverables: ["Fabrication management", "Quality control & inspection", "Global shipping & logistics", "Onsite installation", "After-sales support"],
    software: ["Bluebeam", "ERP integration"],
    standards: ["ISO 9001", "ISO 45001", "EN 1090"],
    accent: "bg-brand-orange",
  },
  {
    id: "offshore-services",
    stages: [
      { title: "Load definition", body: "Operational, environmental and accidental load cases established to API or DNV." },
      { title: "Structural analysis", body: "Topside and jacket modelled in SACS, with all combinations run and reported." },
      { title: "CFD & simulation", body: "Wind and fluid loading assessed where geometry makes code coefficients unreliable." },
      { title: "Detailing & certification", body: "Steel detailed and documentation prepared for the certifying authority." },
    ],
    index: "05",
    title: "Offshore Services",
    image: "/media/s-offshore.jpg",
    summary:
      "Complete engineering for offshore platforms and structures, including CFD and aerodynamic simulation.",
    deliverables: ["Offshore platform design", "Computational fluid dynamics", "Aerodynamic simulation", "Dynamic load analysis", "Condition assessment"],
    software: ["ANSYS", "SACS", "AutoCAD Plant 3D"],
    standards: ["API RP 2A", "DNV", "ISO 19902"],
    accent: "bg-brand-ember",
  },
  {
    id: "process-plant",
    stages: [
      { title: "P&ID & layout", body: "Line routing developed from P&IDs against plant layout and access requirements." },
      { title: "Stress analysis", body: "Critical lines analysed in CAESAR II; supports and expansion arrangements designed." },
      { title: "Safety review", body: "HAZOP support and design changes implemented from review actions." },
      { title: "Isometrics & handover", body: "Isometrics, line lists and support drawings issued for fabrication and erection." },
    ],
    index: "06",
    title: "Process Plant",
    image: "/media/s-process.jpg",
    summary:
      "Piping design, stress analysis and E&I systems for process facilities and renewable energy plant.",
    deliverables: ["Piping layout & isometrics", "Pipe stress analysis", "HAZOP studies", "Automation & smart systems", "Commissioning support"],
    software: ["CAESAR II", "Plant 3D", "AutoCAD Electrical"],
    standards: ["ASME B31.3", "IEC 60364", "ISO 14001"],
    accent: "bg-brand-green",
  },
] as const;

export const stats = [
  { value: 30, suffix: "+", label: "Staff", note: "Engineers, detailers and coordinators" },
  { value: 200, suffix: "+", label: "Projects", note: "Delivered across six disciplines" },
  { value: 50, suffix: "+", label: "Clients", note: "Contractors, fabricators and owners" },
  { value: 3, suffix: "", label: "Countries", note: "India, Singapore and Ireland" },
] as const;

export const process = [
  { step: "01", title: "Enquiry & scope", body: "You send drawings, models or a scope note. We respond with a fixed-price or rate-based proposal, named lead engineer, and a delivery programme." },
  { step: "02", title: "Model & detail", body: "Our team builds the model to your standard and connection design. Progress is visible to you throughout, not only at issue." },
  { step: "03", title: "Independent check", body: "Every drawing is checked by a second engineer against the source model and the governing standard before it leaves us. Nothing issues unchecked." },
  { step: "04", title: "Issue & revise", body: "Drawings issue with a full register and revision history. Comments return into the same register, so approval status is never ambiguous." },
] as const;

export const sectors = [
  { name: "Industrial & Process Plant", note: "Structural steel, pipe racks, platforms", image: "/media/industrial-plant.jpg" },
  { name: "Commercial & High-Rise", note: "Steelwork, MEP coordination", image: "/media/highrise.jpg" },
  { name: "Data Centres", note: "MEP modelling, containment, E&I", image: "/media/datacentre.jpg" },
  { name: "Infrastructure", note: "Bridges, transport structures", image: "/media/bridge.jpg" },
  { name: "Oil, Gas & Offshore", note: "E&I design, piping support", image: "/media/site-work.jpg" },
  { name: "Warehousing & Logistics", note: "Portal frames, mezzanines", image: "/media/warehouse.jpg" },
] as const;

export const certifications = [
  { code: "ISO 9001", name: "Quality Management", image: "/mikan/certificates/iso9001.jpeg" },
  { code: "ISO 14001", name: "Environmental Management", image: "/mikan/certificates/iso14001.jpeg" },
  { code: "ISO 45001", name: "Occupational Health & Safety", image: "/mikan/certificates/iso45001.png" },
] as const;

export const heroSlides = [
  {
    video: "/media/oilgas.mp4",
    kicker: "Offshore & Process",
    headline: ["Built for", "plant that"],
    accent: "never stops",
    body: "Offshore platforms, refineries and process facilities — piping design, stress analysis and E&I systems engineered to run continuously.",
  },
  {
    video: "/media/engineer.mp4",
    kicker: "Construction Support",
    headline: ["Engineers", "on your"],
    accent: "site",
    body: "Site supervision, quality checks and progress tracking. Our engineers resolve issues where the work is actually happening.",
  },
  {
    video: "/media/plant.mp4",
    kicker: "Process Plant",
    headline: ["From P&ID", "to"],
    accent: "commissioned",
    body: "Piping layouts, HAZOP studies and automation design for process and renewable energy plant, through to system testing.",
  },
  {
    video: "/media/drawing.mp4",
    kicker: "Structural Detailing",
    headline: ["Precision in", "every"],
    accent: "connection",
    body: "Steel detailing, shop drawings and material take-offs. Every drawing independently checked before it reaches your fabrication floor.",
  },
  {
    video: "/media/crane.mp4",
    kicker: "Structural Engineering",
    headline: ["Structures", "that"],
    accent: "stand up",
    body: "Advanced structural analysis, connection design and construction documentation for high-rise and mission-critical structures.",
  },
] as const;

export const about = {
  mission:
    "To deliver innovative engineering solutions that empower our clients and enhance communities. We are committed to excellence, sustainability, and integrity in every project we undertake.",
  vision:
    "To be a leading engineering firm recognised for our creativity, technical expertise, and dedication to sustainable practices — shaping a better future through engineering.",
  values: [
    {
      title: "Client-Centric Solutions",
      icon: "Handshake",
      body: "To understand and address the unique needs of our clients, providing tailored engineering solutions that drive success.",
    },
    {
      title: "Sustainability",
      icon: "Leaf",
      body: "To integrate sustainable practices into all our projects, minimising environmental impact and promoting resource efficiency.",
    },
    {
      title: "Innovation",
      icon: "Lightbulb",
      body: "To leverage cutting-edge technology and innovative approaches in our designs and processes, remaining at the forefront of the industry.",
    },
    {
      title: "Continuous Improvement",
      icon: "TrendingUp",
      body: "To foster a culture of learning and development within our team, encouraging professional growth and adapting to industry advancements.",
    },
    {
      title: "Community Engagement",
      icon: "Users",
      body: "To actively participate in the communities we serve, ensuring our projects enhance local infrastructure and quality of life.",
    },
  ],
} as const;

/**
 * PLACEHOLDER PROJECT DATA — replace with Mikan's real portfolio.
 * Keep the shape; swap titles, sectors, locations, scope figures and images.
 */
export const projects = [
  {
    id: "sg-data-centre",
    clientType: "Main contractor, South East Asia",
    clientAbout: "A regional main contractor delivering hyperscale facilities for cloud operators, working to tight commissioning dates with heavy MEP content.",
    challenge: "Mechanical, electrical and containment packages were designed by separate consultants. Clashes were surfacing on site, costing rework and threatening the commissioning programme.",
    approach: "We federated all discipline models in Navisworks, ran weekly clash cycles with the design team, and reissued coordinated layouts and builderswork openings ahead of each construction package.",
    outcome: "Model delivered clash-free at LOD 400 before steel erection. Site RFIs on MEP coordination fell sharply across the remaining programme.",
    services: ["BIM Service", "Electrical & Instrumentation"],
    deliverables: ["Federated Revit model", "Clash detection reports", "Coordinated MEP layouts", "Builderswork openings", "Cable routing & containment", "As-built model"],

    title: "Hyperscale Data Centre",
    client: "Confidential",
    sector: "Data Centres",
    location: "Singapore",
    year: "2024",
    image: "/media/datacentre.jpg",
    scope: "MEP coordination & E&I design",
    metrics: [
      { label: "Model", value: "LOD 400" },
      { label: "Clashes resolved", value: "2,400" },
      { label: "Duration", value: "22 wks" },
    ],
    disciplines: ["BIM Service", "Electrical & Instrumentation"],
    standards: ["ISO 19650", "IEC 60364"],
  },
  {
    id: "au-warehouse",
    clientType: "Steel fabricator, Australia",
    clientAbout: "An Australian fabricator supplying portal-frame distribution facilities, running a full shop floor and needing detailing capacity that matched their throughput.",
    challenge: "A compressed fabrication window meant shop drawings were needed faster than the in-house detailing team could produce them, without any drop in accuracy.",
    approach: "We modelled the full frame in Tekla to the fabricator's own connection standards, issued drawings in release packages aligned to their cutting schedule, and ran independent checks on every sheet.",
    outcome: "1,850 tonnes detailed and issued in sixteen weeks. Drawings released in sequence with fabrication, so the shop was never waiting on engineering.",
    services: ["Structural Engineering"],
    deliverables: ["3D Tekla model", "Shop & part drawings", "Erection drawings", "Material take-offs", "Connection details", "Revision register"],

    title: "Distribution Facility",
    client: "Confidential",
    sector: "Warehousing & Logistics",
    location: "Australia",
    year: "2024",
    image: "/media/warehouse.jpg",
    scope: "Structural steel detailing",
    metrics: [
      { label: "Steel", value: "1,850 T" },
      { label: "Drawings", value: "3,200" },
      { label: "Duration", value: "16 wks" },
    ],
    disciplines: ["Structural Engineering"],
    standards: ["AS/NZS 5131"],
  },
  {
    id: "in-process-plant",
    clientType: "Process operator, India",
    clientAbout: "A process operator expanding an existing plant while keeping the running facility in production throughout the works.",
    challenge: "New pipework had to tie into live systems within a congested existing plant, with stress and HAZOP requirements that could not be compromised.",
    approach: "We produced piping layouts and isometrics against a surveyed model of the existing plant, ran CAESAR II stress analysis on all critical lines, and supported the client's HAZOP sessions.",
    outcome: "1,400 isometrics issued with a validated line list. Tie-ins executed during planned shutdown windows without unplanned production loss.",
    services: ["Process Plant", "Engineering Consultation"],
    deliverables: ["Piping GA & layouts", "Isometric drawings", "Pipe stress analysis", "Line list & tie-in schedule", "HAZOP support", "Support design"],

    title: "Process Plant Expansion",
    client: "Confidential",
    sector: "Industrial & Process",
    location: "India",
    year: "2023",
    image: "/media/s-process.jpg",
    scope: "Piping design & stress analysis",
    metrics: [
      { label: "Isometrics", value: "1,400" },
      { label: "Line list", value: "860" },
      { label: "Duration", value: "28 wks" },
    ],
    disciplines: ["Process Plant", "Engineering Consultation"],
    standards: ["ASME B31.3"],
  },
  {
    id: "offshore-platform",
    clientType: "Offshore operator, South East Asia",
    clientAbout: "An offshore operator upgrading a producing platform topside, where structural weight and environmental loading governed every design decision.",
    challenge: "New topside modules had to be added to an existing jacket without exceeding its capacity, under wave, wind and operational load cases to API and DNV.",
    approach: "We modelled the topside in SACS, ran 180 load combinations including CFD-derived wind loading, and iterated the structural arrangement until weight and capacity reconciled.",
    outcome: "3,100 tonnes of topside steel analysed and detailed within the existing jacket capacity. Design approved by the operator's certifying authority.",
    services: ["Offshore Services", "Structural Engineering"],
    deliverables: ["SACS structural model", "Load case analysis", "CFD wind study", "Topside steel detailing", "Lift & transport analysis", "Certification support"],

    title: "Offshore Platform Topside",
    client: "Confidential",
    sector: "Oil, Gas & Offshore",
    location: "South East Asia",
    year: "2023",
    image: "/media/s-offshore.jpg",
    scope: "Structural analysis & CFD",
    metrics: [
      { label: "Steel", value: "3,100 T" },
      { label: "Load cases", value: "180" },
      { label: "Duration", value: "34 wks" },
    ],
    disciplines: ["Offshore Services", "Structural Engineering"],
    standards: ["API RP 2A", "DNV"],
  },
  {
    id: "ie-commercial",
    clientType: "Developer, Ireland",
    clientAbout: "An Irish developer delivering a commercial high-rise with a steel frame and significant services coordination across eighteen floors.",
    challenge: "Steelwork detailing and MEP coordination were running in parallel on a tight programme, with EN 1090 execution-class requirements to satisfy.",
    approach: "We detailed the frame in Tekla to EN 1090 EXC3 and ran MEP coordination from the same federated model, so penetrations and services routes were resolved before fabrication released.",
    outcome: "2,400 tonnes detailed across eighteen floors with coordinated services. Fabrication and MEP packages released without sequencing conflicts.",
    services: ["Structural Engineering", "BIM Service"],
    deliverables: ["Tekla steel model", "Shop & erection drawings", "EN 1090 documentation", "MEP coordination", "Penetration schedules", "Material take-offs"],

    title: "Commercial High-Rise",
    client: "Confidential",
    sector: "Commercial & High-Rise",
    location: "Ireland",
    year: "2025",
    image: "/media/highrise.jpg",
    scope: "Steel detailing & BIM coordination",
    metrics: [
      { label: "Steel", value: "2,400 T" },
      { label: "Floors", value: "18" },
      { label: "Duration", value: "26 wks" },
    ],
    disciplines: ["Structural Engineering", "BIM Service"],
    standards: ["EN 1090", "Eurocode"],
  },
  {
    id: "bridge-infra",
    clientType: "Infrastructure authority, India",
    clientAbout: "A state infrastructure authority delivering highway bridge structures across twelve spans on a single corridor contract.",
    challenge: "Twelve spans with varying geometry had to be documented consistently to IS 800 and AISC 360, with drawings suitable for multiple fabricators.",
    approach: "We built a parametric detailing approach so span variations reused validated connection details, then issued a consistent drawing set with a controlled revision register.",
    outcome: "1,100 drawings issued across twelve spans in twenty weeks, with a single detailing standard applied throughout the corridor.",
    services: ["Structural Engineering"],
    deliverables: ["Structural detailing", "Span drawings", "Connection details", "Bar bending schedules", "Material take-offs", "Drawing register"],

    title: "Highway Bridge Structures",
    client: "Confidential",
    sector: "Infrastructure",
    location: "India",
    year: "2023",
    image: "/media/bridge.jpg",
    scope: "Structural detailing & documentation",
    metrics: [
      { label: "Spans", value: "12" },
      { label: "Drawings", value: "1,100" },
      { label: "Duration", value: "20 wks" },
    ],
    disciplines: ["Structural Engineering"],
    standards: ["IS 800", "AISC 360"],
  },
] as const;

/**
 * PLACEHOLDER CLIENT MARKS — no real client names or logos.
 * Replace `name` with real clients once cleared, and swap for SVG logos.
 */
export const clientMarks = [
  { name: "Main Contractor", sector: "Singapore" },
  { name: "Steel Fabricator", sector: "Australia" },
  { name: "EPC Contractor", sector: "Middle East" },
  { name: "Developer", sector: "Ireland" },
  { name: "Process Operator", sector: "India" },
  { name: "Offshore Operator", sector: "South East Asia" },
  { name: "Engineering Consultancy", sector: "United Kingdom" },
  { name: "Infrastructure Authority", sector: "India" },
] as const;

/** About-page milestones — verified from public filings. */
export const milestones = [
  { year: "2020", title: "Founded in Tamil Nadu", body: "Mikan Engineering & Construction Pvt Ltd incorporated in Kanyakumari, starting with structural steel detailing for Indian and international contractors." },
  { year: "2022", title: "Singapore office opens", body: "Mikan Engineering & Construction Pte Ltd established at Selegie Road, giving clients a local contracting entity across South East Asia." },
  { year: "2023", title: "Offshore & process capability", body: "Expanded into offshore platform design, CFD and pipe stress analysis, serving oil, gas and process operators." },
  { year: "2024", title: "ISO triple certification", body: "Certified to ISO 9001, ISO 14001 and ISO 45001 for quality, environmental and occupational health and safety management." },
  { year: "2025", title: "European presence", body: "Mikan Engineering Limited registered in Portlaoise, Co. Laois, extending delivery into Irish and wider European markets." },
] as const;

/** Why clients choose Mikan — differentiators, not slogans. */
export const differentiators = [
  { icon: "ShieldCheck", title: "Independent checking", body: "A second engineer verifies every drawing against the source model and governing standard before issue." },
  { icon: "Globe2", title: "Three time zones", body: "IST delivery overlapping SGT and CET business hours, so your queries are answered the same working day." },
  { icon: "Ruler", title: "Your standards", body: "AS/NZS, AISC, BS, EN, API and IS — we work to the code your project is governed by, and to your detailing conventions." },
  { icon: "Layers", title: "Six disciplines", body: "Consultation, BIM, structural, fabrication, offshore and process under one delivery team, not six subcontractors." },
] as const;

/** Open roles — based on Mikan's live job postings. Update as vacancies change. */
export const jobs = [
  {
    id: "structural-steel-detailer",
    title: "Structural Steel Detailer",
    discipline: "Structural Engineering",
    location: "Thuckalay, Tamil Nadu",
    type: "Full-time",
    experience: "1–3 years",
    summary:
      "Produce 3D steel models, shop and erection drawings, and material take-offs for Indian and international projects.",
    responsibilities: [
      "Create and modify 3D structural steel models",
      "Prepare shop drawings, part drawings and assembly drawings",
      "Generate material take-offs and advance bills of material",
      "Review drawings for accuracy, constructability and standard compliance",
      "Incorporate client and checker comments through revision cycles",
    ],
    requirements: [
      "Diploma or degree in Civil or Mechanical Engineering",
      "Understanding of structural steel drawings and connection standards",
      "Tekla Structures or Advance Steel experience",
      "Knowledge of AS/NZS or AISC detailing practice an advantage",
      "Freshers with strong fundamentals will be considered",
    ],
  },
  {
    id: "revit-mep-engineer",
    title: "Revit MEP Engineer",
    discipline: "BIM Service",
    location: "Thuckalay, Tamil Nadu",
    type: "Full-time",
    experience: "2+ years",
    summary:
      "Build and coordinate Revit MEP models for international BIM projects across mechanical, electrical, plumbing and fire protection.",
    responsibilities: [
      "Model HVAC ducting, piping, cable tray and supports in Revit",
      "Run clash detection in Navisworks and resolve with discipline leads",
      "Generate plans, sections, elevations and schedules from the model",
      "Maintain model updates through design and construction stages",
      "Coordinate with engineers and BIM coordinators across time zones",
    ],
    requirements: [
      "Revit MEP certification or 2+ years in Revit MEP / BIM modelling",
      "Working knowledge of AutoCAD and Navisworks",
      "Understanding of ISO 19650 and LOD conventions",
      "Willingness to work on international projects",
    ],
  },
  {
    id: "electrical-instrumentation-engineer",
    title: "Electrical & Instrumentation Engineer",
    discipline: "Electrical & Instrumentation",
    location: "Thuckalay, Tamil Nadu",
    type: "Full-time",
    experience: "1–3 years",
    summary:
      "Support E&I design and engineering for industrial and infrastructure projects, from single line diagrams to loop drawings.",
    responsibilities: [
      "Prepare and review E&I drawings and design documents",
      "Produce single line diagrams, cable schedules and routing layouts",
      "Develop loop drawings, hook-up drawings and panel layouts",
      "Carry out load calculations and cable sizing",
      "Coordinate with mechanical, piping and civil disciplines",
    ],
    requirements: [
      "Degree or diploma in Electrical or Instrumentation Engineering",
      "AutoCAD Electrical experience; ETAP an advantage",
      "Familiarity with IEC 60364, IS 732 or NEC",
      "Clear written English for international correspondence",
    ],
  },
  {
    id: "document-controller",
    title: "Document Controller",
    discipline: "Project Support",
    location: "Thuckalay, Tamil Nadu",
    type: "Full-time",
    experience: "1–3 years",
    summary:
      "Maintain drawing registers, revision control and transmittals across concurrent engineering projects.",
    responsibilities: [
      "Maintain drawing registers and revision histories",
      "Issue transmittals and track client comment status",
      "Control document numbering and filing conventions",
      "Support engineering and project teams with retrieval and reporting",
    ],
    requirements: [
      "Experience in document control within engineering or construction",
      "Strong attention to detail and record discipline",
      "Proficiency with spreadsheets and document management systems",
    ],
  },
] as const;

export const benefits = [
  { icon: "GraduationCap", title: "Learn on live projects", body: "You work on real international projects from the start, with a senior engineer checking and explaining every drawing you issue." },
  { icon: "Globe2", title: "International standards", body: "Exposure to AS/NZS, AISC, BS, EN and API codes across six disciplines — experience that travels." },
  { icon: "Users", title: "Small teams, direct access", body: "No layers between you and the lead engineer. Questions get answered the same day." },
  { icon: "TrendingUp", title: "Clear progression", body: "Detailer to checker to lead. We promote from within as the practice grows across three countries." },
] as const;

/** Quote wizard steps — one question per screen. */
export const quoteSteps = [
  {
    id: "discipline",
    question: "What do you need engineered?",
    hint: "Pick the closest discipline — we'll refine it together.",
    multi: false,
    options: [
      { value: "Structural steel detailing", label: "Steel Detailing", meta: "Shop & erection drawings" },
      { value: "BIM & MEP coordination", label: "BIM / MEP", meta: "Federated models, clash-free" },
      { value: "Electrical & instrumentation", label: "Electrical & I", meta: "SLDs, cable schedules, loops" },
      { value: "Process plant & piping", label: "Process Plant", meta: "Isometrics, stress analysis" },
      { value: "Offshore engineering", label: "Offshore", meta: "Topsides, CFD, certification" },
      { value: "Engineering consultation", label: "Consultation", meta: "Feasibility, design review" },
    ],
  },
  {
    id: "software",
    question: "Which software is the project in?",
    hint: "Select every platform that applies.",
    multi: true,
    options: [
      { value: "Tekla Structures", label: "Tekla", meta: "Structural steel" },
      { value: "Revit", label: "Revit", meta: "BIM / MEP" },
      { value: "AutoCAD", label: "AutoCAD", meta: "2D drafting" },
      { value: "Advance Steel", label: "Advance Steel", meta: "Steel detailing" },
      { value: "Navisworks", label: "Navisworks", meta: "Clash detection" },
      { value: "STAAD.Pro", label: "STAAD.Pro", meta: "Analysis" },
      { value: "CAESAR II", label: "CAESAR II", meta: "Pipe stress" },
      { value: "Not sure yet", label: "Not sure", meta: "We'll advise" },
    ],
  },
  {
    id: "standard",
    question: "Which standard governs the work?",
    hint: "The code your project is assessed against.",
    multi: false,
    options: [
      { value: "AS/NZS", label: "AS / NZS", meta: "Australia & NZ" },
      { value: "AISC", label: "AISC", meta: "United States" },
      { value: "BS / EN Eurocode", label: "BS / EN", meta: "UK & Europe" },
      { value: "IS codes", label: "IS", meta: "India" },
      { value: "API / DNV", label: "API / DNV", meta: "Offshore" },
      { value: "Other or unsure", label: "Other", meta: "Tell us below" },
    ],
  },
  {
    id: "size",
    question: "How big is the scope?",
    hint: "A rough figure is fine — it sets the team size.",
    multi: false,
    options: [
      { value: "Under 500 T / 500 drawings", label: "Small", meta: "< 500 T or 500 drawings" },
      { value: "500–2,000 T / 2,000 drawings", label: "Medium", meta: "500 – 2,000 T" },
      { value: "2,000–5,000 T", label: "Large", meta: "2,000 – 5,000 T" },
      { value: "Over 5,000 T", label: "Major", meta: "5,000 T +" },
      { value: "Ongoing capacity", label: "Retainer", meta: "Continuous support" },
    ],
  },
  {
    id: "timing",
    question: "When do you need it?",
    hint: "We'll tell you honestly if it's achievable.",
    multi: false,
    options: [
      { value: "Immediately", label: "Immediately", meta: "Starting now" },
      { value: "Within 1 month", label: "1 month", meta: "Planning ahead" },
      { value: "1–3 months", label: "1–3 months", meta: "Early stage" },
      { value: "Just exploring", label: "Exploring", meta: "Budgeting only" },
    ],
  },
] as const;
