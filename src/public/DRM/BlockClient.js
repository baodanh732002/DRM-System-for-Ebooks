document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    alert('Right click is disabled.');
}, false);

document.addEventListener('selectstart', function(e) {
    e.preventDefault();
}, false);

document.addEventListener('copy', function(e) {
    e.preventDefault();
});
document.addEventListener('cut', function(e) {
    e.preventDefault();
});

document.addEventListener('dragstart', function(e) {
    if (e.target.nodeName === 'IMG') {
        e.preventDefault();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) || 
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) || 
        (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) || 
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
        
        e.preventDefault();
        alert('Inspect element is disabled.');
    }

    if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
    }

    if (e.key === 'PrintScreen') {
        showOverlay();
    }
});


