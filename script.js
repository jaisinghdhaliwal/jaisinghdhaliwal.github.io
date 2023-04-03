// Run once everything is loaded
window.onload = function() {
    // Get the checkbox
    let chk = document.getElementById('Toggle');
    // Get all menu links
    let menuLinks = document.querySelectorAll('.menu a');
    // Loop on links
    menuLinks.forEach(function(item) {
        // Add event listener to each links
        item.addEventListener('click', function() {
            // When link is clicked, uncheck the checkbox to hide menu
            chk.checked=false;
        });
    });
}