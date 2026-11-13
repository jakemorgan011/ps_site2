const obj_label = document.getElementById('obj-label');
const wav_label = document.getElementById('wav-label');
const obj_input = document.getElementById('obj-input');
const wav_input = document.getElementById('wav-input');

function setup_drag_drop(label, input) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event_name => {
        label.addEventListener(event_name, prevent_defaults, false);
    });

    function prevent_defaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(event_name => {
        label.addEventListener(event_name, () => {
            label.style.opacity = '0.7';
        }, false);
    });

    ['dragleave', 'drop'].forEach(event_name => {
        label.addEventListener(event_name, () => {
            label.style.opacity = '1';
        }, false);
    });

    label.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        input.files = files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }, false);
}

setup_drag_drop(obj_label, obj_input);
setup_drag_drop(wav_label, wav_input);
