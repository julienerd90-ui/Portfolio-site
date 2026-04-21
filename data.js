const defaultProjects = {
    speaker: {
        id: 'speaker',
        title: "JULIENISNERD Speaker",
        year: "2023",
        client: "Personal Project",
        img: "assets/obj_speaker_1775928512726.png",
        concept: "The JULIENISNERD speaker was an experiment in transplanting the massive and heavy physical properties of Brutalist architecture into a small electronic device. By utilizing single-block aluminum machining, unwanted resonance is completely suppressed, becoming an object that dominates the space on its own.",
        materials: "Brushed Aluminum Body, Woven Kevlar Cone, Neodymium High-Density Magnet."
    },
    camera: {
        id: 'camera',
        title: "JULIENISNERD C1",
        year: "2024",
        client: "Independent",
        img: "assets/obj_camera_1775928546541.png",
        concept: "Stripping away the complex interfaces of the digital age, it was designed to focus solely on the essence of a camera: 'the act of capturing light'. The rough texture of the cold magnesium alloy body presents the photographer with a raw, tactile sensation.",
        materials: "Matte Black Magnesium Alloy, Sapphire Glass Lens Cover, Textured Tactile Rubber."
    },
    chair: {
        id: 'chair',
        title: "OSCILLATE.",
        year: "2024",
        client: "Conceptual Design",
        img: "assets/obj_chair_1775928527957.png",
        concept: "A lounge chair utilizing the inherent tension of a bent steel pipe. A single, unwelded unbroken pipeline acts as the skeleton of the chair and operates as a sophisticated spring mechanism to absorb the user's weight.",
        materials: "Powder-coated Tubular Steel, Full-grain Aniline Black Leather."
    },
    watch: {
        id: 'watch',
        title: "JULIENISNERD Watch",
        year: "2025",
        client: "Chronos",
        img: "assets/obj_camera_1775928546541.png",
        concept: "A timepiece stripped of all numerical indicators, defining time purely through spatial relationships and brutalist physical forms.",
        materials: "Anodized Aluminum, Sapphire Crystal."
    },
    console: {
        id: 'console',
        title: "JULIENISNERD Controller",
        year: "2025",
        client: "Gaming Co.",
        img: "assets/obj_speaker_1775928512726.png",
        concept: "Redefining the tactile feedback loop in interactive media. A heavier, metallic approach to gaming input devices that prioritizes cold aesthetic.",
        materials: "Magnesium Alloy, Custom Mechanical Switches."
    }
};

function getProjects() {
    const stored = localStorage.getItem('julienisnerd_projects');
    if (stored) {
        return JSON.parse(stored);
    } else {
        localStorage.setItem('julienisnerd_projects', JSON.stringify(defaultProjects));
        return defaultProjects;
    }
}

/* ── ORDER MANAGEMENT ── */
function getProjectOrder() {
    const stored = localStorage.getItem('julienisnerd_project_order');
    if (stored) return JSON.parse(stored);
    // 첫 호출 시 현재 프로젝트 키 순서로 초기화
    const order = Object.keys(getProjects());
    saveProjectOrder(order);
    return order;
}

function saveProjectOrder(orderArray) {
    localStorage.setItem('julienisnerd_project_order', JSON.stringify(orderArray));
}

function addProject(project) {
    const projects = getProjects();
    projects[project.id] = project;
    localStorage.setItem('julienisnerd_projects', JSON.stringify(projects));
    // 순서 배열에 추가 (중복 방지)
    const order = getProjectOrder();
    if (!order.includes(project.id)) {
        order.push(project.id);
        saveProjectOrder(order);
    }
}

function updateProject(project) {
    const projects = getProjects();
    projects[project.id] = project;
    localStorage.setItem('julienisnerd_projects', JSON.stringify(projects));
}

function deleteProject(id) {
    const projects = getProjects();
    delete projects[id];
    localStorage.setItem('julienisnerd_projects', JSON.stringify(projects));
    // 순서 배열에서도 제거
    const order = getProjectOrder().filter(oid => oid !== id);
    saveProjectOrder(order);
}

/* ══════════════════════════════════════
   ABOUT PAGE DATA
══════════════════════════════════════ */
const defaultAbout = {
    heroImage: '',
    name: 'JULIEN\nKIM.',
    role: 'Industrial Designer',
    bio: [
        'Based between Seoul and the world, I am an industrial designer who believes that objects should carry emotional weight. My work sits at the intersection of material honesty and conceptual rigor — each project is an attempt to distill a complex feeling into a singular, enduring form.',
        'I have collaborated with manufacturers, cultural institutions, and independent clients across audio, furniture, and wearable technology. The common thread: a refusal to separate aesthetics from function, or function from narrative.'
    ],
    career: [
        { year: '2025', title: 'Senior Industrial Designer', org: 'Astell&Kern — AVM Division', tag: 'Career' },
        { year: '2022', title: 'Industrial Design, BFA',      org: 'Hongik University, Seoul',        tag: 'Education' },
        { year: '2020', title: 'Design Internship',            org: 'Samsung Design Lab, Seoul',       tag: 'Career' }
    ],
    awards: [
        { year: '2024', title: 'Red Dot Design Award',         org: 'Product Category — Consumer Electronics' },
        { year: '2021', title: 'iF Design Award — Honourable Mention', org: 'Furniture & Interior Category' }
    ]
};

function getAboutData() {
    const stored = localStorage.getItem('julienisnerd_about');
    if (stored) {
        const parsed = JSON.parse(stored);
        // 이전에 저장된 데이터에 awards 속성이 없으면 기본값을 넣어서 반환 (데이터 유실 방지)
        if (!parsed.awards || parsed.awards.length === 0) {
            parsed.awards = defaultAbout.awards;
        }
        return parsed;
    }
    return defaultAbout;
}

function saveAboutData(data) {
    localStorage.setItem('julienisnerd_about', JSON.stringify(data));
}
