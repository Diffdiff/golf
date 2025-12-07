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
        
        // Game state
        this.players = [];
        this.currentPlayerIndex = 0;
        this.camera = { x: 0, y: 0, scale: 1 };
        this.courseWidth = 3000;
        this.courseHeight = 2000;
        this.gameActive = false;
        this.turnDelay = 2000;
        this.lastShotTime = 0;
        
        // Grid system for design
        this.gridSize = 50; // Each grid cell is 50x50 pixels
        this.gridWidth = Math.ceil(this.courseWidth / this.gridSize);
        this.gridHeight = Math.ceil(this.courseHeight / this.gridSize);
        this.grid = [];
        
        // Design mode
        this.designMode = true;
        this.selectedTool = 'fairway'; // Current painting tool
        this.isPainting = false;
        this.currentHole = 1; // Initialize current hole for design mode
        
        // Create basic holes data structure for gameplay
        this.holes = [];
        for (let i = 1; i <= 18; i++) {
            this.holes.push({
                id: i,
                teePosition: null, // Will be set when user places tees
                holePosition: null, // Will be set when user places holes
                par: 4
            });
        }
        
        // Initialize grid
        this.initializeGrid();
        this.setupEventListeners();
        this.centerView();
        this.updateCanvas();
        this.gameLoop();
    }
    
    initializeGrid() {
        // Create empty grid filled with 'rough' (basic grass)
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = 'rough'; // Default terrain
            }
        }
    }

    setTool(toolType) {
        this.selectedTool = toolType;
        console.log(`Selected tool: ${toolType}`);
        
        // Update button appearance
        document.querySelectorAll('[onclick*="setTool"]').forEach(btn => {
            btn.style.border = '2px solid transparent';
        });
        const activeBtn = document.querySelector(`[onclick="game.setTool('${toolType}')"]`);
        if (activeBtn) {
            activeBtn.style.border = '2px solid #333';
        }
    }

    setCurrentHole(holeNumber) {
        this.currentHole = parseInt(holeNumber);
        document.getElementById('current-hole-display').textContent = `Designing Hole ${this.currentHole}`;
    }

    setHolePar(par) {
        if (this.currentHole >= 1 && this.currentHole <= 18) {
            this.holes[this.currentHole - 1].par = parseInt(par);
            console.log(`Hole ${this.currentHole} par set to ${par}`);
        }
    }

    getGridPosition(worldX, worldY) {
        const gridX = Math.floor(worldX / this.gridSize);
        const gridY = Math.floor(worldY / this.gridSize);
        return { gridX, gridY };
    }

    isValidGridPosition(gridX, gridY) {
        return gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight;
    }

    paintGridCell(gridX, gridY, terrainType) {
        if (this.isValidGridPosition(gridX, gridY)) {
            // Special handling for tees and holes
            if (terrainType === 'tee') {
                this.holes[this.currentHole - 1].teePosition = { gridX, gridY };
                terrainType = 'tee_' + this.currentHole;
            } else if (terrainType === 'hole') {
                this.holes[this.currentHole - 1].holePosition = { gridX, gridY };
                terrainType = 'hole_' + this.currentHole;
            }
            
            this.grid[gridY][gridX] = terrainType;
            this.updateCanvas();
        }
    }

    clearGrid() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = 'rough';
            }
        }
        // Reset hole positions
        this.holes.forEach(hole => {
            hole.teePosition = null;
            hole.holePosition = null;
        });
        this.updateCanvas();
    }

    updateCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.scale, this.camera.scale);
        
        this.drawGrid();
        this.drawPlayers();
        
        this.ctx.restore();
    }

    drawGrid() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const terrain = this.grid[y][x];
                const worldX = x * this.gridSize;
                const worldY = y * this.gridSize;

                // Set color based on terrain type
                switch (terrain) {
                    case 'rough':
                        this.ctx.fillStyle = '#228B22'; // Forest Green
                        break;
                    case 'fairway':
                        this.ctx.fillStyle = '#32CD32'; // Lime Green
                        break;
                    case 'green':
                        this.ctx.fillStyle = '#00FF00'; // Bright Green
                        break;
                    case 'sand':
                        this.ctx.fillStyle = '#F4A460'; // Sandy Brown
                        break;
                    case 'water':
                        this.ctx.fillStyle = '#4169E1'; // Royal Blue
                        break;
                    case 'trees':
                        this.ctx.fillStyle = '#006400'; // Dark Green
                        break;
                    default:
                        if (terrain.startsWith('tee_')) {
                            this.ctx.fillStyle = '#FFD700'; // Gold
                        } else if (terrain.startsWith('hole_')) {
                            this.ctx.fillStyle = '#000000'; // Black
                        } else {
                            this.ctx.fillStyle = '#228B22'; // Default rough
                        }
                        break;
                }

                this.ctx.fillRect(worldX, worldY, this.gridSize, this.gridSize);

                // Draw grid lines
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(worldX, worldY, this.gridSize, this.gridSize);

                // Draw text for tees and holes
                if (terrain.startsWith('tee_') || terrain.startsWith('hole_')) {
                    const holeNumber = terrain.split('_')[1];
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(
                        holeNumber,
                        worldX + this.gridSize / 2,
                        worldY + this.gridSize / 2 + 7
                    );
                }
            }
        }
    }

    drawPlayers() {
        this.players.forEach((player, index) => {
            if (player.positions && player.positions[player.currentHole]) {
                const pos = player.positions[player.currentHole];
                this.ctx.fillStyle = player.color;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
                this.ctx.fill();

                // Draw player name
                this.ctx.fillStyle = 'black';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(player.name, pos.x + 8, pos.y + 4);
            }
        });
    }

    setupEventListeners() {
        // Add player
        this.addPlayerBtn.addEventListener('click', () => this.addPlayer());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });

        // Camera controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.camera.scale *= 1.2;
            this.constrainCamera();
            this.updateCanvas();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.camera.scale /= 1.2;
            this.constrainCamera();
            this.updateCanvas();
        });

        document.getElementById('center-course').addEventListener('click', () => {
            this.centerView();
        });

        // Mouse controls for camera and painting
        let isPanning = false;
        let lastPanX = 0;
        let lastPanY = 0;
        let hasMoved = false;

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - this.camera.x) / this.camera.scale;
            const worldY = (e.clientY - rect.top - this.camera.y) / this.camera.scale;

            if (this.designMode) {
                // Paint grid cells
                const { gridX, gridY } = this.getGridPosition(worldX, worldY);
                this.paintGridCell(gridX, gridY, this.selectedTool);
                this.isPainting = true;
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
            const worldX = (e.clientX - rect.left - this.camera.x) / this.camera.scale;
            const worldY = (e.clientY - rect.top - this.camera.y) / this.camera.scale;

            if (this.designMode && this.isPainting) {
                // Continue painting while dragging
                const { gridX, gridY } = this.getGridPosition(worldX, worldY);
                this.paintGridCell(gridX, gridY, this.selectedTool);
            } else if (isPanning) {
                const deltaX = e.clientX - lastPanX;
                const deltaY = e.clientY - lastPanY;

                if (!hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
                    hasMoved = true;
                }

                if (hasMoved) {
                    this.camera.x -= deltaX / this.camera.scale;
                    this.camera.y -= deltaY / this.camera.scale;
                    this.constrainCamera();
                    lastPanX = e.clientX;
                    lastPanY = e.clientY;
                    this.updateCanvas();
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.isPainting = false;
            isPanning = false;
            this.canvas.style.cursor = this.designMode ? 'crosshair' : 'grab';
        });

        this.canvas.addEventListener('mouseleave', () => {
            isPanning = false;
            this.canvas.style.cursor = 'grab';
        });

        // Mouse wheel zooming
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            
            // Calculate world position before zoom
            const worldXBefore = (mouseX - this.camera.x) / this.camera.scale;
            const worldYBefore = (mouseY - this.camera.y) / this.camera.scale;
            
            // Apply zoom
            this.camera.scale *= zoomFactor;
            this.constrainCamera();
            
            // Calculate world position after zoom and adjust camera to keep mouse position fixed
            const worldXAfter = (mouseX - this.camera.x) / this.camera.scale;
            const worldYAfter = (mouseY - this.camera.y) / this.camera.scale;
            
            this.camera.x += (worldXAfter - worldXBefore) * this.camera.scale;
            this.camera.y += (worldYAfter - worldYBefore) * this.camera.scale;
            
            this.constrainCamera();
            this.updateCanvas();
        });
    }

    constrainCamera() {
        const maxScale = 3.0;
        const minScale = 0.1;
        this.camera.scale = Math.max(minScale, Math.min(maxScale, this.camera.scale));

        // Calculate the visible area bounds
        const scaledCourseWidth = this.courseWidth * this.camera.scale;
        const scaledCourseHeight = this.courseHeight * this.camera.scale;
        
        // Constrain camera so we don't go beyond the course boundaries
        const minX = this.canvas.width - scaledCourseWidth;
        const minY = this.canvas.height - scaledCourseHeight;
        
        this.camera.x = Math.max(minX, Math.min(0, this.camera.x));
        this.camera.y = Math.max(minY, Math.min(0, this.camera.y));
    }

    centerView() {
        // Calculate scale to fit the entire course in the viewport
        this.camera.scale = Math.min(
            this.canvas.width / this.courseWidth,
            this.canvas.height / this.courseHeight
        ) * 0.9;
        
        // Center the course in the viewport
        this.camera.x = (this.canvas.width - this.courseWidth * this.camera.scale) / 2;
        this.camera.y = (this.canvas.height - this.courseHeight * this.camera.scale) / 2;
        this.updateCanvas();
    }

    addPlayer() {
        const name = this.playerNameInput.value.trim();
        if (name && this.players.length < 8) {
            const newPlayer = {
                id: this.players.length + 1,
                name: name,
                scores: new Array(18).fill(0),
                positions: new Array(18).fill(null),
                totalStrokes: 0,
                currentHole: 0,
                color: this.generatePlayerColor(this.players.length),
                isAI: true,
                aiSkill: this.generateAIStyle()
            };

            // Initialize starting position at first hole tee (if it exists)
            if (this.holes[0] && this.holes[0].teePosition) {
                const teePos = this.holes[0].teePosition;
                newPlayer.positions[0] = {
                    x: teePos.gridX * this.gridSize + this.gridSize / 2,
                    y: teePos.gridY * this.gridSize + this.gridSize / 2
                };
            } else {
                // Default position if no tee is placed
                newPlayer.positions[0] = { x: 100, y: 100 };
            }

            this.players.push(newPlayer);
            this.playerNameInput.value = '';
            this.updatePlayerList();
            this.updateCanvas();
        }
    }

    generatePlayerColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        return colors[index % colors.length];
    }

    generateAIStyle() {
        const skills = ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'];
        return skills[Math.floor(Math.random() * skills.length)];
    }

    updatePlayerList() {
        this.playerList.innerHTML = '';
        this.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <div class="player-info">
                    <div class="player-name" style="color: ${player.color}">${player.name}</div>
                    <div class="player-score">Hole: ${player.currentHole + 1}/18 | Total: ${player.totalStrokes}</div>
                </div>
                <button onclick="game.removePlayer(${player.id})" class="remove-btn">×</button>
            `;
            this.playerList.appendChild(playerDiv);
        });
    }

    removePlayer(playerId) {
        this.players = this.players.filter(player => player.id !== playerId);
        // Reassign IDs to maintain order
        this.players.forEach((player, index) => {
            player.id = index + 1;
        });
        
        if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0;
        }
        
        this.updatePlayerList();
        this.updateCanvas();
    }

    gameLoop() {
        this.updateCanvas();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Global reference for button clicks
let game;

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new GolfCoursePlanner();
    window.game = game; // Make available globally for HTML onclick handlers
    
    // Set default tool
    setTimeout(() => {
        if (game.setTool) {
            game.setTool('fairway');
        }
    }, 100);
});