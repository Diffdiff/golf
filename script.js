class GolfGame {
    constructor() {
        this.canvas = document.getElementById('golf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.powerSlider = document.getElementById('power-slider');
        this.angleSlider = document.getElementById('angle-slider');
        this.powerValue = document.getElementById('power-value');
        this.angleValue = document.getElementById('angle-value');
        this.shootBtn = document.getElementById('shoot-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.nextHoleBtn = document.getElementById('next-hole-btn');
        this.messages = document.getElementById('messages');
        this.currentHoleElement = document.getElementById('current-hole');
        this.strokeCountElement = document.getElementById('stroke-count');
        this.parElement = document.getElementById('par');
        
        this.currentHole = 1;
        this.strokeCount = 0;
        this.ball = { x: 100, y: 500, vx: 0, vy: 0, radius: 8 };
        this.hole = { x: 650, y: 150, radius: 20 };
        this.obstacles = [];
        this.isMoving = false;
        this.friction = 0.98;
        this.gravity = 0.1;
        this.maxSpeed = 15;
        
        this.setupHoles();
        this.setupEventListeners();
        this.gameLoop();
        this.updateDisplay();
    }
    
    setupHoles() {
        this.holes = [
            {
                par: 3,
                ball: { x: 100, y: 500 },
                hole: { x: 650, y: 150 },
                obstacles: [
                    { x: 300, y: 300, width: 80, height: 200, type: 'tree' },
                    { x: 500, y: 450, width: 60, height: 100, type: 'rock' }
                ]
            },
            {
                par: 4,
                ball: { x: 50, y: 550 },
                hole: { x: 700, y: 100 },
                obstacles: [
                    { x: 200, y: 200, width: 100, height: 300, type: 'tree' },
                    { x: 400, y: 400, width: 200, height: 80, type: 'water' },
                    { x: 600, y: 300, width: 60, height: 120, type: 'rock' }
                ]
            },
            {
                par: 2,
                ball: { x: 150, y: 400 },
                hole: { x: 600, y: 200 },
                obstacles: [
                    { x: 350, y: 250, width: 100, height: 100, type: 'rock' }
                ]
            },
            {
                par: 5,
                ball: { x: 50, y: 500 },
                hole: { x: 750, y: 50 },
                obstacles: [
                    { x: 150, y: 300, width: 80, height: 150, type: 'tree' },
                    { x: 300, y: 200, width: 150, height: 100, type: 'water' },
                    { x: 500, y: 350, width: 120, height: 80, type: 'rock' },
                    { x: 650, y: 200, width: 60, height: 200, type: 'tree' }
                ]
            },
            {
                par: 3,
                ball: { x: 100, y: 300 },
                hole: { x: 650, y: 300 },
                obstacles: [
                    { x: 250, y: 150, width: 80, height: 300, type: 'tree' },
                    { x: 400, y: 200, width: 150, height: 200, type: 'water' }
                ]
            },
            {
                par: 4,
                ball: { x: 50, y: 200 },
                hole: { x: 700, y: 500 },
                obstacles: [
                    { x: 200, y: 350, width: 200, height: 80, type: 'water' },
                    { x: 450, y: 250, width: 100, height: 200, type: 'tree' },
                    { x: 600, y: 100, width: 80, height: 120, type: 'rock' }
                ]
            },
            {
                par: 3,
                ball: { x: 150, y: 550 },
                hole: { x: 550, y: 100 },
                obstacles: [
                    { x: 300, y: 350, width: 200, height: 100, type: 'rock' },
                    { x: 400, y: 200, width: 80, height: 120, type: 'tree' }
                ]
            },
            {
                par: 6,
                ball: { x: 50, y: 550 },
                hole: { x: 750, y: 50 },
                obstacles: [
                    { x: 150, y: 400, width: 100, height: 100, type: 'water' },
                    { x: 300, y: 300, width: 80, height: 250, type: 'tree' },
                    { x: 450, y: 150, width: 150, height: 80, type: 'rock' },
                    { x: 600, y: 250, width: 60, height: 200, type: 'tree' },
                    { x: 400, y: 500, width: 200, height: 60, type: 'water' }
                ]
            },
            {
                par: 4,
                ball: { x: 100, y: 400 },
                hole: { x: 650, y: 200 },
                obstacles: [
                    { x: 250, y: 250, width: 300, height: 100, type: 'water' },
                    { x: 500, y: 400, width: 80, height: 150, type: 'tree' }
                ]
            }
        ];
        
        this.loadHole(this.currentHole);
    }
    
    loadHole(holeNumber) {
        const holeData = this.holes[holeNumber - 1];
        this.ball.x = holeData.ball.x;
        this.ball.y = holeData.ball.y;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.hole.x = holeData.hole.x;
        this.hole.y = holeData.hole.y;
        this.obstacles = holeData.obstacles;
        this.parElement.textContent = holeData.par;
        this.strokeCount = 0;
        this.updateDisplay();
        this.showMessage(`Hole ${holeNumber} - Par ${holeData.par}`, 'info');
    }
    
    setupEventListeners() {
        this.powerSlider.addEventListener('input', (e) => {
            this.powerValue.textContent = e.target.value;
        });
        
        this.angleSlider.addEventListener('input', (e) => {
            this.angleValue.textContent = e.target.value;
        });
        
        this.shootBtn.addEventListener('click', () => {
            if (!this.isMoving) {
                this.shoot();
            }
        });
        
        this.resetBtn.addEventListener('click', () => {
            this.resetBall();
        });
        
        this.nextHoleBtn.addEventListener('click', () => {
            this.nextHole();
        });
    }
    
    shoot() {
        const power = parseInt(this.powerSlider.value) / 100;
        const angle = parseInt(this.angleSlider.value) * Math.PI / 180;
        
        this.ball.vx = Math.cos(angle) * power * this.maxSpeed;
        this.ball.vy = Math.sin(angle) * power * this.maxSpeed;
        
        this.isMoving = true;
        this.strokeCount++;
        this.updateDisplay();
    }
    
    resetBall() {
        const holeData = this.holes[this.currentHole - 1];
        this.ball.x = holeData.ball.x;
        this.ball.y = holeData.ball.y;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.isMoving = false;
        this.showMessage('Ball reset to starting position', 'warning');
    }
    
    nextHole() {
        if (this.currentHole < 9) {
            this.currentHole++;
            this.loadHole(this.currentHole);
            this.nextHoleBtn.style.display = 'none';
        } else {
            this.showMessage('Congratulations! You completed all 9 holes!', 'success');
        }
    }
    
    updateBall() {
        if (!this.isMoving) return;
        
        // Apply velocity
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // Apply friction
        this.ball.vx *= this.friction;
        this.ball.vy *= this.friction;
        
        // Boundary collision
        if (this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.vx *= -0.8;
            this.ball.x = Math.max(this.ball.radius, Math.min(this.canvas.width - this.ball.radius, this.ball.x));
        }
        
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.vy *= -0.8;
            this.ball.y = Math.max(this.ball.radius, Math.min(this.canvas.height - this.ball.radius, this.ball.y));
        }
        
        // Check obstacle collision
        this.checkObstacleCollision();
        
        // Check hole collision
        this.checkHoleCollision();
        
        // Stop if moving slowly
        if (Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1) {
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.isMoving = false;
        }
    }
    
    checkObstacleCollision() {
        for (const obstacle of this.obstacles) {
            if (this.ball.x + this.ball.radius > obstacle.x &&
                this.ball.x - this.ball.radius < obstacle.x + obstacle.width &&
                this.ball.y + this.ball.radius > obstacle.y &&
                this.ball.y - this.ball.radius < obstacle.y + obstacle.height) {
                
                if (obstacle.type === 'water') {
                    this.resetBall();
                    this.showMessage('Ball went into water! Resetting...', 'error');
                    return;
                }
                
                // Simple bounce for trees and rocks
                const centerX = obstacle.x + obstacle.width / 2;
                const centerY = obstacle.y + obstacle.height / 2;
                
                if (Math.abs(this.ball.x - centerX) > Math.abs(this.ball.y - centerY)) {
                    this.ball.vx *= -0.8;
                } else {
                    this.ball.vy *= -0.8;
                }
                
                // Push ball out of obstacle
                if (this.ball.x < centerX) {
                    this.ball.x = obstacle.x - this.ball.radius;
                } else {
                    this.ball.x = obstacle.x + obstacle.width + this.ball.radius;
                }
            }
        }
    }
    
    checkHoleCollision() {
        const dx = this.ball.x - this.hole.x;
        const dy = this.ball.y - this.hole.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.hole.radius) {
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.isMoving = false;
            const holeData = this.holes[this.currentHole - 1];
            
            if (this.strokeCount <= holeData.par) {
                this.showMessage(`Hole in ${this.strokeCount}! Great job!`, 'success');
            } else {
                this.showMessage(`Hole in ${this.strokeCount}. Par was ${holeData.par}`, 'warning');
            }
            
            this.nextHoleBtn.style.display = 'block';
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background (sky and grass)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#87CEEB');
        gradient.addColorStop(0.3, '#90EE90');
        gradient.addColorStop(1, '#228B22');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            switch (obstacle.type) {
                case 'tree':
                    // Tree trunk
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(obstacle.x + obstacle.width * 0.3, obstacle.y + obstacle.height * 0.6, 
                                    obstacle.width * 0.4, obstacle.height * 0.4);
                    
                    // Tree foliage
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.beginPath();
                    this.ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height * 0.3, 
                               obstacle.width * 0.6, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'rock':
                    this.ctx.fillStyle = '#696969';
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                    
                    // Add some texture
                    this.ctx.fillStyle = '#808080';
                    this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
                    break;
                    
                case 'water':
                    this.ctx.fillStyle = '#4169E1';
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                    
                    // Water waves effect
                    this.ctx.fillStyle = '#6495ED';
                    for (let i = 0; i < obstacle.width; i += 20) {
                        this.ctx.fillRect(obstacle.x + i, obstacle.y + Math.sin(Date.now() * 0.005 + i) * 3, 
                                        10, obstacle.height);
                    }
                    break;
            }
        });
        
        // Draw hole
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(this.hole.x, this.hole.y, this.hole.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw hole flag
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.hole.x + this.hole.radius - 5, this.hole.y);
        this.ctx.lineTo(this.hole.x + this.hole.radius - 5, this.hole.y - 40);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.hole.x + this.hole.radius - 5, this.hole.y - 40, 20, 15);
        
        // Draw ball
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(this.ball.x + 2, this.ball.y + this.ball.radius + 2, this.ball.radius * 0.8, this.ball.radius * 0.4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw trajectory preview
        if (!this.isMoving) {
            this.drawTrajectoryPreview();
        }
    }
    
    drawTrajectoryPreview() {
        const power = parseInt(this.powerSlider.value) / 100;
        const angle = parseInt(this.angleSlider.value) * Math.PI / 180;
        
        const vx = Math.cos(angle) * power * this.maxSpeed;
        const vy = Math.sin(angle) * power * this.maxSpeed;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        
        let x = this.ball.x;
        let y = this.ball.y;
        let tempVx = vx;
        let tempVy = vy;
        
        for (let i = 0; i < 50; i++) {
            x += tempVx;
            y += tempVy;
            tempVx *= this.friction;
            tempVy *= this.friction;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            if (x < 0 || x > this.canvas.width || y < 0 || y > this.canvas.height) {
                break;
            }
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    updateDisplay() {
        this.currentHoleElement.textContent = this.currentHole;
        this.strokeCountElement.textContent = this.strokeCount;
    }
    
    showMessage(message, type = 'info') {
        this.messages.textContent = message;
        this.messages.className = type;
        
        setTimeout(() => {
            if (this.messages.textContent === message) {
                this.messages.textContent = '';
                this.messages.className = '';
            }
        }, 3000);
    }
    
    gameLoop() {
        this.updateBall();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GolfGame();
});