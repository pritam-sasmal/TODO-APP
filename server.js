const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/todo-app').then(() => {
    console.log("Server connected");
}).catch((error) => {
    console.error('Database connection error:', error);
});

const taskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    completedAt: { type: Date } 
});

const Task = mongoose.model('Task', taskSchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/tasks', async (req, res) => {
    const tasks = await Task.find();
    res.json(tasks);
});

app.post('/add-task', async (req, res) => {
    const taskText = req.body.task.trim();
    const taskPriority = req.body.priority || 'Low';
    if (taskText) {
        const newTask = new Task({ text: taskText, priority: taskPriority });
        await newTask.save();
    }
    res.redirect('/');
});

app.post('/toggle-complete', async (req, res) => {
    const taskId = req.body.id;
    const task = await Task.findById(taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null; 
        await task.save();
    }
    res.redirect('/');
});

app.post('/edit-task', async (req, res) => {
    const { id, text, priority } = req.body;
    await Task.findByIdAndUpdate(id, { text, priority });
    res.redirect('/');
});

app.get('/filter-tasks', async (req, res) => {
    const { status, priority } = req.query;
    let query = {};

    if (status && status !== 'all') {
        query.completed = status === 'completed';
    }

    if (priority) {
        query.priority = priority;
    }

    try {
        const tasks = await Task.find(query);
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/delete-task', async (req, res) => {
    const taskId = req.body.id;
    await Task.findByIdAndDelete(taskId);
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
