// Paris Metro Map - Interactive Script

document.addEventListener('DOMContentLoaded', () => {
    const tooltip = document.getElementById('tooltip');
    const stations = document.querySelectorAll('.station');
    
    // Line colors mapping
    const lineColors = {
        '1': '#FFCE00',
        '2': '#0064B0',
        '3': '#9F9825',
        '3bis': '#98D4E2',
        '4': '#C04191',
        '5': '#F28E42',
        '6': '#83C491',
        '7': '#F3A4BA',
        '7bis': '#83C491',
        '8': '#CEADD2',
        '9': '#D5C900',
        '10': '#E3B32A',
        '11': '#8D5E2A',
        '12': '#007852',
        '13': '#87D3DF',
        '14': '#62259D',
        'RER': '#ffffff'
    };
    
    // Station hover effects
    stations.forEach(station => {
        const circle = station.querySelector('circle');
        const originalR = circle.getAttribute('r');
        const stationName = station.dataset.name;
        const stationLines = station.dataset.lines ? station.dataset.lines.split(',') : [];
        
        station.addEventListener('mouseenter', (e) => {
            // Enlarge station
            circle.setAttribute('r', parseFloat(originalR) * 1.5);
            
            // Add glow effect
            circle.style.filter = 'url(#glow-strong)';
            
            // Show tooltip
            showTooltip(e, stationName, stationLines);
            
            // Highlight connected lines
            highlightLines(stationLines);
        });
        
        station.addEventListener('mousemove', (e) => {
            updateTooltipPosition(e);
        });
        
        station.addEventListener('mouseleave', () => {
            // Reset station size
            circle.setAttribute('r', originalR);
            
            // Remove glow
            circle.style.filter = '';
            
            // Hide tooltip
            hideTooltip();
            
            // Reset line highlights
            resetLineHighlights();
        });
    });
    
    function showTooltip(e, name, lines) {
        // Create tooltip content
        let linesHTML = '';
        if (lines.length > 0) {
            linesHTML = '<div class="station-lines">';
            lines.forEach(line => {
                const color = lineColors[line.trim()] || '#ffffff';
                const textColor = isLightColor(color) ? '#000' : '#fff';
                linesHTML += `<span class="line-badge" style="background: ${color}; color: ${textColor};">Ligne ${line.trim()}</span>`;
            });
            linesHTML += '</div>';
        }
        
        tooltip.innerHTML = `
            <div class="station-name">${name}</div>
            ${linesHTML}
        `;
        
        updateTooltipPosition(e);
        tooltip.classList.add('visible');
    }
    
    function updateTooltipPosition(e) {
        const x = e.clientX;
        const y = e.clientY;
        const tooltipRect = tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Position tooltip to avoid going off screen
        let left = x + 15;
        let top = y - 10;
        
        if (left + tooltipRect.width > windowWidth - 20) {
            left = x - tooltipRect.width - 15;
        }
        
        if (top + tooltipRect.height > windowHeight - 20) {
            top = y - tooltipRect.height - 10;
        }
        
        if (top < 20) {
            top = 20;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
    
    function hideTooltip() {
        tooltip.classList.remove('visible');
    }
    
    function highlightLines(lines) {
        const allLines = document.querySelectorAll('.line');
        
        allLines.forEach(line => {
            let isConnected = false;
            lines.forEach(l => {
                if (line.classList.contains(`line-${l.trim()}`)) {
                    isConnected = true;
                }
            });
            
            if (!isConnected && lines.length > 0) {
                line.style.opacity = '0.3';
            } else {
                line.style.opacity = '1';
            }
        });
    }
    
    function resetLineHighlights() {
        const allLines = document.querySelectorAll('.line');
        allLines.forEach(line => {
            line.style.opacity = '1';
        });
    }
    
    function isLightColor(color) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5;
    }
    
    // Add subtle parallax effect to the map
    const mapContainer = document.querySelector('.map-container');
    
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        
        mapContainer.style.transform = `perspective(1000px) rotateY(${x * 0.5}deg) rotateX(${-y * 0.5}deg)`;
    });
    
    mapContainer.addEventListener('mouseleave', () => {
        mapContainer.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
    
    // Legend item hover - highlight corresponding line
    const legendItems = document.querySelectorAll('.legend-item');
    
    legendItems.forEach((item, index) => {
        const lineNames = ['1', '2', '3', '3bis', '4', '5', '6', '7', '7bis', '8', '9', '10', '11', '12', '13', '14'];
        const lineName = lineNames[index];
        
        item.addEventListener('mouseenter', () => {
            const allLines = document.querySelectorAll('.line');
            allLines.forEach(line => {
                if (line.classList.contains(`line-${lineName}`)) {
                    line.style.opacity = '1';
                    const path = line.querySelector('.metro-line');
                    if (path) {
                        path.style.strokeWidth = '10';
                        path.style.filter = `drop-shadow(0 0 15px ${lineColors[lineName]})`;
                    }
                } else {
                    line.style.opacity = '0.2';
                }
            });
            
            // Highlight stations on this line
            stations.forEach(station => {
                const stationLines = station.dataset.lines ? station.dataset.lines.split(',') : [];
                if (stationLines.some(l => l.trim() === lineName)) {
                    station.style.opacity = '1';
                    const circle = station.querySelector('circle');
                    circle.style.filter = 'url(#glow)';
                } else {
                    station.style.opacity = '0.3';
                }
            });
        });
        
        item.addEventListener('mouseleave', () => {
            const allLines = document.querySelectorAll('.line');
            allLines.forEach(line => {
                line.style.opacity = '1';
                const path = line.querySelector('.metro-line');
                if (path) {
                    path.style.strokeWidth = '';
                    path.style.filter = '';
                }
            });
            
            stations.forEach(station => {
                station.style.opacity = '1';
                const circle = station.querySelector('circle');
                circle.style.filter = '';
            });
        });
    });
    
    // Add entrance animation
    const svg = document.getElementById('metro-map');
    const lines = svg.querySelectorAll('.metro-line');
    const stationCircles = svg.querySelectorAll('.station circle');
    
    // Animate lines drawing
    lines.forEach((line, index) => {
        const length = line.getTotalLength();
        line.style.strokeDasharray = length;
        line.style.strokeDashoffset = length;
        line.style.animation = `drawLine 2s ease-out ${index * 0.1}s forwards`;
    });
    
    // Animate stations appearing
    stationCircles.forEach((circle, index) => {
        circle.style.opacity = '0';
        circle.style.animation = `fadeIn 0.5s ease-out ${1 + index * 0.02}s forwards`;
    });
    
    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes drawLine {
            to {
                stroke-dashoffset: 0;
            }
        }
        
        @keyframes fadeIn {
            to {
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});
