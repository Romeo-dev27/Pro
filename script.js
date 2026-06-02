document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. GLOBAL SETTINGS & NAVIGATION
    // ==========================================
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');

    // Handles both PC and Mobile Dark Mode buttons
    const toggleTheme = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    };
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('mobile-theme-toggle')?.addEventListener('click', toggleTheme);

    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            views.forEach(v => {
                v.classList.remove('active');
                v.classList.add('hidden');
            });
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // ==========================================
    // 2. DASHBOARD LOGIC 
    // ==========================================
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let goals = JSON.parse(localStorage.getItem('goals')) || [];
    let stats = JSON.parse(localStorage.getItem('stats')) || { tasks: 0, sessions: 0 };

    function saveDash() {
        localStorage.setItem('todos', JSON.stringify(todos));
        localStorage.setItem('habits', JSON.stringify(habits));
        localStorage.setItem('goals', JSON.stringify(goals));
        localStorage.setItem('stats', JSON.stringify(stats));
        updateStats();
    }

    function updateStats() {
        document.getElementById('stat-tasks').textContent = stats.tasks;
        document.getElementById('stat-sessions').textContent = stats.sessions;
        document.getElementById('stat-habits').textContent = habits.length;
    }

    document.getElementById('reset-stats').addEventListener('click', () => {
        if(confirm("Reset overall statistics to zero?")) {
            stats = { tasks: 0, sessions: 0 }; saveDash();
        }
    });

    const todoList = document.getElementById('todo-list');
    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach((todo, i) => {
            todoList.innerHTML += `
                <li>
                    <div class="item-content ${todo.completed ? 'completed' : ''}">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${i})">
                        <span>${todo.text}</span>
                    </div>
                    <button class="delete-btn" onclick="deleteTodo(${i})">×</button>
                </li>`;
        });
    }
    document.getElementById('add-todo').addEventListener('click', () => {
        const input = document.getElementById('todo-input');
        if (input.value.trim()) { todos.push({ text: input.value.trim(), completed: false }); input.value = ''; saveDash(); renderTodos(); }
    });
    window.toggleTodo = (i) => { todos[i].completed = !todos[i].completed; if (todos[i].completed) stats.tasks++; saveDash(); renderTodos(); };
    window.deleteTodo = (i) => { todos.splice(i, 1); saveDash(); renderTodos(); };
    document.getElementById('clear-todos').addEventListener('click', () => { if(confirm("Delete all tasks?")) { todos = []; saveDash(); renderTodos(); }});

    const habitList = document.getElementById('habit-list');
    function renderHabits() {
        habitList.innerHTML = '';
        const today = new Date().toDateString();
        habits.forEach((habit, i) => {
            const done = habit.lastCompleted === today;
            habitList.innerHTML += `
                <li>
                    <span class="item-content">${habit.name} (${habit.streak} 🔥)</span>
                    <button class="btn ${done ? 'secondary' : 'primary'} btn-sm" onclick="completeHabit(${i})" ${done ? 'disabled' : ''}>${done ? 'Done' : 'Do'}</button>
                </li>`;
        });
    }
    document.getElementById('add-habit').addEventListener('click', () => {
        const input = document.getElementById('habit-input');
        if (input.value.trim()) { habits.push({ name: input.value.trim(), streak: 0, lastCompleted: null }); input.value = ''; saveDash(); renderHabits(); }
    });
    window.completeHabit = (i) => { habits[i].streak++; habits[i].lastCompleted = new Date().toDateString(); saveDash(); renderHabits(); };
    document.getElementById('reset-habits').addEventListener('click', () => { if(confirm("Reset all habit streaks?")) { habits.forEach(h => { h.streak = 0; h.lastCompleted = null; }); saveDash(); renderHabits(); }});

    const goalList = document.getElementById('goal-list');
    function renderGoals() {
        goalList.innerHTML = '';
        goals.forEach((goal, i) => {
            goalList.innerHTML += `
                <li style="flex-direction:column; align-items:flex-start;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span class="item-content">${goal.name}</span>
                        <button class="delete-btn" onclick="deleteGoal(${i})">×</button>
                    </div>
                    <div style="display:flex; width:100%; gap:10px; margin-top:10px;">
                        <input type="range" min="0" max="100" value="${goal.progress}" onchange="updateGoal(${i}, this.value)" style="flex:1;">
                        <span>${goal.progress}%</span>
                    </div>
                </li>`;
        });
    }
    document.getElementById('add-goal').addEventListener('click', () => {
        const input = document.getElementById('goal-input');
        if (input.value.trim()) { goals.push({ name: input.value.trim(), progress: 0 }); input.value = ''; saveDash(); renderGoals(); }
    });
    window.updateGoal = (i, val) => { goals[i].progress = val; saveDash(); renderGoals(); };
    window.deleteGoal = (i) => { goals.splice(i, 1); saveDash(); renderGoals(); };
    document.getElementById('clear-goals').addEventListener('click', () => { if(confirm("Delete all goals?")) { goals = []; saveDash(); renderGoals(); }});

    let timerInterval, timeLeft = 25 * 60, isRunning = false;
    const timerDisplay = document.getElementById('timer-display');
    function updateTimer() {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }
    document.getElementById('start-timer').addEventListener('click', () => {
        if (isRunning) return; isRunning = true;
        timerInterval = setInterval(() => {
            timeLeft--; updateTimer();
            if (timeLeft <= 0) { clearInterval(timerInterval); isRunning = false; stats.sessions++; saveDash(); alert("Session complete!"); timeLeft = 25 * 60; updateTimer(); }
        }, 1000);
    });
    document.getElementById('pause-timer').addEventListener('click', () => { clearInterval(timerInterval); isRunning = false; });
    document.getElementById('reset-timer').addEventListener('click', () => { clearInterval(timerInterval); isRunning = false; timeLeft = 25 * 60; updateTimer(); });

    renderTodos(); renderHabits(); renderGoals(); updateStats(); updateTimer();


    // ==========================================
    // 3. WHITEBOARD LOGIC (WITH TOUCH SUPPORT)
    // ==========================================
    const canvas = document.getElementById('whiteboard-canvas');
    if(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let isDrawing = false;
        let currentTool = 'pencil';
        let zoomLevel = 1;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const savedCanvas = localStorage.getItem('whiteboard_data');
        if (savedCanvas) {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, 0, 0); };
            img.src = savedCanvas;
        }

        const tools = document.querySelectorAll('.tool-btn[id^="tool-"]');
        tools.forEach(btn => {
            btn.addEventListener('click', () => {
                tools.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                currentTool = btn.id.replace('tool-', '');
            });
        });

        // Universal coordinate getter (Mouse OR Touch)
        function getCoords(e) {
            const rect = canvas.getBoundingClientRect();
            let clientX = e.clientX;
            let clientY = e.clientY;
            
            if(e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            
            return { x: (clientX - rect.left) / zoomLevel, y: (clientY - rect.top) / zoomLevel };
        }

        function startDraw(e) {
            if (currentTool === 'text') return; // Handled separately
            isDrawing = true;
            const pos = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            
            ctx.lineWidth = document.getElementById('wb-size').value;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (currentTool === 'pencil') {
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = document.getElementById('wb-color').value;
            } else if (currentTool === 'highlighter') {
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = document.getElementById('wb-color').value;
            } else if (currentTool === 'eraser') {
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = '#ffffff'; 
            }
        }

        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault(); // Prevents mobile screen from scrolling while drawing
            const pos = getCoords(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }

        function endDraw() {
            if (isDrawing) {
                ctx.closePath();
                isDrawing = false;
                localStorage.setItem('whiteboard_data', canvas.toDataURL());
            }
        }

        // Mouse Events
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseout', endDraw);

        // Touch Events (MOBILE)
        canvas.addEventListener('touchstart', (e) => { if(e.touches.length === 1) { e.preventDefault(); startDraw(e); } }, {passive: false});
        canvas.addEventListener('touchmove', draw, {passive: false});
        canvas.addEventListener('touchend', endDraw);

        document.getElementById('wb-clear').addEventListener('click', () => {
            if(confirm("Clear whiteboard?")) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                localStorage.removeItem('whiteboard_data');
            }
        });
    }

    // ==========================================
    // 4. NOTES LOGIC
    // ==========================================
    let notes = JSON.parse(localStorage.getItem('notes_data')) || [];
    let activeNoteId = null;

    const noteListEl = document.getElementById('note-list');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteEditor = document.getElementById('note-editor');
    const searchInput = document.getElementById('note-search');

    function saveNotesData() { localStorage.setItem('notes_data', JSON.stringify(notes)); }

    function renderNotes(filter = '') {
        if(!noteListEl) return;
        noteListEl.innerHTML = '';
        const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(filter.toLowerCase()));
        filteredNotes.forEach(n => {
            const li = document.createElement('li');
            li.textContent = n.title || 'Untitled';
            if (n.id === activeNoteId) li.classList.add('active');
            li.onclick = () => { loadNote(n.id); };
            noteListEl.appendChild(li);
        });
    }

    function loadNote(id) {
        activeNoteId = id;
        const note = notes.find(n => n.id === id);
        if (note) {
            noteTitleInput.value = note.title;
            noteEditor.innerHTML = note.content;
            renderNotes(searchInput?.value || '');
        }
    }

    document.getElementById('add-note-btn')?.addEventListener('click', () => {
        const id = Date.now().toString();
        notes.push({ id, title: 'New Note', content: '' });
        saveNotesData();
        loadNote(id);
    });

    searchInput?.addEventListener('input', (e) => { renderNotes(e.target.value); });

    const saveCurrentNote = () => {
        if (!activeNoteId) return;
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
            note.title = noteTitleInput.value;
            note.content = noteEditor.innerHTML;
            saveNotesData();
        }
    };

    noteTitleInput?.addEventListener('keyup', () => { saveCurrentNote(); renderNotes(searchInput?.value || ''); });
    noteEditor?.addEventListener('keyup', saveCurrentNote);
    noteEditor?.addEventListener('mouseup', saveCurrentNote); 

    document.querySelectorAll('.ed-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.execCommand(btn.getAttribute('data-command'), false, null);
            noteEditor.focus(); saveCurrentNote();
        });
    });

    document.getElementById('ed-highlight')?.addEventListener('click', () => {
        document.execCommand('hiliteColor', false, '#fef08a');
        noteEditor.focus(); saveCurrentNote();
    });

    document.getElementById('ed-checklist')?.addEventListener('click', () => {
        document.execCommand('insertHTML', false, `<input type="checkbox"> `);
        noteEditor.focus(); saveCurrentNote();
    });

    renderNotes();
});
