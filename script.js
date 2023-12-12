window.onload = function() {
    let chk = document.getElementById('Toggle');
    let menuLinks = document.querySelectorAll('.menu a');
    menuLinks.forEach(function(item) {
        item.addEventListener('click', function() {chk.checked=false;});
    });
}
document.addEventListener('touchstart', onTouchStart, {passive: true});