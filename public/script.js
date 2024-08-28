document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();

    document.getElementById('add-task-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const taskInput = document.getElementById('task-input');
        const prioritySelect = document.getElementById('priority-select');
        const taskText = taskInput.value.trim();
        const taskPriority = prioritySelect.value;
        if (taskText) {
            try {
                await addTask(taskText, taskPriority);
                taskInput.value = ''; // Clear input field after adding
                await fetchTasks(); // Re-fetch tasks to update the list
            } catch (error) {
                console.error('Error adding task:', error);
            }
        }
    });

    document.querySelector('.filter-container').addEventListener('click', async (event) => {
        if (event.target.tagName === 'BUTTON') {
            const filter = event.target.getAttribute('data-filter');
            try {
                await filterTasks(filter, document.getElementById('priority-filter').value);
            } catch (error) {
                console.error('Error filtering tasks:', error);
            }
        }
    });

    document.getElementById('priority-filter').addEventListener('change', async (event) => {
        try {
            await filterTasks(document.querySelector('.filter-container .active')?.getAttribute('data-filter'), event.target.value);
        } catch (error) {
            console.error('Error filtering tasks:', error);
        }
    });
});

async function fetchTasks() {
    try {
        const response = await fetch('/tasks');
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

async function addTask(taskText, taskPriority) {
    try {
        await fetch('/add-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ task: taskText, priority: taskPriority }),
        });
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

async function filterTasks(status, priority) {
    try {
        const url = new URL('/filter-tasks', window.location.origin);
        if (status) url.searchParams.append('status', status);
        if (priority) url.searchParams.append('priority', priority);
        
        const response = await fetch(url);
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error filtering tasks:', error);
    }
}

async function editTask(taskId, newText, newPriority) {
    try {
        await fetch('/edit-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ id: taskId, text: newText, priority: newPriority }),
        });
        await fetchTasks(); // Re-fetch tasks to update the list
    } catch (error) {
        console.error('Error editing task:', error);
    }
}

async function toggleComplete(taskId) {
    try {
        await fetch('/toggle-complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ id: taskId }),
        });
        await fetchTasks(); // Re-fetch tasks to update the list
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

async function deleteTask(taskId) {
    try {
        await fetch('/delete-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ id: taskId }),
        });
        await fetchTasks(); // Re-fetch tasks to update the list
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    const completedTaskList = document.getElementById('completed-task-list');
    taskList.innerHTML = '';
    completedTaskList.innerHTML = '';

    tasks.forEach(task => {
        const listItem = document.createElement('li');
        listItem.classList.toggle('completed', task.completed);

        // Format completion date to Indian Time Zone
        let completionTime = '';
        if (task.completed && task.completedAt) {
            const date = new Date(task.completedAt);
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' };
            completionTime = date.toLocaleString('en-IN', options);
        }

        listItem.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <span class="task-priority">${task.priority}</span>
            ${task.completed ? `<span class="completed-time">Completed at: ${completionTime}</span>` : ''}
            <button class="edit-button">Edit</button>
            <button class="delete-button">Delete</button>
        `;

        const checkbox = listItem.querySelector('input[type="checkbox"]');
        const editButton = listItem.querySelector('.edit-button');
        const deleteButton = listItem.querySelector('.delete-button');

        checkbox.addEventListener('change', async () => {
            await toggleComplete(task._id);
            await fetchTasks(); // Re-fetch tasks to update the list
        });

        editButton.addEventListener('click', () => {
            const newTaskText = prompt('Edit your task:', task.text);
            const newPriority = prompt('Edit priority (Low, Medium, High):', task.priority);
            if (newTaskText) {
                editTask(task._id, newTaskText, newPriority);
            }
        });

        deleteButton.addEventListener('click', async () => {
            await deleteTask(task._id);
            await fetchTasks(); // Re-fetch tasks to update the list
        });

        if (task.completed) {
            completedTaskList.appendChild(listItem);
        } else {
            taskList.appendChild(listItem);
        }
    });
}
