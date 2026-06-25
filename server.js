const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'notes.json');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Read JSON File
const readNotesFromFile = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error("File read error:", error);
        return [];
    }
};

// Helper: Write JSON File
const writeNotesToFile = (notes) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
    } catch (error) {
        console.error("File write error:", error);
    }
};

// --- API ROUTES ---

// 1. Get all notes
app.get('/api/notes', (req, res) => {
    const notes = readNotesFromFile();
    notes.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(notes);
});

// 2. Add a new note
app.post('/api/notes', (req, res) => {
    const { date, text } = req.body;
    if (!date || !text) return res.status(400).json({ error: 'Date aur Text dono zaroori hain!' });

    const notes = readNotesFromFile();
    const newNote = { id: Date.now().toString(), date, text };
    notes.push(newNote);
    writeNotesToFile(notes);
    res.status(201).json(newNote);
});

// 3. Update/Edit a note
app.put('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    const { text, date } = req.body;

    let notes = readNotesFromFile();
    const noteIndex = notes.findIndex(note => note.id === id);

    if (noteIndex === -1) {
        return res.status(404).json({ error: 'Note nahi mila!' });
    }

    if (text) notes[noteIndex].text = text;
    if (date) notes[noteIndex].date = date;

    writeNotesToFile(notes);
    res.json({ message: 'Note successfully update ho gaya!' });
});

// 4. Delete a note
app.delete('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    let notes = readNotesFromFile();
    const initialLength = notes.length;
    notes = notes.filter(note => note.id !== id);

    if (notes.length === initialLength) return res.status(404).json({ error: 'Note nahi mila!' });

    writeNotesToFile(notes);
    res.json({ message: 'Note successfully delete ho gaya!' });
});

app.listen(PORT, () => console.log(`🚀 Server chal raha hai: http://localhost:${PORT}`));
