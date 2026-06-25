const noteForm = document.getElementById('noteForm');
const notesContainer = document.getElementById('notesContainer');
const noteDateInput = document.getElementById('noteDate');
const noteTextInput = document.getElementById('noteText');
const totalNotesBadge = document.getElementById('totalNotes');
const submitBtn = noteForm.querySelector('.btn-submit');

// Naye Filter ke elements
const filterDateInput = document.getElementById('filterDate');
const clearFilterBtn = document.getElementById('clearFilterBtn');

let editNoteId = null; 
let allNotes = []; // Server se aaye hue saare notes ko track karne ke liye global array

noteDateInput.valueAsDate = new Date();
document.addEventListener('DOMContentLoaded', fetchNotes);

// 1. Fetch Notes from Server
async function fetchNotes() {
    try {
        const res = await fetch('/api/notes');
        allNotes = await res.json(); // Saare notes global variable me save kiye
        applyFilterAndRender(); // Render handler chalaya
    } catch (err) {
        console.error("Fetch error:", err);
        notesContainer.innerHTML = `<p class="no-data">Server se connect nahi ho pa raha hai.</p>`;
    }
}

// 2. Real-time Filter apply karke layout print karna
function applyFilterAndRender() {
    const selectedFilterDate = filterDateInput.value; // Filter date fetch ki
    
    let filteredNotes = allNotes;

    // Agar user ne koi date select ki hai toh filter lagao
    if (selectedFilterDate) {
        filteredNotes = allNotes.filter(note => note.date === selectedFilterDate);
    }

    renderNotes(filteredNotes);
}

// 3. Render Cards inside HTML Grid
function renderNotes(notes) {
    notesContainer.innerHTML = '';
    totalNotesBadge.innerText = `${notes.length} Note${notes.length !== 1 ? 's' : ''}`;

    if (notes.length === 0) {
        notesContainer.innerHTML = `<p class="no-data">Koi note nahi mili. ${filterDateInput.value ? 'Kisi aur tarikh ko select karein.' : 'Nayi note banayein!'}</p>`;
        return;
    }

    notes.forEach(note => {
        const dateObj = new Date(note.date);
        const formattedDate = isNaN(dateObj) ? note.date : dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        const card = document.createElement('div');
        card.className = 'note-card';
        
        const safeText = btoa(unescape(encodeURIComponent(note.text)));

        card.innerHTML = `
            <div>
                <div class="note-date">${formattedDate}</div>
                <p class="note-text">${escapeHTML(note.text)}</p>
            </div>
            <div class="card-footer">
                <button class="btn-action-edit" onclick="triggerEdit('${note.id}', '${note.date}', '${safeText}')">
                    Edit
                </button>
                <button class="btn-action-delete" onclick="deleteNote('${note.id}')">
                    Delete
                </button>
            </div>
        `;
        notesContainer.appendChild(card);
    });
}

// --- EVENT LISTENERS FOR FILTER SYSTEM ---
// Jaise hi user filter date badlega, list automatic update ho jayegi (No refresh needed)
filterDateInput.addEventListener('input', applyFilterAndRender);

// Clear filter button controller
clearFilterBtn.addEventListener('click', () => {
    filterDateInput.value = ''; // Filter clear kiya
    applyFilterAndRender(); // Pure logs reload kiye
});


// 4. Form Submit Handler (Add or Edit Mode)
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = noteDateInput.value;
    const text = noteTextInput.value.trim();

    if (!date || !text) return;

    try {
        let res;
        if (editNoteId) {
            res = await fetch(`/api/notes/${editNoteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, text })
            });
        } else {
            res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, text })
            });
        }

        if (res.ok) {
            resetForm();
            fetchNotes();
        }
    } catch (err) {
        console.error("Save error:", err);
    }
});

// 5. Clicked Edit Trigger
function triggerEdit(id, date, encodedText) {
    editNoteId = id;
    noteDateInput.value = date;
    
    const decodedText = decodeURIComponent(escape(atob(encodedText)));
    noteTextInput.value = decodedText;
    
    submitBtn.classList.add('edit-mode');
    submitBtn.innerHTML = `<span>Update Note Karein</span>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    editNoteId = null;
    noteTextInput.value = '';
    noteDateInput.valueAsDate = new Date();
    submitBtn.classList.remove('edit-mode');
    submitBtn.innerHTML = `<span>Note Save Karein</span>`;
}

// 6. Delete Execution
async function deleteNote(id) {
    if (!confirm("Kya aap is note ko delete karna chahte hain?")) return;

    try {
        const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (editNoteId === id) resetForm();
            fetchNotes();
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
