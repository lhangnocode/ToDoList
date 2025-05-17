document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const summaryElement = document.getElementById('summary');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterButtons = document.querySelectorAll('.filter');
    
    // Initialize todos from localStorage or empty array
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';

    //* them vao de xu ly phan sua cac to do
    let editingId = null;
    
    // Initial render
    renderTodos();
    updateSummary();
    
    // Event listeners
    addButton.addEventListener('click', addTodo);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentFilter = this.dataset.filter;
            
            // Update active class
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            renderTodos();
        });
    });
    
    // Functions
    function addTodo() {
        const taskText = taskInput.value.trim();
        
        if (taskText === '') return;
        
        // Check if editing
        if (editingId) {        
            todos = todos.map(todo => {
                if (todo.id === editingId) {
                    return { ...todo, text: taskText };
                }
                return todo;
            });
            editingId = null; // Reset editing ID
            addButton.textContent = 'Thêm';
        } else {
            const newTodo = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date()
            };
            
            todos.push(newTodo);
        }
        // Save to localStorage
        saveTodos();
        renderTodos();
        updateSummary();
        
        taskInput.value = '';
        taskInput.focus();
    }

    function editTodo(id) {
        const todoToEdit = todos.find(todo => todo.id === id);
        if (todoToEdit) {
            taskInput.value = todoToEdit.text;
            taskInput.focus();  //* giup dat con tro vao o input
            editingId = id; // Set editing ID
            addButton.textContent = 'Cập nhật';
        }
    }
    
    function cancelEdit() {
        taskInput.value = '';
        editingId = null; // Reset editing ID
        addButton.textContent = 'Thêm';
    }

    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        
        saveTodos();
        renderTodos();
        updateSummary();
    }
    
    function deleteTodo(id) {
       // Nếu đang sửa task này, hủy chế độ sửa
        if (editingId === id) {
            cancelEdit();
        }
        
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
        updateSummary();
    }
    
    function clearCompleted() {
        const completedIds = todos.filter(todo => todo.completed).map(todo => todo.id);
        if (editingId !== null && completedIds.includes(editingId)) {
            cancelEdit();
        }
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateSummary();
    }
    
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    function renderTodos() {
        todoList.innerHTML = '';
        
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'active') {
                return !todo.completed;
            } else if (currentFilter === 'completed') {
                return todo.completed;
            }
            return true;
        });
        
        if (filteredTodos.length === 0) {
            todoList.innerHTML = '<div class="empty-list">Không có công việc nào</div>';
            return;
        }
        
        filteredTodos.forEach(todo => {
            const todoItem = document.createElement('li');
            todoItem.classList.add('todo-item');
            if (todo.completed) {
                todoItem.classList.add('completed');
            }
            //* highlight task being edited
            if (todo.id === editingId) {
                todoItem.classList.add('editing');
            }
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('checkbox');
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => toggleTodo(todo.id));
            
            const taskText = document.createElement('span');
            taskText.classList.add('task-text');
            taskText.textContent = todo.text;

            //them button sua
            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-btn');
            editBtn.textContent = 'Sửa';
            editBtn.addEventListener('click', () => editTodo(todo.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'Xóa';
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
            
            todoItem.appendChild(checkbox);
            todoItem.appendChild(taskText);
            todoItem.appendChild(editBtn);
            todoItem.appendChild(deleteBtn);
            todoList.appendChild(todoItem);
        });
    }
    
    function updateSummary() {
        const totalTasks = todos.length;
        const completedTasks = todos.filter(todo => todo.completed).length;
        const activeTasks = totalTasks - completedTasks;
        
        summaryElement.textContent = `Tổng số: ${totalTasks} | Hoàn thành: ${completedTasks} | Còn lại: ${activeTasks}`;
    }
});