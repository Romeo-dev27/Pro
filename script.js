document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. GLOBAL SETTINGS & NAVIGATION
    // ==========================================
    const themeBtn = document.getElementById('theme-toggle');
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

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
    // 2. DASHBOARD LOGIC (Todos, Habits, Pomodoro, Resets)
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

    // Reset Stats
    document.getElementById('reset-stats').addEventListener('click', () => {
        if(confirm("Are you sure you want to reset your overall statistics to zero?")) {
            stats = { tasks: 0, sessions: 0 };
            saveDash();
        }
    });

    // Todos
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
    
    // Clear Todos
    document.getElementById('clear-todos').addEventListener('click', () => {
        if(confirm("Are you sure you want to delete all tasks?")) {
            todos = []; saveDash(); renderTodos();
        }
    });

    // Habits
    const habitList = document.getElementById('habit-list');
    function renderHabits() {
        habitList.innerHTML = '';
        const today = new Date().toDateString();
        habits.forEach((habit, i) => {
            const done = habit.lastCompleted === today;
            habitList.innerHTML += `
                <li>
                    <span>${habit.name} (Streak: ${habit.streak} 🔥)</span>
                    <button class="btn ${done ? 'secondary' : 'primary'} btn-sm" onclick="completeHabit(${i})" ${done ? 'disabled' : ''}>${done ? 'Done' : 'Complete'}</button>
                </li>`;
        });
    }
    document.getElementById('add-habit').addEventListener('click', () => {
        const input = document.getElementById('habit-input');
        if (input.value.trim()) { habits.push({ name: input.value.trim(), streak: 0, lastCompleted: null }); input.value = ''; saveDash(); renderHabits(); }
    });
    window.completeHabit = (i) => { habits[i].streak++; habits[i].lastCompleted = new Date().toDateString(); saveDash(); renderHabits(); };
    
    // Reset Habit Streaks
    document.getElementById('reset-habits').addEventListener('click', () => {
        if(confirm("Are you sure you want to reset all your habit streaks to zero?")) {
            habits.forEach(h => { h.streak = 0; h.lastCompleted = null; });
            saveDash(); renderHabits();
        }
    });

    // Goals
    const goalList = document.getElementById('goal-list');
    function renderGoals() {
        goalList.innerHTML = '';
        goals.forEach((goal, i) => {
            goalList.innerHTML += `
                <li style="flex-direction:column; align-items:flex-start;">
                    <div style="display:flex; justify-content:space-between; width:100%;"><span>${goal.name}</span><button class="delete-btn" onclick="deleteGoal(${i})">×</button></div>
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
    
    // Clear Goals
    document.getElementById('clear-goals').addEventListener('click', () => {
        if(confirm("Are you sure you want to delete all goals?")) {
            goals = []; saveDash(); renderGoals();
        }
    });

    // Pomodoro
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
    // 3. WHITEBOARD LOGIC
    // ==========================================
    const canvas = document.getElementById('whiteboard-canvas');
    if(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const wrapper = document.getElementById('canvas-wrapper');
        
        let isDrawing = false;
        let currentTool = 'pencil';
        let zoomLevel = 1;
        let history = [];
        let historyStep = -1;

        // Set initial background to white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load from LocalStorage
        const savedCanvas = localStorage.getItem('whiteboard_data');
        if (savedCanvas) {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, 0, 0); saveState(); };
            img.src = savedCanvas;
        } else {
            saveState();
        }

        // Tools setup
        const tools = document.querySelectorAll('.tool-btn[id^="tool-"]');
        tools.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tools.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                currentTool = btn.id.replace('tool-', '');
            });
        });

        // Drawing coordinates adjustment for zoom
        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) / zoomLevel,
                y: (e.clientY - rect.top) / zoomLevel
            };
        }

        canvas.addEventListener('mousedown', (e) => {
            if (currentTool === 'text') {
                handleTextTool(e);
                return;
            }
            isDrawing = true;
            const pos = getMousePos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            
            // Tool specific settings
            ctx.lineWidth = document.getElementById('wb-size').value;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (currentTool === 'pencil') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = document.getElementById('wb-color').value;
            } else if (currentTool === 'highlighter') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = document.getElementById('wb-color').value;
            } else if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = '#ffffff'; 
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing || currentTool === 'text') return;
            const pos = getMousePos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        });

        const stopDrawing = () => {
            if (isDrawing) {
                ctx.closePath();
                isDrawing = false;
                saveState();
                localStorage.setItem('whiteboard_data', canvas.toDataURL());
            }
        };
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Text Tool Logic
        const textInput = document.getElementById('text-tool-input');
        function handleTextTool(e) {
            if (textInput.style.display === 'block') return; 
            const pos = getMousePos(e);
            const rect = canvas.getBoundingClientRect();
            
            textInput.style.display = 'block';
            textInput.style.left = (rect.left + pos.x * zoomLevel) + 'px';
            textInput.style.top = (rect.top + pos.y * zoomLevel) + 'px';
            textInput.style.color = document.getElementById('wb-color').value;
            textInput.style.fontSize = (document.getElementById('wb-size').value * 5 * zoomLevel) + 'px';
            textInput.innerText = '';
            textInput.focus();

            textInput.onblur = () => {
                if (textInput.innerText.trim() !== '') {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = textInput.style.color;
                    ctx.font = `${document.getElementById('wb-size').value * 5}px sans-serif`;
                    ctx.textBaseline = 'top';
                    ctx.fillText(textInput.innerText, pos.x, pos.y);
                    saveState();
                    localStorage.setItem('whiteboard_data', canvas.toDataURL());
                }
                textInput.style.display = 'none';
            };
        }

        // Undo / Redo
        function saveState() {
            historyStep++;
            if (historyStep < history.length) { history.length = historyStep; }
            history.push(canvas.toDataURL());
        }
        
        document.getElementById('wb-undo').addEventListener('click', () => {
            if (historyStep > 0) {
                historyStep--;
                const canvasPic = new Image();
                canvasPic.src = history[historyStep];
                canvasPic.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(canvasPic, 0, 0);
                };
            }
        });

        document.getElementById('wb-redo').addEventListener('click', () => {
            if (historyStep < history.length - 1) {
                historyStep++;
                const canvasPic = new Image();
                canvasPic.src = history[historyStep];
                canvasPic.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(canvasPic, 0, 0);
                };
            }
        });

        document.getElementById('wb-clear').addEventListener('click', () => {
            if(confirm("Clear the entire whiteboard?")) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                saveState();
                localStorage.removeItem('whiteboard_data');
            }
        });

        // Zoom Controls
        const zoomText = document.getElementById('wb-zoom-level');
        function applyZoom() {
            canvas.style.transform = `scale(${zoomLevel})`;
            zoomText.innerText = Math.round(zoomLevel * 100) + '%';
        }
        document.getElementById('wb-zoom-in').addEventListener('click', () => { if(zoomLevel < 3) { zoomLevel += 0.2; applyZoom(); }});
        document.getElementById('wb-zoom-out').addEventListener('click', () => { if(zoomLevel > 0.4) { zoomLevel -= 0.2; applyZoom(); }});

        // Export / Import
        document.getElementById('wb-export').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'whiteboard.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });

        document.getElementById('wb-import').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    saveState();
                    localStorage.setItem('whiteboard_data', canvas.toDataURL());
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ==========================================
    // 4. NOTES LOGIC
    // ==========================================
    let folders = JSON.parse(localStorage.getItem('notes_folders')) || [{ id: '1', name: 'General' }];
    let notes = JSON.parse(localStorage.getItem('notes_data')) || [];
    let activeFolderId = folders[0]?.id || '1';
    let activeNoteId = null;

    const folderListEl = document.getElementById('folder-list');
    const noteListEl = document.getElementById('note-list');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteEditor = document.getElementById('note-editor');
    const searchInput = document.getElementById('note-search');

    function saveNotesData() {
        localStorage.setItem('notes_folders', JSON.stringify(folders));
        localStorage.setItem('notes_data', JSON.stringify(notes));
    }

    function renderFolders() {
        if(!folderListEl) return;
        folderListEl.innerHTML = '';
        folders.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f.name;
            if (f.id === activeFolderId) li.classList.add('active');
            li.onclick = () => { activeFolderId = f.id; activeNoteId = null; renderFolders(); renderNotes(); clearEditor(); };
            folderListEl.appendChild(li);
        });
    }

    function renderNotes(filter = '') {
        if(!noteListEl) return;
        noteListEl.innerHTML = '';
        const folderNotes = notes.filter(n => n.folderId === activeFolderId && n.title.toLowerCase().includes(filter.toLowerCase()));
        folderNotes.forEach(n => {
            const li = document.createElement('li');
            li.textContent = n.title || 'Untitled Note';
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
            renderNotes(searchInput.value);
        }
    }

    function clearEditor() {
        if(noteTitleInput) noteTitleInput.value = '';
        if(noteEditor) noteEditor.innerHTML = '';
    }

    // Event Listeners for Notes CRUD
    const addFolderBtn = document.getElementById('add-folder-btn');
    if(addFolderBtn) {
        addFolderBtn.addEventListener('click', () => {
            const name = prompt("Folder Name:");
            if (name) {
                const id = Date.now().toString();
                folders.push({ id, name });
                activeFolderId = id;
                saveNotesData(); renderFolders(); renderNotes(); clearEditor();
            }
        });
    }

    const addNoteBtn = document.getElementById('add-note-btn');
    if(addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            if (!activeFolderId) return alert("Select a folder first");
            const id = Date.now().toString();
            const newNote = { id, folderId: activeFolderId, title: 'New Note', content: '' };
            notes.push(newNote);
            saveNotesData();
            loadNote(id);
        });
    }

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderNotes(e.target.value);
        });
    }

    // Auto-save typing
    const saveCurrentNote = () => {
        if (!activeNoteId) return;
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
            note.title = noteTitleInput.value;
            note.content = noteEditor.innerHTML;
            saveNotesData();
        }
    };
    if(noteTitleInput) noteTitleInput.addEventListener('keyup', () => { saveCurrentNote(); renderNotes(searchInput.value); });
    if(noteEditor) {
        noteEditor.addEventListener('keyup', saveCurrentNote);
        noteEditor.addEventListener('mouseup', saveCurrentNote); 
    }

    // Rich Text Commands
    document.querySelectorAll('.ed-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd = btn.getAttribute('data-command');
            document.execCommand(cmd, false, null);
            noteEditor.focus();
            saveCurrentNote();
        });
    });

    const edHighlight = document.getElementById('ed-highlight');
    if(edHighlight) {
        edHighlight.addEventListener('click', () => {
            document.execCommand('hiliteColor', false, '#fef08a');
            noteEditor.focus();
            saveCurrentNote();
        });
    }

    const edChecklist = document.getElementById('ed-checklist');
    if(edChecklist) {
        edChecklist.addEventListener('click', () => {
            const checkboxHTML = `<input type="checkbox"> `;
            document.execCommand('insertHTML', false, checkboxHTML);
            noteEditor.focus();
            saveCurrentNote();
        });
    }

    const edImage = document.getElementById('ed-image');
    if(edImage) {
        edImage.addEventListener('click', () => {
            const url = prompt("Enter image URL:");
            if (url) {
                document.execCommand('insertImage', false, url);
                saveCurrentNote();
            }
        });
    }

    // Initialize Notes
    renderFolders();
    if (activeFolderId) renderNotes();

});
