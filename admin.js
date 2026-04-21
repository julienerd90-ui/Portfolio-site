/* ─────────────────────────────────────────
   JULIENISNERD Admin — admin.js
   Features: Create / Edit / Delete projects
───────────────────────────────────────── */

let editingId = null;        // 현재 편집 중인 프로젝트 ID (null = 추가 모드)
let pendingDeleteId = null;  // 삭제 대기 중인 프로젝트 ID

/* ── PASSWORD ── */
function checkPassword() {
    const input = document.getElementById('pw-input').value;
    if (input === '3605') {
        document.getElementById('password-overlay').style.display = 'none';
        const panel = document.getElementById('adminWrapper');
        panel.style.display = 'flex';
        setImageFields([]);
        addImageField();
        renderProjectList();
        initAboutEditor();    // About 에디터 초기화
    } else {
        document.getElementById('pw-input').value = '';
        document.getElementById('pw-input').placeholder = 'Wrong ✕';
        setTimeout(() => {
            document.getElementById('pw-input').placeholder = '····';
        }, 1500);
    }
}

document.getElementById('pw-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') checkPassword();
});

/* ── MULTI-IMAGE FIELD MANAGEMENT ── */
function addImageField(url = '') {
    const list = document.getElementById('img-url-list');
    const row = document.createElement('div');
    row.className = 'img-url-row';
    row.draggable = true;
    row.innerHTML = `
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <img class="img-mini-preview" src="" alt="">
        <input type="url" placeholder="https://raw.githubusercontent.com/..." value="${url}"
               oninput="updateMiniPreview(this)">
        <button type="button" class="remove-img-btn" onclick="removeImageField(this)" title="Remove">&#215;</button>
    `;
    list.appendChild(row);

    const input = row.querySelector('input');
    if (url) updateMiniPreview(input);

    // 드래그 앤 드롭 이벤트 추가
    row.addEventListener('dragstart', function(e) {
        window.draggedImgRow = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        document.querySelectorAll('.img-url-row').forEach(r => r.classList.remove('drag-over'));
        window.draggedImgRow = null;
    });

    row.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('.img-url-row').forEach(r => r.classList.remove('drag-over'));
        this.classList.add('drag-over');
    });

    row.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        if (window.draggedImgRow && window.draggedImgRow !== this) {
            const parentList = this.parentNode;
            const allRows = Array.from(parentList.children);
            const draggedIdx = allRows.indexOf(window.draggedImgRow);
            const targetIdx = allRows.indexOf(this);
            
            if (draggedIdx < targetIdx) {
                parentList.insertBefore(window.draggedImgRow, this.nextSibling);
            } else {
                parentList.insertBefore(window.draggedImgRow, this);
            }
        }
    });
}

function updateMiniPreview(input) {
    const preview = input.closest('.img-url-row').querySelector('.img-mini-preview');
    const url = input.value.trim();
    if (url.startsWith('http')) {
        preview.src = url;
        preview.style.display = 'block';
        preview.onerror = () => { preview.style.display = 'none'; };
    } else {
        preview.style.display = 'none';
    }
}

function removeImageField(btn) {
    const list = document.getElementById('img-url-list');
    if (list.children.length <= 1) return; // 최소 1개 유지
    btn.closest('.img-url-row').remove();
}

function getImageUrls() {
    return Array.from(document.querySelectorAll('#img-url-list input'))
        .map(i => i.value.trim())
        .filter(Boolean);
}

function setImageFields(images) {
    document.getElementById('img-url-list').innerHTML = '';
    const list = (images && images.length > 0) ? images : [''];
    list.forEach(url => addImageField(url));
}


/* ── RENDER PROJECT LIST (right panel) ── */
function renderProjectList() {
    const projects = getProjects();
    const order = getProjectOrder();
    const list = document.getElementById('project-list');
    const count = document.getElementById('project-count');

    // 실제 존재하는 ID만 필터링
    const validOrder = order.filter(id => projects[id]);

    count.textContent = `${validOrder.length} PROJECT${validOrder.length !== 1 ? 'S' : ''}`;

    if (validOrder.length === 0) {
        list.innerHTML = '<li class="list-empty">No projects yet.</li>';
        return;
    }

    list.innerHTML = validOrder.map(key => {
        const p = projects[key];
        return `
            <li class="project-item" id="item-${p.id}" draggable="true" data-id="${p.id}">
                <span class="drag-handle" title="Drag to reorder">⠿</span>
                <img class="project-thumb" src="${p.img || ''}" alt="${p.title}"
                     onerror="this.style.background='#e8e8e8'; this.src='';">
                <div class="project-info">
                    <div class="proj-title">${p.title}</div>
                    <div class="proj-meta">${p.year} · ${p.client}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="loadProjectToForm('${p.id}')">Edit</button>
                    <button class="btn-delete" onclick="openDeleteModal('${p.id}')">Delete</button>
                </div>
            </li>
        `;
    }).join('');

    initDragAndDrop();
}

/* ── DRAG AND DROP ── */
let dragSrcId = null;

function initDragAndDrop() {
    const items = document.querySelectorAll('#project-list .project-item');

    items.forEach(item => {
        item.addEventListener('dragstart', e => {
            dragSrcId = item.dataset.id;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            document.querySelectorAll('.project-item').forEach(i => i.classList.remove('drag-over'));
        });

        item.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            document.querySelectorAll('.project-item').forEach(i => i.classList.remove('drag-over'));
            item.classList.add('drag-over');
        });

        item.addEventListener('drop', e => {
            e.preventDefault();
            if (dragSrcId === item.dataset.id) return;

            const order = getProjectOrder();
            const fromIdx = order.indexOf(dragSrcId);
            const toIdx = order.indexOf(item.dataset.id);

            if (fromIdx === -1 || toIdx === -1) return;

            // 순서 배열 재정렬
            order.splice(fromIdx, 1);
            order.splice(toIdx, 0, dragSrcId);
            saveProjectOrder(order);

            renderProjectList();
        });
    });
}

/* ── LOAD PROJECT INTO FORM (edit mode) ── */
function loadProjectToForm(id) {
    const projects = getProjects();
    const p = projects[id];
    if (!p) return;

    editingId = id;

    // Fill form
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-id').disabled = true;
    document.getElementById('p-title').value = p.title;
    document.getElementById('p-year').value = p.year;
    document.getElementById('p-client').value = p.client;
    document.getElementById('p-concept').value = p.concept;

    // 이미지 배열 로드 (images 필드 우선, 없으면 img 단일 이미지)
    const imgs = (p.images && p.images.length > 0) ? p.images : (p.img ? [p.img] : []);
    setImageFields(imgs);

    // Switch UI to edit mode
    document.getElementById('form-mode-label').textContent = 'Edit Project';
    document.getElementById('submit-btn').textContent = 'Update Project';
    document.getElementById('cancel-btn').style.display = 'block';
    document.getElementById('status-msg').textContent = '';

    // Scroll to form
    document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── CANCEL EDIT ── */
function cancelEdit() {
    editingId = null;
    clearForm();
}

/* ── CLEAR FORM ── */
function clearForm() {
    document.getElementById('p-id').value = '';
    document.getElementById('p-id').disabled = false;
    document.getElementById('p-title').value = '';
    document.getElementById('p-year').value = '';
    document.getElementById('p-client').value = '';
    document.getElementById('p-concept').value = '';
    setImageFields([]);
    addImageField();
    document.getElementById('form-mode-label').textContent = 'Add New Project';
    document.getElementById('submit-btn').textContent = 'Publish Project';
    document.getElementById('cancel-btn').style.display = 'none';
    document.getElementById('status-msg').textContent = '';
}

/* ── SAVE PROJECT (create or update) ── */
function saveProject() {
    const id = editingId || document.getElementById('p-id').value.trim();
    const title = document.getElementById('p-title').value.trim();
    const year = document.getElementById('p-year').value.trim();
    const client = document.getElementById('p-client').value.trim();
    const concept = document.getElementById('p-concept').value.trim();
    const images = getImageUrls();

    if (!id || !title || !year || !client || !concept || images.length === 0) {
        showStatus('Please fill in all required fields and add at least one image.', 'error');
        return;
    }

    const project = {
        id, title, year, client, concept,
        images,
        img: images[0]  // 첫 번째 이미지 = 갤러리 썸네일
    };

    if (editingId) {
        updateProject(project);
        showStatus('Project updated successfully!', 'success');
    } else {
        addProject(project);
        showStatus('Project published!', 'success');
    }

    editingId = null;
    clearForm();
    renderProjectList();
}

function showStatus(msg, type) {
    const el = document.getElementById('status-msg');
    el.textContent = msg;
    el.className = type;
    setTimeout(() => { el.textContent = ''; el.className = ''; }, 4000);
}

/* ── DELETE MODAL ── */
function openDeleteModal(id) {
    pendingDeleteId = id;
    const projects = getProjects();
    const p = projects[id];
    document.getElementById('modal-desc').innerHTML =
        `<strong>"${p?.title || id}"</strong> will be permanently removed.<br>This action cannot be undone.`;
    document.getElementById('delete-modal').classList.add('active');
    document.getElementById('modal-confirm-btn').onclick = confirmDelete;
}

function closeDeleteModal() {
    pendingDeleteId = null;
    document.getElementById('delete-modal').classList.remove('active');
}

function confirmDelete() {
    if (!pendingDeleteId) return;

    // 폼에서 지금 편집 중이던 항목이 삭제될 경우 폼도 초기화
    if (editingId === pendingDeleteId) {
        editingId = null;
        clearForm();
    }

    deleteProject(pendingDeleteId);
    closeDeleteModal();
    renderProjectList();
    showStatus('Project deleted.', 'success');
}

// 모달 바깥 클릭 시 닫기
document.getElementById('delete-modal').addEventListener('click', function (e) {
    if (e.target === this) closeDeleteModal();
});

/* ════════════════════════════════════════
   ABOUT PAGE EDITOR
════════════════════════════════════════ */

/* 관리자 로그인 시 기존 데이터를 폼에 로드 */
function initAboutEditor() {
    const d = getAboutData();

    // Hero
    const heroInput = document.getElementById('about-hero-url');
    if (d.heroImage) {
        heroInput.value = d.heroImage;
        previewAboutHero(d.heroImage);
    }

    // Name & Role
    document.getElementById('about-name-input').value = d.name || '';
    document.getElementById('about-role-input').value = d.role || '';

    // Bio
    document.getElementById('about-bio-list').innerHTML = '';
    (d.bio || []).forEach(text => addAboutBioField(text));
    if ((d.bio || []).length === 0) addAboutBioField();

    // Career
    document.getElementById('about-career-list').innerHTML = '';
    (d.career || []).forEach(item => addAboutCareerRow(item));

    // Awards
    document.getElementById('about-awards-list').innerHTML = '';
    (d.awards || []).forEach(item => addAboutAwardRow(item));
}

/* Hero 이미지 미리보기 */
function previewAboutHero(url) {
    const preview = document.getElementById('about-hero-preview');
    if (url && url.startsWith('http')) {
        preview.src = url;
        preview.style.display = 'block';
        preview.onerror = () => { preview.style.display = 'none'; };
    } else {
        preview.style.display = 'none';
    }
}

/* Bio 단락 행 추가 */
function addAboutBioField(text = '') {
    const list = document.getElementById('about-bio-list');
    const row = document.createElement('div');
    row.className = 'bio-row';
    row.innerHTML = `
        <textarea placeholder="Bio paragraph...">${text}</textarea>
        <button type="button" class="remove-img-btn" onclick="removeAboutBioField(this)" title="Remove">×</button>
    `;
    list.appendChild(row);
}

function removeAboutBioField(btn) {
    const list = document.getElementById('about-bio-list');
    if (list.children.length <= 1) return;
    btn.closest('.bio-row').remove();
}

/* Career 항목 행 추가 */
function addAboutCareerRow(item = {}) {
    const list = document.getElementById('about-career-list');
    const row = document.createElement('div');
    row.className = 'career-edit-row';
    const tags = ['Career', 'Education'];
    const tagOptions = tags.map(t =>
        `<option value="${t}" ${item.tag === t ? 'selected' : ''}>${t}</option>`
    ).join('');
    row.innerHTML = `
        <input type="text" placeholder="2024" value="${item.year || ''}">
        <input type="text" placeholder="Title" value="${item.title || ''}">
        <input type="text" placeholder="Organization" value="${item.org || ''}">
        <select>${tagOptions}</select>
        <button type="button" class="remove-img-btn" onclick="this.closest('.career-edit-row').remove()" title="Remove">×</button>
    `;
    list.appendChild(row);
}

/* Award 항목 행 추가 */
function addAboutAwardRow(item = {}) {
    const list = document.getElementById('about-awards-list');
    const row = document.createElement('div');
    row.className = 'award-edit-row';
    // Style directly to match the 4-column grid in admin.html
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '80px 1fr 1fr 36px';
    row.style.gap = '8px';
    row.style.marginBottom = '8px';
    row.style.alignItems = 'center';
    row.innerHTML = `
        <input type="text" placeholder="2024" value="${item.year || ''}" style="margin:0;">
        <input type="text" placeholder="Award Name" value="${item.title || ''}" style="margin:0;">
        <input type="text" placeholder="Category / Org" value="${item.org || ''}" style="margin:0;">
        <button type="button" class="remove-img-btn" onclick="this.closest('.award-edit-row').remove()" title="Remove">×</button>
    `;
    list.appendChild(row);
}

/* About 저장 */
function saveAboutAdmin() {
    const heroImage = document.getElementById('about-hero-url').value.trim();
    const name      = document.getElementById('about-name-input').value;
    const role      = document.getElementById('about-role-input').value.trim();

    const bio = Array.from(document.querySelectorAll('#about-bio-list textarea'))
        .map(t => t.value.trim()).filter(Boolean);

    const career = Array.from(document.querySelectorAll('#about-career-list .career-edit-row'))
        .map(row => {
            const inputs = row.querySelectorAll('input');
            const select = row.querySelector('select');
            return {
                year:  inputs[0].value.trim(),
                title: inputs[1].value.trim(),
                org:   inputs[2].value.trim(),
                tag:   select.value
            };
        })
        .filter(item => item.year || item.title);

    const awards = Array.from(document.querySelectorAll('#about-awards-list .award-edit-row'))
        .map(row => {
            const inputs = row.querySelectorAll('input');
            return {
                year:  inputs[0].value.trim(),
                title: inputs[1].value.trim(),
                org:   inputs[2].value.trim()
            };
        })
        .filter(item => item.year || item.title);

    if (!name.trim()) {
        showAboutStatus('Name is required.', 'error');
        return;
    }

    saveAboutData({ heroImage, name, role, bio, career, awards });
    showAboutStatus('About page saved!', 'success');
}

function showAboutStatus(msg, type) {
    const el = document.getElementById('about-status-msg');
    el.textContent = msg;
    el.className = type;
    setTimeout(() => { el.textContent = ''; el.className = ''; }, 3500);
}
