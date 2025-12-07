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
        this.turnDelay = 2000; // 2 seconds between shots
        this.lastShotTime = 0;
        
        // Course layout
        this.setupCourse();
        this.setupEventListeners();
        this.updateCanvas();
        this.gameLoop();
    }
    
    setupCourse() {
        // Define 18 holes in a top-down course layout
        this.holes = [
            // Front 9
            { id: 1, tee: {x: 200, y: 1800}, hole: {x: 400, y: 1600}, par: 4, obstacles: [
                {x: 250, y: 1700, width: 80, height: 60, type: 'bunker'},
                {x: 350, y: 1650, width: 40, height: 80, type: 'tree'}
            ]},
            { id: 2, tee: {x: 500, y: 1600}, hole: {x: 700, y: 1400}, par: 3, obstacles: [
                {x: 550, y: 1500, width: 100, height: 40, type: 'water'}
            ]},
            { id: 3, tee: {x: 800, y: 1400}, hole: {x: 1100, y: 1200}, par: 5, obstacles: [
                {x: 900, y: 1350, width: 60, height: 100, type: 'tree'},
                {x: 1000, y: 1250, width: 120, height: 60, type: 'bunker'}
            ]},
            { id: 4, tee: {x: 1200, y: 1200}, hole: {x: 1400, y: 1000}, par: 4, obstacles: [
                {x: 1300, y: 1100, width: 80, height: 80, type: 'water'},
                {x: 1350, y: 1050, width: 30, height: 60, type: 'tree'}
            ]},
            { id: 5, tee: {x: 1500, y: 1000}, hole: {x: 1700, y: 800}, par: 3, obstacles: [
                {x: 1600, y: 900, width: 60, height: 60, type: 'bunker'}
            ]},
            { id: 6, tee: {x: 1800, y: 800}, hole: {x: 2100, y: 600}, par: 4, obstacles: [
                {x: 1900, y: 700, width: 100, height: 100, type: 'water'},
                {x: 2000, y: 650, width: 40, height: 80, type: 'tree'}
            ]},
            { id: 7, tee: {x: 2200, y: 600}, hole: {x: 2500, y: 400}, par: 5, obstacles: [
                {x: 2300, y: 500, width: 80, height: 120, type: 'bunker'},
                {x: 2400, y: 450, width: 60, height: 60, type: 'tree'},
                {x: 2450, y: 425, width: 100, height: 50, type: 'water'}
            ]},
            { id: 8, tee: {x: 2600, y: 400}, hole: {x: 2800, y: 200}, par: 3, obstacles: [
                {x: 2700, y: 300, width: 60, height: 80, type: 'tree'}
            ]},
            { id: 9, tee: {x: 2700, y: 200}, hole: {x: 2500, y: 100}, par: 4, obstacles: [
                {x: 2600, y: 150, width: 80, height: 60, type: 'bunker'},
                {x: 2550, y: 125, width: 40, height: 50, type: 'tree'}
            ]},
            
            // Back 9
            { id: 10, tee: {x: 2400, y: 100}, hole: {x: 2100, y: 200}, par: 4, obstacles: [
                {x: 2250, y: 150, width: 100, height: 60, type: 'water'}
            ]},
            { id: 11, tee: {x: 2000, y: 200}, hole: {x: 1700, y: 300}, par: 3, obstacles: [
                {x: 1850, y: 250, width: 60, height: 60, type: 'bunker'}
            ]},
            { id: 12, tee: {x: 1600, y: 300}, hole: {x: 1300, y: 500}, par: 5, obstacles: [
                {x: 1500, y: 400, width: 80, height: 80, type: 'tree'},
                {x: 1400, y: 450, width: 120, height: 60, type: 'water'},
                {x: 1350, y: 475, width: 40, height: 60, type: 'tree'}
            ]},
            { id: 13, tee: {x: 1200, y: 500}, hole: {x: 900, y: 700}, par: 4, obstacles: [
                {x: 1050, y: 600, width: 80, height: 100, type: 'bunker'}
            ]},
            { id: 14, tee: {x: 800, y: 700}, hole: {x: 500, y: 900}, par: 3, obstacles: [
                {x: 650, y: 800, width: 60, height: 60, type: 'tree'}
            ]},
            { id: 15, tee: {x: 400, y: 900}, hole: {x: 600, y: 1200}, par: 4, obstacles: [
                {x: 500, y: 1000, width: 100, height: 80, type: 'water'},
                {x: 550, y: 1150, width: 40, height: 80, type: 'tree'}
            ]},
            { id: 16, tee: {x: 700, y: 1200}, hole: {x: 1000, y: 1500}, par: 5, obstacles: [
                {x: 800, y: 1300, width: 80, height: 120, type: 'bunker'},
                {x: 900, y: 1400, width: 60, height: 80, type: 'tree'},
                {x: 950, y: 1450, width: 100, height: 60, type: 'water'}
            ]},
            { id: 17, tee: {x: 1100, y: 1500}, hole: {x: 1400, y: 1700}, par: 3, obstacles: [
                {x: 1250, y: 1600, width: 80, height: 60, type: 'bunker'}
            ]},
            { id: 18, tee: {x: 1500, y: 1700}, hole: {x: 300, y: 1800}, par: 4, obstacles: [
                {x: 900, y: 1750, width: 400, height: 40, type: 'water'},
                {x: 700, y: 1775, width: 40, height: 60, type: 'tree'},
                {x: 500, y: 1780, width: 60, height: 40, type: 'bunker'}
            ]}
        ];
        
        // Calculate total par
        this.totalPar = this.holes.reduce((sum, hole) => sum + hole.par, 0);
    }
    
    setupEventListeners() {
        // Add player button
        this.addPlayerBtn.addEventListener('click', () => {
            this.addPlayer();
        });
        
        // Enter key in name input
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });
        
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.camera.scale = Math.min(this.camera.scale * 1.2, 3);
            this.updateCanvas();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.camera.scale = Math.max(this.camera.scale / 1.2, 0.3);
            this.updateCanvas();
        });
        
        document.getElementById('center-course').addEventListener('click', () => {
            this.centerView();
        });
        
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.scale = Math.max(0.3, Math.min(3, this.camera.scale * zoomFactor));
            this.updateCanvas();
        });
        
        // Camera panning
        let isPanning = false;
        let lastPanX = 0;
        let lastPanY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isPanning = true;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const deltaX = e.clientX - lastPanX;
                const deltaY = e.clientY - lastPanY;
                
                this.camera.x -= deltaX / this.camera.scale;
                this.camera.y -= deltaY / this.camera.scale;
                
                lastPanX = e.clientX;
                lastPanY = e.clientY;
                
                this.updateCanvas();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isPanning = false;
            this.canvas.style.cursor = 'grab';
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isPanning = false;
            this.canvas.style.cursor = 'grab';
        });
    }
    
    addPlayer() {
        const name = this.playerNameInput.value.trim();
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
                aiStyle: this.generateAIStyle() // Each player gets different AI behavior
            };
            
            this.players.push(player);
            this.playerNameInput.value = '';
            this.updatePlayerList();
            this.updateScoreboard();
            
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
            // Find alternative route around obstacles
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
        
        // Adjust for aggression (more aggressive = longer shots)
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
        // Try different angles around obstacles
        const angles = [-Math.PI/3, -Math.PI/6, Math.PI/6, Math.PI/3];
        const baseAngle = Math.atan2(end.y - start.y, end.x - start.x);
        
        for (const angleOffset of angles) {
            const testAngle = baseAngle + angleOffset;
            const testDistance = 150; // Intermediate target distance
            const testTarget = {
                x: start.x + Math.cos(testAngle) * testDistance,
                y: start.y + Math.sin(testAngle) * testDistance
            };
            
            const testPath = this.getDirectPath(start, testTarget);
            if (!this.checkPathForObstacles(testPath, obstacles)) {
                return testTarget;
            }
        }
        
        // If no clear path, aim for closer target
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
            // Give up after par + 3 strokes
            player.currentHole++;
            this.showMessage(`${player.name} moved to next hole after ${player.scores[player.currentHole]} strokes`, 'warning');
        }
        
        this.updateScoreboard();
        this.updateCanvas();
        
        // Move to next player
        setTimeout(() => {
            this.nextPlayer();
        }, this.turnDelay);
    }
    
    nextPlayer() {
        if (this.players.length === 0) return;
        
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.updateGameState();
        
        // Skip players who have finished
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
            
            // Find winner (lowest score)
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
    
    centerView() {
        this.camera.x = this.courseWidth / 2 - this.canvas.width / (2 * this.camera.scale);
        this.camera.y = this.courseHeight / 2 - this.canvas.height / (2 * this.camera.scale);
        this.camera.scale = Math.min(
            this.canvas.width / this.courseWidth,
            this.canvas.height / this.courseHeight
        ) * 0.8;
        this.updateCanvas();
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
        
        // Draw background
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 0, this.courseWidth, this.courseHeight);
        
        // Draw course outline
        this.ctx.strokeStyle = '#1a5c1a';
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(0, 0, this.courseWidth, this.courseHeight);
        
        // Draw holes
        this.holes.forEach(hole => {
            this.drawHole(hole);
        });
        
        // Draw players
        this.players.forEach((player, index) => {
            this.drawPlayer(player, index === this.currentPlayerIndex);
        });
        
        this.ctx.restore();
    }
    
    drawHole(hole) {
        // Draw tee
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(hole.tee.x - 8, hole.tee.y - 8, 16, 16);
        
        // Draw hole
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(hole.hole.x, hole.hole.y, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw flag
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(hole.hole.x + 12, hole.hole.y);
        this.ctx.lineTo(hole.hole.x + 12, hole.hole.y - 30);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(hole.hole.x + 12, hole.hole.y - 30, 15, 10);
        
        // Draw hole number
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(hole.id.toString(), hole.tee.x, hole.tee.y - 15);
        this.ctx.fillText(hole.id.toString(), hole.tee.x, hole.tee.y - 15);
        
        // Draw par
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '12px Arial';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(`Par ${hole.par}`, hole.hole.x, hole.hole.y - 20);
        this.ctx.fillText(`Par ${hole.par}`, hole.hole.x, hole.hole.y - 20);
        
        // Draw obstacles
        hole.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
        
        // Draw fairway line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(hole.tee.x, hole.tee.y);
        this.ctx.lineTo(hole.hole.x, hole.hole.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawObstacle(obstacle) {
        switch (obstacle.type) {
            case 'bunker':
                this.ctx.fillStyle = '#DEB887';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                // Add sand texture
                this.ctx.fillStyle = '#F5DEB3';
                for (let i = 0; i < 5; i++) {
                    const x = obstacle.x + Math.random() * obstacle.width;
                    const y = obstacle.y + Math.random() * obstacle.height;
                    this.ctx.fillRect(x, y, 3, 3);
                }
                break;
            case 'water':
                this.ctx.fillStyle = '#4169E1';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                // Add water animation
                this.ctx.fillStyle = '#6495ED';
                for (let i = 0; i < obstacle.width; i += 20) {
                    const waveHeight = Math.sin(Date.now() * 0.003 + i * 0.1) * 3;
                    this.ctx.fillRect(obstacle.x + i, obstacle.y + waveHeight, 10, obstacle.height);
                }
                break;
            case 'tree':
                // Tree trunk
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(obstacle.x + obstacle.width * 0.3, obstacle.y + obstacle.height * 0.6, 
                                obstacle.width * 0.4, obstacle.height * 0.4);
                // Tree foliage
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height * 0.3, 
                           obstacle.width * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                break;
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
}

// Global reference for button clicks
let golfGame;

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    golfGame = new GolfCoursePlanner();
});
    
    setupCourse() {
        // Define 18 holes in a top-down course layout
        this.holes = [
            // Front 9
            { id: 1, tee: {x: 200, y: 1800}, hole: {x: 400, y: 1600}, par: 4, obstacles: [
                {x: 250, y: 1700, width: 80, height: 60, type: 'bunker'},
                {x: 350, y: 1650, width: 40, height: 80, type: 'tree'}
            ]},
            { id: 2, tee: {x: 500, y: 1600}, hole: {x: 700, y: 1400}, par: 3, obstacles: [
                {x: 550, y: 1500, width: 100, height: 40, type: 'water'}
            ]},
            { id: 3, tee: {x: 800, y: 1400}, hole: {x: 1100, y: 1200}, par: 5, obstacles: [
                {x: 900, y: 1350, width: 60, height: 100, type: 'tree'},
                {x: 1000, y: 1250, width: 120, height: 60, type: 'bunker'}
            ]},
            { id: 4, tee: {x: 1200, y: 1200}, hole: {x: 1400, y: 1000}, par: 4, obstacles: [
                {x: 1300, y: 1100, width: 80, height: 80, type: 'water'},
                {x: 1350, y: 1050, width: 30, height: 60, type: 'tree'}
            ]},
            { id: 5, tee: {x: 1500, y: 1000}, hole: {x: 1700, y: 800}, par: 3, obstacles: [
                {x: 1600, y: 900, width: 60, height: 60, type: 'bunker'}
            ]},
            { id: 6, tee: {x: 1800, y: 800}, hole: {x: 2100, y: 600}, par: 4, obstacles: [
                {x: 1900, y: 700, width: 100, height: 100, type: 'water'},
                {x: 2000, y: 650, width: 40, height: 80, type: 'tree'}
            ]},
            { id: 7, tee: {x: 2200, y: 600}, hole: {x: 2500, y: 400}, par: 5, obstacles: [
                {x: 2300, y: 500, width: 80, height: 120, type: 'bunker'},
                {x: 2400, y: 450, width: 60, height: 60, type: 'tree'},
                {x: 2450, y: 425, width: 100, height: 50, type: 'water'}
            ]},
            { id: 8, tee: {x: 2600, y: 400}, hole: {x: 2800, y: 200}, par: 3, obstacles: [
                {x: 2700, y: 300, width: 60, height: 80, type: 'tree'}
            ]},
            { id: 9, tee: {x: 2700, y: 200}, hole: {x: 2500, y: 100}, par: 4, obstacles: [
                {x: 2600, y: 150, width: 80, height: 60, type: 'bunker'},
                {x: 2550, y: 125, width: 40, height: 50, type: 'tree'}
            ]},
            
            // Back 9
            { id: 10, tee: {x: 2400, y: 100}, hole: {x: 2100, y: 200}, par: 4, obstacles: [
                {x: 2250, y: 150, width: 100, height: 60, type: 'water'}
            ]},
            { id: 11, tee: {x: 2000, y: 200}, hole: {x: 1700, y: 300}, par: 3, obstacles: [
                {x: 1850, y: 250, width: 60, height: 60, type: 'bunker'}
            ]},
            { id: 12, tee: {x: 1600, y: 300}, hole: {x: 1300, y: 500}, par: 5, obstacles: [
                {x: 1500, y: 400, width: 80, height: 80, type: 'tree'},
                {x: 1400, y: 450, width: 120, height: 60, type: 'water'},
                {x: 1350, y: 475, width: 40, height: 60, type: 'tree'}
            ]},
            { id: 13, tee: {x: 1200, y: 500}, hole: {x: 900, y: 700}, par: 4, obstacles: [
                {x: 1050, y: 600, width: 80, height: 100, type: 'bunker'}
            ]},
            { id: 14, tee: {x: 800, y: 700}, hole: {x: 500, y: 900}, par: 3, obstacles: [
                {x: 650, y: 800, width: 60, height: 60, type: 'tree'}
            ]},
            { id: 15, tee: {x: 400, y: 900}, hole: {x: 600, y: 1200}, par: 4, obstacles: [
                {x: 500, y: 1000, width: 100, height: 80, type: 'water'},
                {x: 550, y: 1150, width: 40, height: 80, type: 'tree'}
            ]},
            { id: 16, tee: {x: 700, y: 1200}, hole: {x: 1000, y: 1500}, par: 5, obstacles: [
                {x: 800, y: 1300, width: 80, height: 120, type: 'bunker'},
                {x: 900, y: 1400, width: 60, height: 80, type: 'tree'},
                {x: 950, y: 1450, width: 100, height: 60, type: 'water'}
            ]},
            { id: 17, tee: {x: 1100, y: 1500}, hole: {x: 1400, y: 1700}, par: 3, obstacles: [
                {x: 1250, y: 1600, width: 80, height: 60, type: 'bunker'}
            ]},
            { id: 18, tee: {x: 1500, y: 1700}, hole: {x: 300, y: 1800}, par: 4, obstacles: [
                {x: 900, y: 1750, width: 400, height: 40, type: 'water'},
                {x: 700, y: 1775, width: 40, height: 60, type: 'tree'},
                {x: 500, y: 1780, width: 60, height: 40, type: 'bunker'}
            ]}
        ];
        
        // Calculate total par
        this.totalPar = this.holes.reduce((sum, hole) => sum + hole.par, 0);
    }
    
    setupEventListeners() {
        this.powerSlider.addEventListener('input', (e) => {
            this.powerValue.textContent = e.target.value;
        });
        
        this.addPlayerBtn.addEventListener('click', () => {
            this.addPlayer();
        });
        
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });
        
        this.shootBtn.addEventListener('click', () => {
            this.executeShot();
        });
        
        this.endTurnBtn.addEventListener('click', () => {
            this.endTurn();
        });
        
        this.resetPlayerBtn.addEventListener('click', () => {
            this.resetCurrentPlayer();
        });
        
        // Canvas controls
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.getCurrentPlayer()) {
                this.startPlanning(e);
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPlanning) {
                this.updatePlanning(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.isPlanning) {
                this.finishPlanning(e);
            }
        });
        
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.camera.scale = Math.min(this.camera.scale * 1.2, 3);
            this.updateCanvas();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.camera.scale = Math.max(this.camera.scale / 1.2, 0.3);
            this.updateCanvas();
        });
        
        document.getElementById('center-course').addEventListener('click', () => {
            this.centerView();
        });
        
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.scale = Math.max(0.3, Math.min(3, this.camera.scale * zoomFactor));
            this.updateCanvas();
        });
    }
    
    addPlayer() {
        const name = this.playerNameInput.value.trim();
        if (name && name.length <= 12) {
            const color = this.generatePlayerColor(this.players.length);
            const player = {
                id: this.players.length,
                name: name,
                color: color,
                positions: this.holes.map(hole => ({x: hole.tee.x, y: hole.tee.y})),
                scores: new Array(18).fill(0),
                currentHole: 0,
                totalStrokes: 0
            };
            
            this.players.push(player);
            this.playerNameInput.value = '';
            this.updatePlayerList();
            this.updateScoreboard();
            
            if (this.players.length === 1) {
                this.startGame();
            }
            
            this.showMessage(`${name} joined the game!`, 'success');
        }
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
        this.updateGameState();
        this.centerView();
        this.showMessage('Game started! Plan your first shot.', 'success');
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
                    <div class="player-score">Total: ${player.totalStrokes}</div>
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
            this.showMessage('Add players to start the game!', 'warning');
        }
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    startPlanning(e) {
        const player = this.getCurrentPlayer();
        if (!player) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.camera.scale + this.camera.x;
        const y = (e.clientY - rect.top) / this.camera.scale + this.camera.y;
        
        this.planningStart = {x: x, y: y};
        this.isPlanning = true;
    }
    
    updatePlanning(e) {
        if (!this.isPlanning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.camera.scale + this.camera.x;
        const y = (e.clientY - rect.top) / this.camera.scale + this.camera.y;
        
        this.planningEnd = {x: x, y: y};
        this.updateCanvas();
    }
    
    finishPlanning(e) {
        this.isPlanning = false;
        this.updateCanvas();
    }
    
    executeShot() {
        const player = this.getCurrentPlayer();
        if (!player || !this.planningStart || !this.planningEnd) return;
        
        const dx = this.planningEnd.x - this.planningStart.x;
        const dy = this.planningEnd.y - this.planningStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = parseInt(this.powerSlider.value) / 100;
        
        // Calculate new position
        const maxDistance = 200 * power;
        const actualDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        const newX = player.positions[player.currentHole].x + Math.cos(angle) * actualDistance;
        const newY = player.positions[player.currentHole].y + Math.sin(angle) * actualDistance;
        
        // Check boundaries
        const boundedX = Math.max(50, Math.min(this.courseWidth - 50, newX));
        const boundedY = Math.max(50, Math.min(this.courseHeight - 50, boundedY));
        
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
            }
        }
        
        this.planningStart = null;
        this.planningEnd = null;
        this.updateScoreboard();
        this.updateCanvas();
        
        // Enable end turn button
        this.endTurnBtn.disabled = false;
    }
    
    endTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.updateGameState();
        this.endTurnBtn.disabled = true;
        
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            this.showMessage(`${currentPlayer.name}'s turn`, 'info');
        }
    }
    
    resetCurrentPlayer() {
        const player = this.getCurrentPlayer();
        if (!player) return;
        
        const hole = this.holes[player.currentHole];
        player.positions[player.currentHole] = {x: hole.tee.x, y: hole.tee.y};
        this.showMessage(`${player.name}'s ball reset to tee`, 'warning');
        this.updateCanvas();
    }
    
    updateGameState() {
        const player = this.getCurrentPlayer();
        
        if (player) {
            this.currentPlayerName.textContent = player.name;
            this.shootBtn.disabled = false;
            this.resetPlayerBtn.disabled = false;
        } else {
            this.currentPlayerName.textContent = '-';
            this.shootBtn.disabled = true;
            this.resetPlayerBtn.disabled = true;
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
    
    centerView() {
        this.camera.x = this.courseWidth / 2 - this.canvas.width / 2;
        this.camera.y = this.courseHeight / 2 - this.canvas.height / 2;
        this.camera.scale = Math.min(
            this.canvas.width / this.courseWidth,
            this.canvas.height / this.courseHeight
        ) * 0.8;
        this.updateCanvas();
    }
    
    updateCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.draw();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply camera transform
        this.ctx.save();
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw background
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 0, this.courseWidth, this.courseHeight);
        
        // Draw course outline
        this.ctx.strokeStyle = '#1a5c1a';
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(0, 0, this.courseWidth, this.courseHeight);
        
        // Draw holes
        this.holes.forEach(hole => {
            this.drawHole(hole);
        });
        
        // Draw players
        this.players.forEach((player, index) => {
            this.drawPlayer(player, index === this.currentPlayerIndex);
        });
        
        // Draw planning line
        if (this.isPlanning && this.planningStart && this.planningEnd) {
            this.drawPlanningLine();
        }
        
        this.ctx.restore();
    }
    
    drawHole(hole) {
        // Draw tee
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(hole.tee.x - 8, hole.tee.y - 8, 16, 16);
        
        // Draw hole
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(hole.hole.x, hole.hole.y, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw flag
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(hole.hole.x + 12, hole.hole.y);
        this.ctx.lineTo(hole.hole.x + 12, hole.hole.y - 30);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(hole.hole.x + 12, hole.hole.y - 30, 15, 10);
        
        // Draw hole number
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(hole.id.toString(), hole.tee.x, hole.tee.y - 15);
        
        // Draw par
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Par ${hole.par}`, hole.hole.x, hole.hole.y - 20);
        
        // Draw obstacles
        hole.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
        
        // Draw fairway line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(hole.tee.x, hole.tee.y);
        this.ctx.lineTo(hole.hole.x, hole.hole.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawObstacle(obstacle) {
        switch (obstacle.type) {
            case 'bunker':
                this.ctx.fillStyle = '#DEB887';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                break;
            case 'water':
                this.ctx.fillStyle = '#4169E1';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                break;
            case 'tree':
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(obstacle.x + obstacle.width * 0.3, obstacle.y + obstacle.height * 0.6, 
                                obstacle.width * 0.4, obstacle.height * 0.4);
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height * 0.3, 
                           obstacle.width * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
    }
    
    drawPlayer(player, isActive) {
        const pos = player.positions[player.currentHole];
        if (!pos) return;
        
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
        }
        
        // Draw player name
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.name, pos.x, pos.y - 15);
    }
    
    drawPlanningLine() {
        const player = this.getCurrentPlayer();
        if (!player) return;
        
        const pos = player.positions[player.currentHole];
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(this.planningEnd.x, this.planningEnd.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw power indicator
        const distance = Math.sqrt(
            Math.pow(this.planningEnd.x - pos.x, 2) + Math.pow(this.planningEnd.y - pos.y, 2)
        );
        const power = parseInt(this.powerSlider.value) / 100;
        const maxDistance = 200 * power;
        
        this.ctx.fillStyle = distance > maxDistance ? '#FF4444' : '#44FF44';
        this.ctx.beginPath();
        this.ctx.arc(this.planningEnd.x, this.planningEnd.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    showMessage(message, type = 'info') {
        this.messages.textContent = message;
        this.messages.className = type;
        
        setTimeout(() => {
            if (this.messages.textContent === message) {
                this.messages.textContent = this.players.length > 0 ? 
                    'Drag from ball to plan your shot' : 'Add players to start the game!';
                this.messages.className = '';
            }
        }, 3000);
    }
    
    gameLoop() {
        this.updateCanvas();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Global reference for button clicks
let golfGame;

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    golfGame = new GolfCoursePlanner();
});