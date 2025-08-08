
// =====================
// Constants & DOM Elements
// =====================
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;
let currentZoom = 1;
let offsetX = 0;
let offsetY = 0;

const container = document.getElementById('canvas');
const mainContent = document.getElementById('main-content');
const jsPlumbInstance = jsPlumb.newInstance({
    container: container,
    connector: { type: "Bezier", options: { curviness: 50 } },
    endpoint: { type: "Dot", options: { radius: 5 } },
    paintStyle: { stroke: "#000000ff", strokeWidth: 2 },
    endpointStyle: { fill: "#000000ff" },
    dragOptions: { 
        containment: "parentEnclosed",
        grid: { w: 10, h: 10 }
    }
});

const zoomInBtn = document.querySelector('.toolbar-top .toolbar-button[title="Zoom In"]');
const zoomOutBtn = document.querySelector('.toolbar-top .toolbar-button[title="Zoom Out"]');
const zoomResetBtn = document.querySelector('.toolbar-top .toolbar-button[title="Reset Zoom"]');

// =====================
// Utility Functions
// =====================
function getMainContentCenter() {
    const rect = mainContent.getBoundingClientRect();
    return {
        x: rect.width / 2,
        y: rect.height / 2
    };
}

// =====================
// Zoom & Pan Logic
// =====================
function setZoom(zoom, centerX = null, centerY = null) {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    if (centerX !== null && centerY !== null) {
        const prevZoom = currentZoom;
        const mouseX = (centerX - offsetX) / prevZoom;
        const mouseY = (centerY - offsetY) / prevZoom;
        offsetX = centerX - mouseX * zoom;
        offsetY = centerY - mouseY * zoom;
    }
    currentZoom = zoom;
    container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
    container.style.transformOrigin = '0 0';
    jsPlumbInstance.setZoom(zoom);
}

if (zoomInBtn) {
    zoomInBtn.addEventListener('click', function() {
        const { x, y } = getMainContentCenter();
        setZoom(currentZoom + ZOOM_STEP, x, y);
    });
}
if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', function() {
        const { x, y } = getMainContentCenter();
        setZoom(currentZoom - ZOOM_STEP, x, y);
    });
}
if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', function() {
        const mainRect = mainContent.getBoundingClientRect();
        const canvasCenterX = container.offsetWidth / 2;
        const canvasCenterY = container.offsetHeight / 2;
        const centerX = mainRect.width / 2;
        const centerY = mainRect.height / 2;
        offsetX = centerX - canvasCenterX;
        offsetY = centerY - canvasCenterY;
        setZoom(1, null, null);
        container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1)`;
        container.style.transformOrigin = '0 0';
        jsPlumbInstance.setZoom(1);
    });
}

mainContent.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
        e.preventDefault();
        let delta = e.deltaY < 0 ? 1 : -1;
        let newZoom = currentZoom + delta * ZOOM_STEP;
        const parentRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - parentRect.left;
        const mouseY = e.clientY - parentRect.top;
        setZoom(newZoom, mouseX, mouseY);
    }
});

let isMiddlePanning = false;
let panStart = { x: 0, y: 0 };
let panOffsetStart = { x: 0, y: 0 };

mainContent.addEventListener('mousedown', function(e) {
    if (e.button === 1) {
        isMiddlePanning = true;
        panStart.x = e.clientX;
        panStart.y = e.clientY;
        panOffsetStart.x = offsetX;
        panOffsetStart.y = offsetY;
        document.body.style.cursor = 'grab';
        e.preventDefault();
    }
});

['mouseup', 'click', 'auxclick'].forEach(eventType => {
    mainContent.addEventListener(eventType, function(e) {
        if (e.button === 1) {
            e.preventDefault();
        }
    });
});

document.addEventListener('mousemove', function(e) {
    if (isMiddlePanning) {
        offsetX = panOffsetStart.x + (e.clientX - panStart.x);
        offsetY = panOffsetStart.y + (e.clientY - panStart.y);
        container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${currentZoom})`;
        container.style.transformOrigin = '0 0';
    }
});

document.addEventListener('mouseup', function(e) {
    if (isMiddlePanning && e.button === 1) {
        isMiddlePanning = false;
        document.body.style.cursor = '';
    }
});


// =====================
// Node Creation & Selection
// =====================
function createNode(id, x, y, iconClass) {
    function showSelection() {
        node.style.outline = '5px solid #0078d4';
        addResizeHandles(node);
        node.classList.add('selected-diagram-node');
    }
    function hideSelection() {
        node.style.outline = "1.5px solid #0078d4";
        removeResizeHandles(node);
        node.classList.remove('selected-diagram-node');
    }

    const node = document.createElement("div");
    node.className = "diagram-node";
    node.id = id;
    node.style.position = "absolute";
    node.style.left = x + "px";
    node.style.top = y + "px";
    node.style.minWidth = "60px";
    node.style.minHeight = "60px";
    node.style.boxSizing = "border-box";
    node.style.padding = "5px";
    node.style.width = "auto";
    node.style.height = "auto";
    node.style.outline = "1.5px solid #0078d4";
    node.style.fontSize = "18px";
    node.style.display = "flex";
    node.style.flexDirection = "column";
    node.style.alignItems = "center";
    node.style.justifyContent = "center";
    node.style.cursor = "move";
    node.style.background = "#transparent";


    const icon = document.createElement("i");
    icon.className = iconClass;
    icon.style.fontSize = "2em";
    icon.style.color = "#000000ff";
    node.appendChild(icon);

    // Add text label below the icon
    const label = document.createElement("div");
    label.className = "diagram-node-label";
    label.textContent = id;
    label.style.fontSize = "12px";
    label.style.color = "#333";
    label.style.marginTop = "4px";
    label.style.width = "100%";
    label.style.textAlign = "center";
    label.style.wordBreak = "break-word";
    label.style.whiteSpace = "normal";
    label.style.overflowWrap = "break-word";
    label.style.position = "static";
    label.style.bottom = "unset";
    label.style.left = "unset";

    node.appendChild(label);

    label.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        node.style.outline = "1.5px solid #0078d4";
        removeResizeHandles(node);
        node.classList.remove('selected-diagram-node');
        label.contentEditable = "true";
        label.focus();
        label.style.outline = "1px dashed #0078d4";
        if (document.createRange && window.getSelection) {
            const range = document.createRange();
            range.selectNodeContents(label);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });

    label.addEventListener('blur', function() {
        label.contentEditable = "false";
        label.style.outline = "none";
    });
    label.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            label.blur();
        }
    });

    container.appendChild(node);
    jsPlumbInstance.manage(node);

    node.addEventListener('click', function (e) {
        document.querySelectorAll('.diagram-node').forEach(n => {
            n.style.outline = "1.5px solid #0078d4";
            removeResizeHandles(n);
            n.classList.remove('selected-diagram-node');
        });
        showSelection();
        e.stopPropagation();
    });

    if (!window._diagramNodeBorderListener) {
        document.addEventListener('click', function () {
            document.querySelectorAll('.diagram-node').forEach(n => {
                n.style.outline = "1.5px solid #0078d4";
                removeResizeHandles(n);
                n.classList.remove('selected-diagram-node');
            });
        });
        window._diagramNodeBorderListener = true;
    }

    node.addEventListener('mousedown', function(e) {
        if (e.button === 0 && !e.target.classList.contains('resize-handle')) {
            if (node.style.outline !== 'none') {
                hideSelection();
            }
        }
    });
    node.addEventListener('mouseup', function(e) {
        if (e.button === 0 && !e.target.classList.contains('resize-handle')) {
            if (document.activeElement === node || node.style.outline !== 'none') {
                showSelection();
            }
        }
    });
    if (window.jsPlumbInstance && window.jsPlumbInstance.on) {
        window.jsPlumbInstance.on(node, 'drag:start', function() {
            hideSelection();
        });
        window.jsPlumbInstance.on(node, 'drag:stop', function() {
            showSelection();
        });
    }

    jsPlumbInstance.addEndpoint(node, {
        anchor: "Right",
        source: true,
        target: true,
        maxConnections: -1,
    });
    jsPlumbInstance.addEndpoint(node, {
        anchor: "Left",
        source: true,
        target: true,
        maxConnections: -1,
    });
    jsPlumbInstance.addEndpoint(node, {
        anchor: "Top",
        source: true,
        target: true,
        maxConnections: -1,
    });
    jsPlumbInstance.addEndpoint(node, {
        anchor: "Bottom",
        source: true,
        target: true,
        maxConnections: -1,
    });
    return node;
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' || e.key === 'Del') {
        const selected = document.querySelector('.diagram-node.selected-diagram-node');
        if (selected) {
            jsPlumbInstance.removeAllEndpoints(selected);
            selected.remove();
            
        }
    }
});

const HANDLE_SIZE = 10;
const HANDLE_POSITIONS = [
    { name: 'nw', cursor: 'nwse-resize' },
    { name: 'n',  cursor: 'ns-resize' },
    { name: 'ne', cursor: 'nesw-resize' },
    { name: 'e',  cursor: 'ew-resize' },
    { name: 'se', cursor: 'nwse-resize' },
    { name: 's',  cursor: 'ns-resize' },
    { name: 'sw', cursor: 'nesw-resize' },
    { name: 'w',  cursor: 'ew-resize' },
];

function addResizeHandles(node) {
    removeResizeHandles(node);
    HANDLE_POSITIONS.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle resize-handle-' + pos.name;
        handle.style.position = 'absolute';
        handle.style.width = HANDLE_SIZE + 'px';
        handle.style.height = HANDLE_SIZE + 'px';
        handle.style.background = '#fff';
        handle.style.border = '1px solid #0078d4';
        handle.style.borderRadius = '2px';
        handle.style.zIndex = '100';
        handle.style.cursor = pos.cursor;
        handle.dataset.handle = pos.name;
        positionHandle(node, handle, pos.name);
        handle.addEventListener('mousedown', resizeHandleMouseDown);
        node.appendChild(handle);
    });
    node.style.userSelect = 'none';
}

function removeResizeHandles(node) {
    Array.from(node.querySelectorAll('.resize-handle')).forEach(h => h.remove());
}

function positionHandle(node, handle, pos) {
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const s = HANDLE_SIZE;
    let outlineWidth = 0;
    if (node.style.outline) {
        const match = node.style.outline.match(/([\d.]+)px/);
        if (match) outlineWidth = parseFloat(match[1]);
    }
    let left = 0, top = 0;
    switch (pos) {
        case 'nw': left = -s/2 - outlineWidth; top = -s/2 - outlineWidth; break;
        case 'n':  left = w/2 - s/2; top = -s/2 - outlineWidth; break;
        case 'ne': left = w - s/2 + outlineWidth; top = -s/2 - outlineWidth; break;
        case 'e':  left = w - s/2 + outlineWidth; top = h/2 - s/2; break;
        case 'se': left = w - s/2 + outlineWidth; top = h - s/2 + outlineWidth; break;
        case 's':  left = w/2 - s/2; top = h - s/2 + outlineWidth; break;
        case 'sw': left = -s/2 - outlineWidth; top = h - s/2 + outlineWidth; break;
        case 'w':  left = -s/2 - outlineWidth; top = h/2 - s/2; break;
    }
    handle.style.left = left + 'px';
    handle.style.top = top + 'px';
}

let resizingNode = null;
let resizingHandle = null;
let resizeStart = null;

function resizeHandleMouseDown(e) {
    e.stopPropagation();
    e.preventDefault();
    resizingNode = e.target.parentElement;
    resizingHandle = e.target.dataset.handle;
    resizeStart = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        left: parseInt(resizingNode.style.left, 10),
        top: parseInt(resizingNode.style.top, 10),
        width: resizingNode.offsetWidth,
        height: resizingNode.offsetHeight,
        zoom: currentZoom
    };
    document.addEventListener('mousemove', resizeHandleMouseMove);
    document.addEventListener('mouseup', resizeHandleMouseUp);
}

function resizeHandleMouseMove(e) {
    if (!resizingNode || !resizeStart) return;
    let dx = (e.clientX - resizeStart.mouseX) / (resizeStart.zoom || 1);
    let dy = (e.clientY - resizeStart.mouseY) / (resizeStart.zoom || 1);

    let w = 10, h = 10;
    dx = Math.round(dx / w) * w;
    dy = Math.round(dy / h) * h;

    let newLeft = resizeStart.left;
    let newTop = resizeStart.top;
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    switch (resizingHandle) {
        case 'nw':
            newLeft += dx;
            newTop += dy;
            newWidth -= dx;
            newHeight -= dy;
            break;
        case 'n':
            newTop += dy;
            newHeight -= dy;
            break;
        case 'ne':
            newTop += dy;
            newWidth += dx;
            newHeight -= dy;
            break;
        case 'e':
            newWidth += dx;
            break;
        case 'se':
            newWidth += dx;
            newHeight += dy;
            break;
        case 's':
            newHeight += dy;
            break;
        case 'sw':
            newLeft += dx;
            newWidth -= dx;
            newHeight += dy;
            break;
        case 'w':
            newLeft += dx;
            newWidth -= dx;
            break;
    }
    const MIN_SIZE = 60;
    let minLeft = 0;
    let minTop = 0;
    const parent = resizingNode.parentElement;
    const maxWidth = parent.offsetWidth;
    const maxHeight = parent.offsetHeight;

    if (["nw","w","sw"].includes(resizingHandle) && newWidth <= MIN_SIZE) {
        newLeft = resizeStart.left + (resizeStart.width - MIN_SIZE);
        newWidth = MIN_SIZE;
    }
    if (["nw","n","ne"].includes(resizingHandle) && newHeight <= MIN_SIZE) {
        newTop = resizeStart.top + (resizeStart.height - MIN_SIZE);
        newHeight = MIN_SIZE;
    }

    newWidth = Math.max(MIN_SIZE, Math.min(newWidth, maxWidth));
    newHeight = Math.max(MIN_SIZE, Math.min(newHeight, maxHeight));
    newLeft = Math.max(minLeft, Math.min(newLeft, maxWidth - newWidth));
    newTop = Math.max(minTop, Math.min(newTop, maxHeight - newHeight));

    resizingNode.style.left = newLeft + 'px';
    resizingNode.style.top = newTop + 'px';
    resizingNode.style.width = newWidth + 'px';
    resizingNode.style.height = newHeight + 'px';
    const icon = resizingNode.querySelector('i');
    const label = resizingNode.querySelector('.diagram-node-label');
    if (icon) {
        const minDim = Math.min(newWidth, newHeight);
        icon.style.fontSize = Math.max(16, Math.floor(minDim * 0.6)) + 'px';
    }
    if (label) {
        const minDim = Math.min(newWidth, newHeight);
        label.style.fontSize = Math.max(10, Math.floor(minDim * 0.2)) + 'px';
    }
    Array.from(resizingNode.querySelectorAll('.resize-handle')).forEach(h => {
        positionHandle(resizingNode, h, h.dataset.handle);
    });
    if (window.jsPlumbInstance && window.jsPlumbInstance.repaint) {
        window.jsPlumbInstance.repaint(resizingNode);
    }
}

function resizeHandleMouseUp(e) {
    document.removeEventListener('mousemove', resizeHandleMouseMove);
    document.removeEventListener('mouseup', resizeHandleMouseUp);
    resizingNode = null;
    resizingHandle = null;
    resizeStart = null;
}


// =====================
// Initial Nodes
// =====================
const nodeA = createNode("nodeA", 100, 100, "fa-solid fa-user");
const nodeB = createNode("nodeB", 400, 200, "fa-solid fa-gear");
const nodeC = createNode("nodeC", 250, 350, "fa-solid fa-star");


// =====================
// Icon Picker Logic
// =====================
const addNodeBtn = document.querySelector('.toolbar-left .toolbar-button[title="Add Node"]');
const iconPickerModal = document.getElementById('icon-picker-modal');
const iconPickerGrid = document.getElementById('icon-picker-grid');
const iconPickerCancel = document.getElementById('icon-picker-cancel');
const iconSearchInput = document.getElementById('icon-search-input');

let fontAwesomeIcons = [];

fetch('static/fontawesome/metadata/icons.json')
  .then(res => res.json())
  .then(data => {
    fontAwesomeIcons = [];
    Object.entries(data).forEach(([name, meta]) => {
      if (meta.styles && meta.styles.includes('solid')) {
        fontAwesomeIcons.push({
          name: meta.label || name,
          class: 'fa-solid fa-' + name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/_/g, '-'),
        });
      }
      if (meta.styles && meta.styles.includes('regular')) {
        fontAwesomeIcons.push({
          name: meta.label || name,
            class: 'fa-regular fa-' + name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/_/g, '-'),
        });
      }
      if (meta.styles && meta.styles.includes('brands')) {
        fontAwesomeIcons.push({
          name: meta.label || name,
          class: 'fa-brands fa-' + name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/_/g, '-'),
        });
      }
    });
    if (iconPickerModal && iconPickerModal.style.display !== 'none') {
      renderIconPickerGrid(iconSearchInput ? iconSearchInput.value : "");
    }
  });

function renderIconPickerGrid(filter = "") {
    if (!iconPickerGrid) return;
    iconPickerGrid.innerHTML = "";
    const iconPickerCount = document.getElementById('icon-picker-count');
    const filtered = fontAwesomeIcons.filter(icon =>
        icon.name.toLowerCase().includes(filter.toLowerCase()) ||
        icon.class.toLowerCase().includes(filter.toLowerCase())
    );
    if (iconPickerCount) {
        iconPickerCount.textContent = `${filtered.length} icon${filtered.length === 1 ? '' : 's'} found`;
    }
    filtered.forEach(icon => {
        const btn = document.createElement('button');
        btn.className = 'icon-picker-btn';
        btn.setAttribute('data-icon', icon.class);
        btn.title = icon.name;
        btn.style.fontSize = '2em';
        btn.style.border = 'none';
        btn.style.background = 'none';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.innerHTML = `<i class="${icon.class}"></i>`;
        btn.addEventListener('click', () => {
            iconPickerModal.style.display = 'none';
            const x = 200 + Math.floor(Math.random() * 100);
            const y = 200 + Math.floor(Math.random() * 100);
            createNode('node' + Date.now(), x, y, icon.class);
        });
        iconPickerGrid.appendChild(btn);
    });
    if (filtered.length === 0) {
        const noResult = document.createElement('div');
        noResult.textContent = 'No icons found.';
        noResult.style.gridColumn = '1/-1';
        noResult.style.textAlign = 'center';
        noResult.style.color = '#888';
        iconPickerGrid.appendChild(noResult);
    }
}

if (addNodeBtn && iconPickerModal) {
    addNodeBtn.addEventListener('click', () => {
        iconPickerModal.style.display = 'flex';
        renderIconPickerGrid("");
        if (iconSearchInput) iconSearchInput.value = "";
        if (iconSearchInput) iconSearchInput.focus();
    });
}

if (iconPickerCancel) {
    iconPickerCancel.addEventListener('click', () => {
        iconPickerModal.style.display = 'none';
    });
}

if (iconPickerModal) {
    iconPickerModal.addEventListener('mousedown', (e) => {
        if (e.target === iconPickerModal) {
            iconPickerModal.style.display = 'none';
        }
    });
}

if (iconSearchInput) {
    iconSearchInput.addEventListener('input', (e) => {
        renderIconPickerGrid(iconSearchInput.value);
    });
    iconSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            iconPickerModal.style.display = 'none';
        }
    });
}