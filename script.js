document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const summaryElement = document.getElementById('summary');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterButtons = document.querySelectorAll('.filter');
    
    // Tạo nút hủy
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-button';
    cancelButton.textContent = 'Hủy';
    cancelButton.style.display = 'none'; // Ẩn ban đầu
    cancelButton.classList.add('cancel-btn');
    addButton.after(cancelButton); // Thêm nút hủy vào sau nút thêm

    // Initialize todos from localStorage or empty array
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let editingId = null;
    
    // Initial render
    renderTodos();
    updateSummary();
    
    // Event listeners
    addButton.addEventListener('click', addTodo);
    cancelButton.addEventListener('click', cancelEdit); // Thêm sự kiện cho nút hủy
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
        if (e.key === 'Escape') {
            cancelEdit();
        }
    });

    // Thêm event listener cho phím Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && editingId !== null) {
            cancelEdit();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
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
            cancelButton.style.display = 'none'; // Ẩn nút hủy
        } else {
            // Thêm thuộc tính order khi tạo task mới
            const order = todos.length > 0 ? Math.max(...todos.map(todo => todo.order || 0)) + 1 : 0;
            const newTodo = {
                id: Date.now(),
                text: taskText,
                completed: false,
                createdAt: new Date(),
                order: order
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
            taskInput.focus();
            editingId = id; // Set editing ID
            addButton.textContent = 'Cập nhật';
            cancelButton.style.display = 'block'; // Hiển thị nút hủy
        }
    }
    
    function cancelEdit() {
        taskInput.value = '';
        editingId = null; // Reset editing ID
        addButton.textContent = 'Thêm';
        cancelButton.style.display = 'none'; // Ẩn nút hủy
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
    
    // CẢI THIỆN: Hiệu ứng kéo thả tối ưu hóa
    function initDragAndDrop() {
        const todoItems = document.querySelectorAll('.todo-item');
        
        // Tạo một placeholder tái sử dụng
        const placeholder = document.createElement('div');
        placeholder.classList.add('drop-area');
        let isDragging = false;
        
        todoItems.forEach(item => {
            const dragHandle = item.querySelector('.drag-handle');
            
            if (dragHandle) {
                dragHandle.addEventListener('mousedown', handleDragStart);
                
                // Thêm touch events cho thiết bị di động
                dragHandle.addEventListener('touchstart', handleDragStart, { passive: false });
                
                function handleDragStart(e) {
                    // Ngăn các hành vi mặc định và chỉ xử lý với chuột trái
                    if ((e.type === 'mousedown' && e.button !== 0) || 
                        (e.type === 'touchstart' && e.touches.length !== 1)) {
                        return;
                    }
                    
                    e.preventDefault();
                    
                    if (isDragging) return; // Ngăn nhiều lần kéo cùng lúc
                    isDragging = true;
                    
                    const todoItem = this.closest('.todo-item');
                    const todoItemRect = todoItem.getBoundingClientRect();
                    const listRect = todoList.getBoundingClientRect();
                    
                    // Tạo bản sao ảo mà không thêm vào DOM (giảm reflow)
                    const ghost = todoItem.cloneNode(true);
                    ghost.classList.add('dragging');
                    ghost.style.position = 'fixed';
                    ghost.style.width = `${todoItemRect.width}px`;
                    ghost.style.height = `${todoItemRect.height}px`;
                    ghost.style.zIndex = '1000';
                    ghost.style.opacity = '0.8';
                    ghost.style.pointerEvents = 'none'; // Tránh sự kiện chuột trên ghost
                    
                    // Vị trí ban đầu
                    let startX, startY;
                    if (e.type === 'touchstart') {
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                    } else {
                        startX = e.clientX;
                        startY = e.clientY;
                    }
                    
                    // Offset trong item được click
                    const offsetX = startX - todoItemRect.left;
                    const offsetY = startY - todoItemRect.top;
                    
                    // Đặt vị trí ban đầu cho ghost
                    updateGhostPosition(startX, startY);
                    
                    // Thêm ghost vào body (không phải vào todoList)
                    document.body.appendChild(ghost);
                    
                    // Ẩn item gốc nhưng giữ không gian (visibility)
                    todoItem.style.visibility = 'hidden';
                    
                    // Thêm placeholder vào vị trí hiện tại
                    todoList.insertBefore(placeholder, todoItem.nextSibling);
                    
                    // Hàm cập nhật vị trí ghost
                    function updateGhostPosition(clientX, clientY) {
                        ghost.style.left = `${clientX - offsetX}px`;
                        ghost.style.top = `${clientY - offsetY}px`;
                    }
                    
                    // Mouse và Touch handlers
                    function onMove(e) {
                        let clientX, clientY;
                        if (e.type === 'touchmove') {
                            e.preventDefault(); // Ngăn cuộn trang
                            clientX = e.touches[0].clientX;
                            clientY = e.touches[0].clientY;
                        } else {
                            clientX = e.clientX;
                            clientY = e.clientY;
                        }
                        
                        // Cập nhật vị trí ghost
                        updateGhostPosition(clientX, clientY);
                        
                        // Xử lý vị trí placeholder - sử dụng requestAnimationFrame
                        updatePlaceholderPosition(clientY);
                    }
                    
                    // Throttled function cho việc cập nhật placeholder
                    let lastUpdateTime = 0;
                    const throttleDelay = 50; // 50ms throttle
                    
                    function updatePlaceholderPosition(clientY) {
                        const now = Date.now();
                        if (now - lastUpdateTime < throttleDelay) return;
                        lastUpdateTime = now;
                        
                        // Cache lại danh sách các item
                        const currentItems = [...todoList.querySelectorAll('.todo-item:not(.dragging)')];
                        
                        // Dừng nếu không có items
                        if (currentItems.length === 0) return;
                        
                        // Tìm vị trí thích hợp cho placeholder
                        let targetItem = null;
                        
                        // Kiểm tra vị trí ở đầu danh sách
                        const firstItem = currentItems[0];
                        const firstItemRect = firstItem.getBoundingClientRect();
                        
                        if (clientY < firstItemRect.top + firstItemRect.height / 2) {
                            targetItem = firstItem;
                        } else {
                            // Kiểm tra các vị trí khác
                            for (let i = 0; i < currentItems.length - 1; i++) {
                                const currentRect = currentItems[i].getBoundingClientRect();
                                const nextRect = currentItems[i + 1].getBoundingClientRect();
                                
                                if (clientY > currentRect.top + currentRect.height / 2 && 
                                    clientY < nextRect.top + nextRect.height / 2) {
                                    targetItem = currentItems[i + 1];
                                    break;
                                }
                            }
                        }
                        
                        // Di chuyển placeholder nếu cần
                        if (targetItem) {
                            todoList.insertBefore(placeholder, targetItem);
                        } else {
                            // Nếu kéo xuống dưới cùng
                            const lastItem = currentItems[currentItems.length - 1];
                            const lastItemRect = lastItem.getBoundingClientRect();
                            
                            if (clientY > lastItemRect.top + lastItemRect.height / 2) {
                                todoList.appendChild(placeholder);
                            }
                        }
                    }
                    
                    function onEnd() {
                        if (!isDragging) return;
                        isDragging = false;
                        
                        // Khôi phục visibility cho item ban đầu
                        todoItem.style.visibility = '';
                        
                        // Xóa ghost
                        if (ghost.parentNode) {
                            ghost.parentNode.removeChild(ghost);
                        }
                        
                        // Xác định vị trí mới dựa trên placeholder
                        if (placeholder.parentNode) {
                            // Di chuyển item thật tới vị trí placeholder
                            todoList.insertBefore(todoItem, placeholder);
                            placeholder.parentNode.removeChild(placeholder);
                            
                            // Cập nhật thứ tự trong mảng
                            const todoId = parseInt(todoItem.dataset.id);
                            const newIndex = Array.from(todoList.children).indexOf(todoItem);
                            
                            // Cập nhật thứ tự trong mảng todos
                            updateTodoOrder(todoId, newIndex);
                        }
                        
                        // Xóa tất cả event listeners
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('touchmove', onMove);
                        document.removeEventListener('mouseup', onEnd);
                        document.removeEventListener('touchend', onEnd);
                        document.removeEventListener('touchcancel', onEnd);
                    }
                    
                    // Thêm event listeners
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('touchmove', onMove, { passive: false });
                    document.addEventListener('mouseup', onEnd);
                    document.addEventListener('touchend', onEnd);
                    document.addEventListener('touchcancel', onEnd);
                }
            }
        });
    }
    
    // Cập nhật thứ tự todos dựa trên sắp xếp mới
    function updateTodoOrder(movedTodoId, newIndex) {
        // Lấy todo đang được di chuyển
        const movedTodo = todos.find(todo => todo.id === movedTodoId);
        if (!movedTodo) return;
        
        // Lọc ra tất cả các todos trừ cái đang di chuyển
        const otherTodos = todos.filter(todo => todo.id !== movedTodoId);
        
        // Chèn todo đang di chuyển vào vị trí mới
        otherTodos.splice(newIndex, 0, movedTodo);
        
        // Cập nhật lại thứ tự cho tất cả các todos
        todos = otherTodos.map((todo, index) => ({
            ...todo,
            order: index
        }));
        
        // Lưu vào localStorage
        saveTodos();
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

        // Sắp xếp theo thứ tự
        filteredTodos.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        filteredTodos.forEach(todo => {
            const todoItem = document.createElement('li');
            todoItem.classList.add('todo-item');
            todoItem.dataset.id = todo.id;
            
            if (todo.completed) {
                todoItem.classList.add('completed');
            }
            
            if (todo.id === editingId) {
                todoItem.classList.add('editing');
            }

            // Tạo handle kéo thả
            const dragHandle = document.createElement('div');
            dragHandle.classList.add('drag-handle');
            dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
            if (!dragHandle.querySelector('i').classList.contains('fas')) {
                dragHandle.innerHTML = '≡';
            }
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('checkbox');
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => toggleTodo(todo.id));
            
            const taskText = document.createElement('span');
            taskText.classList.add('task-text');
            taskText.textContent = todo.text;

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-btn');
            editBtn.textContent = 'Sửa';
            editBtn.addEventListener('click', () => editTodo(todo.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'Xóa';
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
            
            todoItem.appendChild(dragHandle);
            todoItem.appendChild(checkbox);
            todoItem.appendChild(taskText);
            todoItem.appendChild(editBtn);
            todoItem.appendChild(deleteBtn);
            todoList.appendChild(todoItem);
        });

        // Khởi tạo kéo thả sau khi render các item
        initDragAndDrop();
    }
    
    function updateSummary() {
        const totalTasks = todos.length;
        const completedTasks = todos.filter(todo => todo.completed).length;
        const activeTasks = totalTasks - completedTasks;
        
        summaryElement.textContent = `Tổng số: ${totalTasks} | Hoàn thành: ${completedTasks} | Còn lại: ${activeTasks}`;
    }
});