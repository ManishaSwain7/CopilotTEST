// Test clicking on a game cell
setTimeout(() => {
    const centerCell = document.querySelector('.cell[data-index="4"]');
    if (centerCell) {
        centerCell.click();
        console.log('Clicked center cell');
        
        // Wait and try another move
        setTimeout(() => {
            const topLeftCell = document.querySelector('.cell[data-index="0"]');
            if (topLeftCell && !topLeftCell.classList.contains('occupied')) {
                topLeftCell.click();
                console.log('Clicked top-left cell');
            }
        }, 1500);
    }
}, 1000);
