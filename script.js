class GolfCoursePlanner {
    constructor() {
        this.canvas = document.getElementById('golf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.addPlayerBtn = document.getElementById('add-player');
        this.playerNameInput = document.getElementById('player-name');
        this.playerList = document.getElementById('player-list');
        this.currentPlayerName = document.getElementById('current-player-name');
        this.messages = document.getElementById('messages');
        this.scoreboardContent = document.getElementById('scoreboard-content');
        
        // Check if elements exist
        if (!this.addPlayerBtn) {
            console.error('Add player button not found!');
        }
        
        // Game state
        this.players = [];
        this.currentPlayerIndex = 0;
        this.camera = { x: 0, y: 0, scale: 1 };
        this.courseWidth = 3000;
        this.courseHeight = 2000;
        this.gameActive = false;
        this.turnDelay = 2000; // 2 seconds between shots
        this.lastShotTime = 0;
        
        // Course layout
        this.setupCourse();
        this.setupEventListeners();
        this.centerView(); // Initialize with proper view
        this.updateCanvas();
        this.gameLoop();
    }
    
    setupCourse() {
        // Start with empty holes - user will design each one!
        this.holes = [];
        
        // Create 18 basic hole templates that user can customize
        for (let i = 1; i <= 18; i++) {
            this.holes.push({
                id: i,
                tee: { x: 200 + (i - 1) * 150, y: 200 + (Math.floor((i - 1) / 6) * 500) },
                hole: { x: 300 + (i - 1) * 150, y: 400 + (Math.floor((i - 1) / 6) * 500) },
                par: 4, // Default par, user can change
                obstacles: [], // Start with no obstacles
                customFairway: null // User can design custom fairway
            });
        }

        // Add landscape features
        this.landscapeFeatures = [
            { x: 700, y: 700, width: 400, height: 200, type: 'water' },
            { x: 1000, y: 650, width: 300, height: 150, type: 'water' },
            { x: 50, y: 50, width: 200, height: 200, type: 'forest' },
            { x: 2700, y: 50, width: 250, height: 200, type: 'forest' },
            { x: 50, y: 1750, width: 200, height: 200, type: 'forest' },
            { x: 2700, y: 1750, width: 250, height: 200, type: 'forest' }
        ];

        // Enable designer mode by default
        this.designMode = true;
        this.selectedHoleIndex = 0; // Start with hole 1 selected
        this.obstacleMode = 'bunker'; // Current obstacle type to place
        this.isDraggingTee = false;
        this.isDraggingHole = false;
        
        // Calculate total par
        this.totalPar = this.holes.reduce((sum, hole) => sum + hole.par, 0);
    }
    
    selectHoleForDesign(holeIndex) {
        this.selectedHoleIndex = parseInt(holeIndex);
        document.getElementById('selected-hole').textContent = `Hole ${this.selectedHoleIndex + 1}`;
        document.getElementById('par-selector').value = this.holes[this.selectedHoleIndex].par;
        this.updateCanvas();
    }
    
    changeCurrentHolePar(newPar) {
        if (this.selectedHoleIndex >= 0) {
            this.holes[this.selectedHoleIndex].par = parseInt(newPar);
            this.totalPar = this.holes.reduce((sum, hole) => sum + hole.par, 0);
        }
    }
    
    setObstacleMode(type) {
        this.obstacleMode = type;
        console.log(`Obstacle mode set to: ${type}`);
    }
    
    clearCurrentHole() {
        if (this.selectedHoleIndex >= 0) {
            this.holes[this.selectedHoleIndex].obstacles = [];
            this.updateCanvas();
        }
    }
    
    // Function to check if two rectangles overlap
    checkOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x || 
                rect2.x + rect2.width < rect1.x || 
                rect1.y + rect1.height < rect2.y || 
                rect2.y + rect2.height < rect1.y);
    }
    
    // Get the bounding box for a hole (including tee, fairway, and obstacles)
    getHoleBounds(hole) {
        const minX = Math.min(hole.tee.x, hole.hole.x) - 200; // Extra padding
        const maxX = Math.max(hole.tee.x, hole.hole.x) + 200;
        const minY = Math.min(hole.tee.y, hole.hole.y) - 200;
        const maxY = Math.max(hole.tee.y, hole.hole.y) + 200;
        
        // Include obstacles in bounds
        if (hole.obstacles) {
            hole.obstacles.forEach(obstacle => {
                const obsMinX = obstacle.x - 50;
                const obsMaxX = obstacle.x + obstacle.width + 50;
                const obsMinY = obstacle.y - 50;
                const obsMaxY = obstacle.y + obstacle.height + 50;
                
                minX = Math.min(minX, obsMinX);
                maxX = Math.max(maxX, obsMaxX);
                minY = Math.min(minY, obsMinY);
                maxY = Math.max(maxY, obsMaxY);
            });
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    // Check if a hole overlaps with any existing holes
    holeOverlapsWithExisting(newHole, existingHoles) {
        const newBounds = this.getHoleBounds(newHole);
        
        for (let existingHole of existingHoles) {
            const existingBounds = this.getHoleBounds(existingHole);
            if (this.checkOverlap(newBounds, existingBounds)) {
                return true;
            }
        }
        return false;
    }
    
    createNonOverlappingHoles() {
        // Define hole templates with different configurations
        const holeTemplates = [
            // Template 1: Short par 4
            { par: 4, length: 300, obstacles: [
                {width: 120, height: 80, type: 'bunker'},
                {width: 60, height: 100, type: 'tree'}
            ]},
            // Template 2: Par 3 over water
            { par: 3, length: 200, obstacles: [
                {width: 150, height: 60, type: 'water'}
            ]},
            // Template 3: Long par 5
            { par: 5, length: 500, obstacles: [
                {width: 80, height: 120, type: 'tree'},
                {width: 180, height: 80, type: 'bunker'},
                {width: 100, height: 100, type: 'water'}
            ]},
            // Template 4: Medium par 4 with woods
            { par: 4, length: 350, obstacles: [
                {width: 100, height: 100, type: 'water'},
                {width: 50, height: 80, type: 'tree'}
            ]},
            // Template 5: Challenging par 3
            { par: 3, length: 180, obstacles: [
                {width: 100, height: 80, type: 'bunker'}
            ]},
            // Template 6: Strategic par 4
            { par: 4, length: 400, obstacles: [
                {width: 150, height: 120, type: 'water'},
                {width: 60, height: 100, type: 'tree'}
            ]}
        ];
        
        // Grid system to ensure no overlapping - divide course into sections
        const sectionsX = 6; // 6 columns
        const sectionsY = 3; // 3 rows
        const sectionWidth = this.courseWidth / sectionsX;
        const sectionHeight = this.courseHeight / sectionsY;
        
        // Create 18 holes using grid placement
        for (let i = 0; i < 18; i++) {
            const template = holeTemplates[i % holeTemplates.length];
            let attempts = 0;
            let validHole = null;
            
            // Try to place hole in available sections
            while (attempts < 100 && !validHole) {
                // Pick a grid section
                const sectionX = Math.floor(Math.random() * sectionsX);
                const sectionY = Math.floor(Math.random() * sectionsY);
                
                // Place within section with margins
                const margin = 100;
                const teeX = sectionX * sectionWidth + margin + Math.random() * (sectionWidth - 2 * margin);
                const teeY = sectionY * sectionHeight + margin + Math.random() * (sectionHeight - 2 * margin);
                
                // Calculate hole position based on template
                const angle = Math.random() * 2 * Math.PI; // Random direction
                const holeX = teeX + Math.cos(angle) * template.length;
                const holeY = teeY + Math.sin(angle) * template.length;
                
                // Make sure hole is within course bounds
                if (holeX < margin || holeX > this.courseWidth - margin ||
                    holeY < margin || holeY > this.courseHeight - margin) {
                    attempts++;
                    continue;
                }
                
                // Create obstacles along the fairway
                const obstacles = [];
                template.obstacles.forEach((obsTemplate, obsIndex) => {
                    const t = (obsIndex + 1) / (template.obstacles.length + 1);
                    const obsX = teeX + t * (holeX - teeX) + (Math.random() - 0.5) * 100;
                    const obsY = teeY + t * (holeY - teeY) + (Math.random() - 0.5) * 100;
                    
                    obstacles.push({
                        x: obsX,
                        y: obsY,
                        width: obsTemplate.width,
                        height: obsTemplate.height,
                        type: obsTemplate.type
                    });
                });
                
                const testHole = {
                    id: i + 1,
                    tee: { x: teeX, y: teeY },
                    hole: { x: holeX, y: holeY },
                    par: template.par,
                    obstacles: obstacles
                };
                
                // Check if this hole overlaps with existing holes
                if (!this.holeOverlapsWithExisting(testHole, this.holes)) {
                    validHole = testHole;
                }
                
                attempts++;
            }
            
            if (validHole) {
                this.holes.push(validHole);
                console.log(`Hole ${i + 1} placed successfully after ${attempts} attempts`);
            } else {
                console.error(`Could not place hole ${i + 1} without overlap!`);
                // Fallback: place in a guaranteed empty area
                const fallbackX = 300 + (i % 6) * 400;
                const fallbackY = 300 + Math.floor(i / 6) * 500;
                
                this.holes.push({
                    id: i + 1,
                    tee: { x: fallbackX, y: fallbackY },
                    hole: { x: fallbackX + 200, y: fallbackY + 200 },
                    par: 4,
                    obstacles: [{x: fallbackX + 100, y: fallbackY + 100, width: 80, height: 80, type: 'bunker'}]
                });
            }
        }
        
        console.log(`Successfully created ${this.holes.length} non-overlapping holes!`);
        
        // Add custom fairway paths to each hole (initially straight lines)
        this.holes.forEach(hole => {
            hole.customFairway = null; // Will store custom fairway points when designed
        });
        
        // Designer state
        this.designMode = false;
        this.selectedHole = null;
        this.isDrawingFairway = false;
        this.currentFairwayPath = [];
        
        // Calculate total par
        this.totalPar = this.holes.reduce((sum, hole) => sum + hole.par, 0);
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Add player button
        if (this.addPlayerBtn) {
            this.addPlayerBtn.addEventListener('click', () => {
                console.log('Add player button clicked!');
                this.addPlayer();
            });
            console.log('Add player button listener added');
        } else {
            console.error('Add player button not found!');
        }
        
        // Enter key in name input
        if (this.playerNameInput) {
            this.playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in name input');
                    this.addPlayer();
                }
            });
        }
        
        // Zoom controls with proper centering
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const centerBtn = document.getElementById('center-course');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 1.3);
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 1 / 1.3);
            });
        }
        
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                this.centerView();
            });
        }
        
        // Mouse wheel zoom with proper center point
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoomAt(mouseX, mouseY, zoomFactor);
        });
        
        // Improved camera panning
        let isPanning = false;
        let lastPanX = 0;
        let lastPanY = 0;
        let hasMoved = false;
        
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.camera.x) / this.camera.scale;
            const y = (e.clientY - rect.top - this.camera.y) / this.camera.scale;
            
            if (this.designMode && this.selectedHoleIndex >= 0) {
                // In design mode, handle hole editing
                const selectedHole = this.holes[this.selectedHoleIndex];
                
                // Check if clicking on tee
                const teeDistance = Math.sqrt((x - selectedHole.tee.x) ** 2 + (y - selectedHole.tee.y) ** 2);
                if (teeDistance < 30) {
                    this.isDraggingTee = true;
                    return;
                }
                
                // Check if clicking on hole
                const holeDistance = Math.sqrt((x - selectedHole.hole.x) ** 2 + (y - selectedHole.hole.y) ** 2);
                if (holeDistance < 30) {
                    this.isDraggingHole = true;
                    return;
                }
                
                // Check if clicking on obstacle to delete it
                for (let i = selectedHole.obstacles.length - 1; i >= 0; i--) {
                    const obstacle = selectedHole.obstacles[i];
                    if (x >= obstacle.x && x <= obstacle.x + obstacle.width &&
                        y >= obstacle.y && y <= obstacle.y + obstacle.height) {
                        selectedHole.obstacles.splice(i, 1);
                        this.updateCanvas();
                        return;
                    }
                }
                
                // Add new obstacle at click location
                selectedHole.obstacles.push({
                    x: x - 50,
                    y: y - 40,
                    width: 100,
                    height: 80,
                    type: this.obstacleMode
                });
                this.updateCanvas();
            } else {
                // Normal camera movement
                isPanning = true;
                hasMoved = false;
                lastPanX = e.clientX;
                lastPanY = e.clientY;
                this.canvas.style.cursor = 'grabbing';
            }
            e.preventDefault();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.camera.x) / this.camera.scale;
            const y = (e.clientY - rect.top - this.camera.y) / this.camera.scale;
            
            if (this.designMode && this.selectedHoleIndex >= 0) {
                // Handle dragging tee or hole
                if (this.isDraggingTee) {
                    this.holes[this.selectedHoleIndex].tee.x = x;
                    this.holes[this.selectedHoleIndex].tee.y = y;
                    this.updateCanvas();
                    return;
                } else if (this.isDraggingHole) {
                    this.holes[this.selectedHoleIndex].hole.x = x;
                    this.holes[this.selectedHoleIndex].hole.y = y;
                    this.updateCanvas();
                    return;
                }
            }
            
            if (isPanning) {
                const deltaX = e.clientX - lastPanX;
                const deltaY = e.clientY - lastPanY;
                
                // Only start panning after a small movement threshold
                if (!hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
                    hasMoved = true;
                }
                
                if (hasMoved) {
                    this.camera.x -= deltaX / this.camera.scale;
                    this.camera.y -= deltaY / this.camera.scale;
                    
                    // Constrain camera to reasonable bounds
                    this.constrainCamera();
                    
                    lastPanX = e.clientX;
                    lastPanY = e.clientY;
                    
                    this.updateCanvas();
                }
            } else {
                // Show grab cursor when hovering
                this.canvas.style.cursor = 'grab';
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.designMode) {
                // Stop dragging
                this.isDraggingTee = false;
                this.isDraggingHole = false;
            }
            
            isPanning = false;
            this.canvas.style.cursor = 'grab';
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isPanning = false;
            this.canvas.style.cursor = 'grab';
        });
        
        // Touch support for mobile devices
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                isPanning = true;
                hasMoved = false;
                lastPanX = touch.clientX;
                lastPanY = touch.clientY;
                e.preventDefault();
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (isPanning && e.touches.length === 1) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - lastPanX;
                const deltaY = touch.clientY - lastPanY;
                
                if (!hasMoved && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                    hasMoved = true;
                }
                
                if (hasMoved) {
                    this.camera.x -= deltaX / this.camera.scale;
                    this.camera.y -= deltaY / this.camera.scale;
                    
                    this.constrainCamera();
                    
                    lastPanX = touch.clientX;
                    lastPanY = touch.clientY;
                    
                    this.updateCanvas();
                }
                e.preventDefault();
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            isPanning = false;
            e.preventDefault();
        });
        
        // Course designer controls
        const designModeBtn = document.getElementById('design-mode');
        const exitDesignerBtn = document.getElementById('exit-designer');
        const clearFairwayBtn = document.getElementById('clear-fairway');
        const presetStraightBtn = document.getElementById('preset-straight');
        const presetDoglegLeftBtn = document.getElementById('preset-dogleg-left');
        const presetDoglegRightBtn = document.getElementById('preset-dogleg-right');
        const presetSCurveBtn = document.getElementById('preset-s-curve');
        const presetSharpLeftBtn = document.getElementById('preset-sharp-left');
        const presetSharpRightBtn = document.getElementById('preset-sharp-right');
        const presetUTurnBtn = document.getElementById('preset-u-turn');
        
        if (designModeBtn) {
            designModeBtn.addEventListener('click', () => this.enterDesignMode());
        }
        if (exitDesignerBtn) {
            exitDesignerBtn.addEventListener('click', () => this.exitDesignMode());
        }
        if (clearFairwayBtn) {
            clearFairwayBtn.addEventListener('click', () => this.clearCustomFairway());
        }
        if (presetStraightBtn) {
            presetStraightBtn.addEventListener('click', () => this.applyPreset('straight'));
        }
        if (presetDoglegLeftBtn) {
            presetDoglegLeftBtn.addEventListener('click', () => this.applyPreset('dogleg-left'));
        }
        if (presetDoglegRightBtn) {
            presetDoglegRightBtn.addEventListener('click', () => this.applyPreset('dogleg-right'));
        }
        if (presetSCurveBtn) {
            presetSCurveBtn.addEventListener('click', () => this.applyPreset('s-curve'));
        }
        if (presetSharpLeftBtn) {
            presetSharpLeftBtn.addEventListener('click', () => this.applyPreset('sharp-left'));
        }
        if (presetSharpRightBtn) {
            presetSharpRightBtn.addEventListener('click', () => this.applyPreset('sharp-right'));
        }
        if (presetUTurnBtn) {
            presetUTurnBtn.addEventListener('click', () => this.applyPreset('u-turn'));
        }
        
        console.log('Event listeners setup complete');
    }
    
    addPlayer() {
        console.log('addPlayer function called');
        const name = this.playerNameInput.value.trim();
        console.log('Player name:', name);
        
        if (name && name.length <= 12) {
            const color = this.generatePlayerColor(this.players.length);
            const player = {
                id: this.players.length,
                name: name,
                color: color,
                positions: this.holes.map(hole => ({x: hole.tee.x, y: hole.tee.y})),
                scores: new Array(18).fill(0),
                currentHole: 0,
                totalStrokes: 0,
                aiStyle: this.generateAIStyle()
            };
            
            this.players.push(player);
            this.playerNameInput.value = '';
            this.updatePlayerList();
            this.updateScoreboard();
            
            console.log('Player added:', player);
            console.log('Total players:', this.players.length);
            
            if (this.players.length === 1) {
                this.startGame();
            }
            
            this.showMessage(`${name} joined the game!`, 'success');
        } else if (!name) {
            this.showMessage('Please enter a player name', 'warning');
        } else {
            this.showMessage('Name must be 12 characters or less', 'warning');
        }
    }
    
    generateAIStyle() {
        const styles = [
            { accuracy: 0.8, power: 0.7, aggression: 0.6, name: 'Balanced' },
            { accuracy: 0.9, power: 0.5, aggression: 0.3, name: 'Precise' },
            { accuracy: 0.6, power: 0.9, aggression: 0.8, name: 'Power' },
            { accuracy: 0.7, power: 0.6, aggression: 0.9, name: 'Aggressive' },
            { accuracy: 0.95, power: 0.4, aggression: 0.2, name: 'Conservative' }
        ];
        return styles[Math.floor(Math.random() * styles.length)];
    }
    
    generatePlayerColor(index) {
        const colors = [
            '#FF6B35', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', 
            '#85C1E9', '#82E0AA', '#F8C471', '#EC7063', '#85929E'
        ];
        return colors[index % colors.length];
    }
    
    startGame() {
        this.currentPlayerIndex = 0;
        this.gameActive = true;
        this.lastShotTime = Date.now();
        this.updateGameState();
        this.centerView();
        this.showMessage('Game started! Players will take shots automatically.', 'success');
    }
    
    updatePlayerList() {
        this.playerList.innerHTML = '';
        this.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `player-item ${index === this.currentPlayerIndex ? 'active' : ''}`;
            playerDiv.style.borderLeftColor = player.color;
            
            playerDiv.innerHTML = `
                <div>
                    <div class="player-name">${player.name}</div>
                    <div class="player-score">Hole: ${player.currentHole + 1}/18 | Total: ${player.totalStrokes}</div>
                    <div class="player-style" style="font-size: 0.8em; color: #ccc;">${player.aiStyle.name} AI</div>
                </div>
                <button class="remove-player" onclick="golfGame.removePlayer(${player.id})">×</button>
            `;
            
            this.playerList.appendChild(playerDiv);
        });
    }
    
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0;
        }
        this.updatePlayerList();
        this.updateScoreboard();
        this.updateGameState();
        
        if (this.players.length === 0) {
            this.gameActive = false;
            this.showMessage('Add players to start the game!', 'warning');
        }
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    // Advanced zoom function that zooms toward a specific point
    zoomAt(mouseX, mouseY, zoomFactor) {
        // Calculate world position before zoom
        const worldX = (mouseX / this.camera.scale) + this.camera.x;
        const worldY = (mouseY / this.camera.scale) + this.camera.y;
        
        // Apply zoom with limits
        const newScale = Math.max(0.2, Math.min(5, this.camera.scale * zoomFactor));
        
        if (newScale !== this.camera.scale) {
            this.camera.scale = newScale;
            
            // Adjust camera position to keep the mouse point stationary
            this.camera.x = worldX - (mouseX / this.camera.scale);
            this.camera.y = worldY - (mouseY / this.camera.scale);
            
            this.constrainCamera();
            this.updateCanvas();
        }
    }
    
    // Constrain camera to reasonable bounds
    constrainCamera() {
        const margin = 300; // Allow some margin around the course
        const minX = -margin;
        const minY = -margin;
        const maxX = this.courseWidth + margin - this.canvas.width / this.camera.scale;
        const maxY = this.courseHeight + margin - this.canvas.height / this.camera.scale;
        
        this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
    }
    
    centerView() {
        // Center the camera on the course with a good overview
        this.camera.scale = Math.min(
            this.canvas.width / this.courseWidth,
            this.canvas.height / this.courseHeight
        ) * 0.9;
        
        this.camera.x = (this.courseWidth - this.canvas.width / this.camera.scale) / 2;
        this.camera.y = (this.courseHeight - this.canvas.height / this.camera.scale) / 2;
        
        this.constrainCamera();
        this.updateCanvas();
    }
    
    // AI shot calculation
    calculateAIShot(player) {
        const hole = this.holes[player.currentHole];
        const currentPos = player.positions[player.currentHole];
        const target = hole.hole;
        
        // Base direction toward hole
        let targetX = target.x;
        let targetY = target.y;
        
        // Check for obstacles in direct path and adjust
        const directPath = this.getDirectPath(currentPos, target);
        const obstacleInPath = this.checkPathForObstacles(directPath, hole.obstacles);
        
        if (obstacleInPath) {
            const alternativeTarget = this.findAlternativeTarget(currentPos, target, hole.obstacles);
            targetX = alternativeTarget.x;
            targetY = alternativeTarget.y;
        }
        
        // Calculate base shot
        const dx = targetX - currentPos.x;
        const dy = targetY - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply AI style adjustments
        const accuracy = player.aiStyle.accuracy;
        const powerStyle = player.aiStyle.power;
        const aggression = player.aiStyle.aggression;
        
        // Add some randomness based on accuracy
        const accuracyOffset = (1 - accuracy) * 50;
        const angleOffset = (Math.random() - 0.5) * accuracyOffset * Math.PI / 180;
        const powerOffset = (Math.random() - 0.5) * (1 - accuracy) * 0.3;
        
        // Calculate shot power based on distance and style
        const maxShotDistance = 200;
        let shotPower = Math.min(distance / maxShotDistance, 1);
        shotPower = shotPower * powerStyle + powerOffset;
        shotPower = Math.max(0.2, Math.min(1, shotPower));
        
        // Adjust for aggression
        if (aggression > 0.7 && distance > 150) {
            shotPower = Math.min(1, shotPower * 1.2);
        }
        
        // Calculate final angle
        let angle = Math.atan2(dy, dx) + angleOffset;
        
        // Apply shot
        const shotDistance = shotPower * maxShotDistance;
        const newX = currentPos.x + Math.cos(angle) * shotDistance;
        const newY = currentPos.y + Math.sin(angle) * shotDistance;
        
        return { x: newX, y: newY, power: shotPower };
    }
    
    getDirectPath(start, end) {
        const steps = 20;
        const path = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            path.push({
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t
            });
        }
        return path;
    }
    
    checkPathForObstacles(path, obstacles) {
        for (const point of path) {
            for (const obstacle of obstacles) {
                if (point.x >= obstacle.x && point.x <= obstacle.x + obstacle.width &&
                    point.y >= obstacle.y && point.y <= obstacle.y + obstacle.height) {
                    return true;
                }
            }
        }
        return false;
    }
    
    findAlternativeTarget(start, end, obstacles) {
        const angles = [-Math.PI/3, -Math.PI/6, Math.PI/6, Math.PI/3];
        const baseAngle = Math.atan2(end.y - start.y, end.x - start.x);
        
        for (const angleOffset of angles) {
            const testAngle = baseAngle + angleOffset;
            const testDistance = 150;
            const testTarget = {
                x: start.x + Math.cos(testAngle) * testDistance,
                y: start.y + Math.sin(testAngle) * testDistance
            };
            
            const testPath = this.getDirectPath(start, testTarget);
            if (!this.checkPathForObstacles(testPath, obstacles)) {
                return testTarget;
            }
        }
        
        const shorterDistance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) * 0.5;
        return {
            x: start.x + Math.cos(baseAngle) * shorterDistance,
            y: start.y + Math.sin(baseAngle) * shorterDistance
        };
    }
    
    executeAutomaticShot() {
        const player = this.getCurrentPlayer();
        if (!player || player.currentHole >= 18) {
            this.nextPlayer();
            return;
        }
        
        const shot = this.calculateAIShot(player);
        
        // Apply boundary constraints
        const boundedX = Math.max(50, Math.min(this.courseWidth - 50, shot.x));
        const boundedY = Math.max(50, Math.min(this.courseHeight - 50, shot.y));
        
        // Update player position
        player.positions[player.currentHole] = {x: boundedX, y: boundedY};
        player.scores[player.currentHole]++;
        player.totalStrokes++;
        
        // Check if ball is in hole
        const hole = this.holes[player.currentHole];
        const holeDistance = Math.sqrt(
            Math.pow(boundedX - hole.hole.x, 2) + Math.pow(boundedY - hole.hole.y, 2)
        );
        
        if (holeDistance <= 15) {
            this.showMessage(`${player.name} completed hole ${hole.id} in ${player.scores[player.currentHole]} strokes!`, 'success');
            player.currentHole++;
            
            if (player.currentHole >= 18) {
                this.showMessage(`${player.name} finished the course! Total: ${player.totalStrokes}`, 'success');
                this.checkGameEnd();
            }
        } else if (player.scores[player.currentHole] >= hole.par + 3) {
            player.currentHole++;
            this.showMessage(`${player.name} moved to next hole after ${player.scores[player.currentHole]} strokes`, 'warning');
        }
        
        this.updateScoreboard();
        this.updateCanvas();
        
        setTimeout(() => {
            this.nextPlayer();
        }, this.turnDelay);
    }
    
    nextPlayer() {
        if (this.players.length === 0) return;
        
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.updateGameState();
        
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer && currentPlayer.currentHole >= 18) {
            this.nextPlayer();
            return;
        }
        
        this.lastShotTime = Date.now();
    }
    
    checkGameEnd() {
        const finishedPlayers = this.players.filter(p => p.currentHole >= 18).length;
        if (finishedPlayers === this.players.length) {
            this.gameActive = false;
            
            const winner = this.players.reduce((best, player) => 
                player.totalStrokes < best.totalStrokes ? player : best
            );
            
            this.showMessage(`Game Over! ${winner.name} wins with ${winner.totalStrokes} strokes!`, 'success');
        }
    }
    
    updateGameState() {
        const player = this.getCurrentPlayer();
        
        if (player) {
            this.currentPlayerName.textContent = `${player.name} (${player.aiStyle.name})`;
        } else {
            this.currentPlayerName.textContent = '-';
        }
        
        this.updatePlayerList();
    }
    
    updateScoreboard() {
        if (this.players.length === 0) {
            this.scoreboardContent.innerHTML = '<p>No players yet</p>';
            return;
        }
        
        let html = '<table class="scorecard-table"><tr><th>Hole</th>';
        this.players.forEach(player => {
            html += `<th style="color: ${player.color}">${player.name}</th>`;
        });
        html += '</tr>';
        
        // Par row
        html += '<tr class="par-row"><td><strong>Par</strong></td>';
        this.holes.forEach(hole => {
            html += `<td>${hole.par}</td>`;
        });
        html += '</tr>';
        
        // Hole rows
        for (let i = 0; i < 18; i++) {
            html += `<tr><td>${i + 1}</td>`;
            this.players.forEach(player => {
                const score = player.scores[i] || '-';
                html += `<td>${score}</td>`;
            });
            html += '</tr>';
        }
        
        // Total row
        html += '<tr style="font-weight: bold;"><td>Total</td>';
        this.players.forEach(player => {
            html += `<td>${player.totalStrokes}</td>`;
        });
        html += '</tr></table>';
        
        this.scoreboardContent.innerHTML = html;
    }
    
    updateCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.canvas.style.cursor = 'grab';
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply camera transform
        this.ctx.save();
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw course background with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, this.courseWidth, this.courseHeight);
        gradient.addColorStop(0, '#2d5016');
        gradient.addColorStop(0.5, '#228B22');
        gradient.addColorStop(1, '#32CD32');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.courseWidth, this.courseHeight);
        
        // Draw large landscape features first (behind everything)
        if (this.landscapeFeatures) {
            this.landscapeFeatures.forEach(feature => {
                switch(feature.type) {
                    case 'water':
                        this.ctx.fillStyle = '#1565C0';
                        break;
                    case 'forest':
                        this.ctx.fillStyle = '#1B5E20';
                        break;
                    case 'bunker':
                        this.ctx.fillStyle = '#D4AF37';
                        break;
                }
                this.ctx.fillRect(feature.x, feature.y, feature.width, feature.height);
                
                // Add texture to landscape features
                if (feature.type === 'forest') {
                    this.ctx.fillStyle = '#0D4E15';
                    for (let i = 0; i < 20; i++) {
                        const treeX = feature.x + Math.random() * feature.width;
                        const treeY = feature.y + Math.random() * feature.height;
                        this.ctx.fillRect(treeX, treeY, 8, 12);
                    }
                } else if (feature.type === 'water') {
                    // Add water wave effect
                    this.ctx.fillStyle = '#0D47A1';
                    for (let i = 0; i < 15; i++) {
                        const waveX = feature.x + Math.random() * feature.width;
                        const waveY = feature.y + Math.random() * feature.height;
                        this.ctx.fillRect(waveX, waveY, 4, 2);
                    }
                }
            });
        }
        
        // Add grass texture pattern
        this.ctx.fillStyle = 'rgba(0, 100, 0, 0.1)';
        for (let x = 0; x < this.courseWidth; x += 40) {
            for (let y = 0; y < this.courseHeight; y += 40) {
                if (Math.random() > 0.7) {
                    this.ctx.fillRect(x, y, 20, 3);
                    this.ctx.fillRect(x + 10, y + 15, 15, 3);
                }
            }
        }
        
        // Draw course outline
        this.ctx.strokeStyle = '#1a5c1a';
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(5, 5, this.courseWidth - 10, this.courseHeight - 10);
        
        // Draw paths between holes
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
        this.ctx.lineWidth = 15;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        for (let i = 0; i < this.holes.length - 1; i++) {
            const currentHole = this.holes[i];
            const nextHole = this.holes[i + 1];
            this.ctx.moveTo(currentHole.hole.x, currentHole.hole.y);
            this.ctx.lineTo(nextHole.tee.x, nextHole.tee.y);
        }
        this.ctx.stroke();
        
        // Draw holes
        this.holes.forEach(hole => {
            this.drawHole(hole);
        });
        
        // Draw players
        this.players.forEach((player, index) => {
            this.drawPlayer(player, index === this.currentPlayerIndex);
        });
        
        // Draw course title
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText('Championship Golf Course', this.courseWidth / 2, 80);
        this.ctx.fillText('Championship Golf Course', this.courseWidth / 2, 80);
        
        this.ctx.restore();
    }
    
    drawHole(hole) {
        // Draw fairway - use custom path if available, otherwise straight line
        const fairwayWidth = 120; // Much wider fairways
        
        if (hole.customFairway && hole.customFairway.length > 1) {
            // Draw custom fairway path
            this.ctx.fillStyle = '#90EE90';
            this.ctx.strokeStyle = '#90EE90';
            this.ctx.lineWidth = fairwayWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(hole.customFairway[0].x, hole.customFairway[0].y);
            for (let i = 1; i < hole.customFairway.length; i++) {
                this.ctx.lineTo(hole.customFairway[i].x, hole.customFairway[i].y);
            }
            this.ctx.stroke();
        } else {
            // Draw standard straight fairway
            const dx = hole.hole.x - hole.tee.x;
            const dy = hole.hole.y - hole.tee.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            this.ctx.fillStyle = '#90EE90';
            this.ctx.save();
            this.ctx.translate(hole.tee.x, hole.tee.y);
            this.ctx.rotate(angle);
            this.ctx.fillRect(-fairwayWidth/2, -fairwayWidth/2, distance + fairwayWidth, fairwayWidth);
            this.ctx.restore();
        }
        
        // Draw tee box (larger)
        this.ctx.fillStyle = '#6B8E23';
        this.ctx.fillRect(hole.tee.x - 30, hole.tee.y - 30, 60, 60);
        this.ctx.strokeStyle = '#556B2F';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(hole.tee.x - 30, hole.tee.y - 30, 60, 60);
        
        // Draw green around hole (larger)
        this.ctx.fillStyle = '#7CFC00';
        this.ctx.beginPath();
        this.ctx.arc(hole.hole.x, hole.hole.y, 50, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw hole (larger)
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(hole.hole.x, hole.hole.y, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw hole rim (larger)
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(hole.hole.x, hole.hole.y, 12, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw flag pole
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(hole.hole.x + 8, hole.hole.y);
        this.ctx.lineTo(hole.hole.x + 8, hole.hole.y - 40);
        this.ctx.stroke();
        
        // Draw flag
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.moveTo(hole.hole.x + 8, hole.hole.y - 40);
        this.ctx.lineTo(hole.hole.x + 28, hole.hole.y - 30);
        this.ctx.lineTo(hole.hole.x + 8, hole.hole.y - 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw hole number (larger and more visible)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(hole.id.toString(), hole.tee.x, hole.tee.y - 30);
        this.ctx.fillText(hole.id.toString(), hole.tee.x, hole.tee.y - 30);
        
        // Highlight selected hole in design mode
        if (this.designMode && this.selectedHole === hole) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 6;
            this.ctx.beginPath();
            this.ctx.arc(hole.tee.x, hole.tee.y, 35, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw par (more visible)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(`Par ${hole.par}`, hole.hole.x, hole.hole.y - 50);
        this.ctx.fillText(`Par ${hole.par}`, hole.hole.x, hole.hole.y - 50);
        
        // Draw obstacles
        hole.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
        
        // Draw yardage
        const dx = hole.hole.x - hole.tee.x;
        const dy = hole.hole.y - hole.tee.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const yardage = Math.round(distance / 2); // Simplified yardage calculation
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${yardage} yards`, hole.tee.x + dx/2, hole.tee.y + dy/2);
    }
    
    drawObstacle(obstacle) {
        // Use radius-based drawing for circular obstacles
        const radius = obstacle.radius || Math.min(obstacle.width, obstacle.height) / 2;
        const centerX = obstacle.x + (obstacle.width || 0) / 2;
        const centerY = obstacle.y + (obstacle.height || 0) / 2;
        
        switch (obstacle.type) {
            case 'bunker':
                // Draw bunker with sand texture
                this.ctx.fillStyle = '#F4E4B5';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add sand texture with dots
                this.ctx.fillStyle = '#E6D19C';
                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * Math.PI * 2;
                    const r = radius * 0.7;
                    const x = centerX + Math.cos(angle) * r * Math.random();
                    const y = centerY + Math.sin(angle) * r * Math.random();
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Bunker edge
                this.ctx.strokeStyle = '#D2B48C';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
                
            case 'water':
                // Draw water with animated ripples
                this.ctx.fillStyle = '#4169E1';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add ripple effect
                const rippleCount = 3;
                for (let i = 0; i < rippleCount; i++) {
                    this.ctx.strokeStyle = `rgba(135, 206, 235, ${0.6 - i * 0.2})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    const rippleRadius = radius * (0.3 + i * 0.3);
                    this.ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
                
                // Water edge
                this.ctx.strokeStyle = '#191970';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
                
            case 'tree':
                // Draw tree trunk
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(centerX - 6, centerY - radius, 12, radius);
                
                // Draw tree canopy
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY - radius + 10, radius - 10, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add tree texture with multiple shades
                this.ctx.fillStyle = '#32CD32';
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const r = (radius - 10) * 0.6;
                    const x = centerX + Math.cos(angle) * r * Math.random();
                    const y = (centerY - radius + 10) + Math.sin(angle) * r * Math.random();
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Tree shadow
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.beginPath();
                this.ctx.ellipse(centerX + 5, centerY + 5, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            default:
                // Generic obstacle
                this.ctx.fillStyle = '#696969';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#2F4F4F';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
        }
    }
    
    drawPlayer(player, isActive) {
        const pos = player.positions[player.currentHole];
        if (!pos || player.currentHole >= 18) return;
        
        // Draw ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(pos.x + 2, pos.y + 2, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw ball
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw border for active player
        if (isActive) {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw pulsing effect
            const pulseRadius = 12 + Math.sin(Date.now() * 0.01) * 3;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw player name
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(player.name, pos.x, pos.y - 15);
        this.ctx.fillText(player.name, pos.x, pos.y - 15);
    }
    
    showMessage(message, type = 'info') {
        this.messages.textContent = message;
        this.messages.className = type;
        
        setTimeout(() => {
            if (this.messages.textContent === message) {
                this.messages.textContent = this.players.length > 0 ? 
                    'Players are playing automatically!' : 'Add players to start the game!';
                this.messages.className = '';
            }
        }, 4000);
    }
    
    gameLoop() {
        // Handle automatic shots
        if (this.gameActive && this.players.length > 0) {
            const currentTime = Date.now();
            if (currentTime - this.lastShotTime > this.turnDelay) {
                this.executeAutomaticShot();
                this.lastShotTime = currentTime;
            }
        }
        
        this.updateCanvas();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Course Designer Methods
    enterDesignMode() {
        this.designMode = true;
        this.gameActive = false; // Pause the game
        this.canvas.style.cursor = 'crosshair';
        
        // Show designer panel
        const designerPanel = document.getElementById('course-designer');
        if (designerPanel) {
            designerPanel.style.display = 'block';
        }
        
        // Update messages
        if (this.messages) {
            this.messages.textContent = 'Design Mode: Click on any hole number to select it, then choose a fairway preset.';
        }
        
        this.updateCanvas();
    }
    
    exitDesignMode() {
        this.designMode = false;
        this.selectedHole = null;
        this.canvas.style.cursor = 'grab';
        
        // Hide designer panel
        const designerPanel = document.getElementById('course-designer');
        if (designerPanel) {
            designerPanel.style.display = 'none';
        }
        
        // Update messages
        if (this.messages) {
            this.messages.textContent = this.players.length > 0 ? 
                'Game resumed! Watch the AI players compete.' : 
                'Click "Add Player" to start the game!';
        }
        
        // Resume game if players exist
        if (this.players.length > 0) {
            this.gameActive = true;
        }
        
        this.updateCanvas();
    }
    
    selectHole(hole) {
        this.selectedHole = hole;
        
        // Update selected hole display
        const selectedHoleSpan = document.getElementById('selected-hole');
        if (selectedHoleSpan) {
            selectedHoleSpan.textContent = `Hole ${hole.id} (Par ${hole.par})`;
        }
        
        console.log(`Selected hole ${hole.id}`);
    }
    
    clearCustomFairway() {
        if (this.selectedHole) {
            this.selectedHole.customFairway = null;
            this.updateCanvas();
            console.log(`Cleared custom fairway for hole ${this.selectedHole.id}`);
        }
    }
    
    applyPreset(presetType) {
        if (!this.selectedHole) {
            alert('Please select a hole first by clicking on its tee box (the brown square with the hole number).');
            return;
        }
        
        const hole = this.selectedHole;
        const tee = hole.tee;
        const target = hole.hole;
        const midX = (tee.x + target.x) / 2;
        const midY = (tee.y + target.y) / 2;
        const distance = Math.sqrt(Math.pow(target.x - tee.x, 2) + Math.pow(target.y - tee.y, 2));
        
        switch (presetType) {
            case 'straight':
                hole.customFairway = [
                    { x: tee.x, y: tee.y },
                    { x: target.x, y: target.y }
                ];
                break;
                
            case 'dogleg-left':
                const midLeftX = midX - 120;
                const midLeftY = midY;
                hole.customFairway = [
                    { x: tee.x, y: tee.y },
                    { x: midLeftX, y: midLeftY },
                    { x: target.x, y: target.y }
                ];
                break;
                
            case 'dogleg-right':
                const midRightX = midX + 120;
                const midRightY = midY;
                hole.customFairway = [
                    { x: tee.x, y: tee.y },
                    { x: midRightX, y: midRightY },
                    { x: target.x, y: target.y }
                ];
                break;
                
            case 's-curve':
                const quarter1X = tee.x + (target.x - tee.x) * 0.25;
                const quarter1Y = tee.y + (target.y - tee.y) * 0.25;
                const quarter3X = tee.x + (target.x - tee.x) * 0.75;
                const quarter3Y = tee.y + (target.y - tee.y) * 0.75;
                hole.customFairway = [
                    { x: tee.x, y: tee.y },
                    { x: quarter1X - 80, y: quarter1Y },
                    { x: midX + 80, y: midY },
                    { x: quarter3X - 80, y: quarter3Y },
                    { x: target.x, y: target.y }
                ];
                break;
                
            case 'sharp-left':
                const sharpLeftX = midX - 200;
                const sharpLeftY = midY - 50;
                hole.customFairway = [
                    { x: tee.x, y: tee.y },
                    { x: sharpLeftX, y: sharpLeftY },
                    { x: target.x, y: target.y }
                ];
                break;
                
            case 'sharp-right':
                const sharpRightX = midX + 200;
                const sharpRightY = midY - 50;
                hole.customFairway = [
                    { x: tee.x, y: tee.y },
                    { x: sharpRightX, y: sharpRightY },
                    { x: target.x, y: target.y }
                ];
                break;
                
            case 'u-turn':
                const uTurnX1 = midX - 150;
                const uTurnY1 = midY - 100;
                const uTurnX2 = midX + 150;
                const uTurnY2 = midY - 100;
                hole.customFairway = [
                    { x: tee.x, y: tee.y },
                    { x: uTurnX1, y: uTurnY1 },
                    { x: midX, y: midY - 150 },
                    { x: uTurnX2, y: uTurnY2 },
                    { x: target.x, y: target.y }
                ];
                break;
        }
        
        this.updateCanvas();
        console.log(`Applied ${presetType} preset to hole ${hole.id}`);
    }
    
    // Course Designer Methods
    enterDesignMode() {
        this.designMode = true;
        this.gameActive = false; // Pause the game
        this.selectedHole = null;
        
        // Show designer panel
        const designerPanel = document.getElementById('course-designer');
        if (designerPanel) {
            designerPanel.style.display = 'block';
        }
        
        // Update messages
        this.messages.textContent = 'Design Mode: Click on a hole number to select it, then choose a fairway style';
        
        // Change canvas click behavior for hole selection
        this.canvas.onclick = (e) => this.selectHoleForDesign(e);
    }
    
    exitDesignMode() {
        this.designMode = false;
        this.selectedHole = null;
        this.isDrawingFairway = false;
        this.currentFairwayPath = [];
        
        // Hide designer panel
        const designerPanel = document.getElementById('course-designer');
        if (designerPanel) {
            designerPanel.style.display = 'none';
        }
        
        // Update messages
        this.messages.textContent = this.players.length > 0 ? 'Game resumed!' : 'Click "Add Player" to start the game!';
        
        // Remove canvas click behavior
        this.canvas.onclick = null;
        
        // Update selected hole display
        document.getElementById('selected-hole').textContent = 'None';
    }
    
    selectHoleForDesign(e) {
        if (!this.designMode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        const worldX = (mouseX / this.camera.scale) + this.camera.x - this.canvas.width / (2 * this.camera.scale);
        const worldY = (mouseY / this.camera.scale) + this.camera.y - this.canvas.height / (2 * this.camera.scale);
        
        // Check which hole was clicked (look near tee positions)
        for (const hole of this.holes) {
            const distance = Math.sqrt(Math.pow(worldX - hole.tee.x, 2) + Math.pow(worldY - hole.tee.y, 2));
            if (distance < 50) { // 50 pixel radius for selection
                this.selectedHole = hole;
                document.getElementById('selected-hole').textContent = `Hole ${hole.id}`;
                this.messages.textContent = `Selected Hole ${hole.id} - Choose a fairway preset or draw custom path`;
                break;
            }
        }
    }
    
    clearCustomFairway() {
        if (this.selectedHole) {
            this.selectedHole.customFairway = null;
            this.messages.textContent = `Cleared custom fairway for Hole ${this.selectedHole.id}`;
        } else {
            this.messages.textContent = 'Please select a hole first';
        }
    }
    
    applyPreset(presetType) {
        if (!this.selectedHole) {
            this.messages.textContent = 'Please select a hole first';
            return;
        }
        
        const hole = this.selectedHole;
        const startX = hole.tee.x;
        const startY = hole.tee.y;
        const endX = hole.hole.x;
        const endY = hole.hole.y;
        
        switch (presetType) {
            case 'straight':
                hole.customFairway = [
                    {x: startX, y: startY},
                    {x: endX, y: endY}
                ];
                break;
                
            case 'dogleg-left':
                const midLeftX = (startX + endX) / 2 - 100;
                const midLeftY = (startY + endY) / 2;
                hole.customFairway = [
                    {x: startX, y: startY},
                    {x: midLeftX, y: midLeftY},
                    {x: endX, y: endY}
                ];
                break;
                
            case 'dogleg-right':
                const midRightX = (startX + endX) / 2 + 100;
                const midRightY = (startY + endY) / 2;
                hole.customFairway = [
                    {x: startX, y: startY},
                    {x: midRightX, y: midRightY},
                    {x: endX, y: endY}
                ];
                break;
        }
        
        this.messages.textContent = `Applied ${presetType} fairway to Hole ${hole.id}`;
    }
}

// Global reference for button clicks
let golfGame;

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    golfGame = new GolfCoursePlanner();
});