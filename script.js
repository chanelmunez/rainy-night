class RainyNightScene {
    constructor() {
        this.canvas = document.getElementById('nightScene');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.raindrops = [];
        this.lastLightning = 0;
        this.lightningAlpha = 0;
        this.moonImage = new Image();
        this.moonImage.src = 'moon.png';
        this.setupAudio();
        this.setupScene();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundLevel = this.canvas.height - 50; // Ground position
    }

    setupAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load thunder sound
        this.thunderBuffer = null;
        fetch('thunder-sound.mp3')
            .then(response => response.arrayBuffer())
            .then(buffer => this.audioContext.decodeAudioData(buffer))
            .then(decodedBuffer => {
                this.thunderBuffer = decodedBuffer;
            })
            .catch(error => console.error('Error loading thunder sound:', error));

        // Load raindrop sound
        this.raindropBuffer = null;
        fetch('raindrop-sound.mp3')
            .then(response => response.arrayBuffer())
            .then(buffer => this.audioContext.decodeAudioData(buffer))
            .then(decodedBuffer => {
                this.raindropBuffer = decodedBuffer;
            })
            .catch(error => console.error('Error loading raindrop sound:', error));

        // Load and start background music
        this.backgroundBuffer = null;
        fetch('space-sound-01.mp3')
            .then(response => response.arrayBuffer())
            .then(buffer => this.audioContext.decodeAudioData(buffer))
            .then(decodedBuffer => {
                this.backgroundBuffer = decodedBuffer;
                this.playBackgroundMusic();
            })
            .catch(error => console.error('Error loading background music:', error));
    }

    playThunder() {
        if (!this.thunderBuffer) return;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.thunderBuffer;
        gainNode.gain.value = 2.5; // Increased thunder volume
        
        // Create a more dramatic thunder envelope
        gainNode.gain.setValueAtTime(2.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 3.0);
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();
    }

    playRaindropSound(x) {
        if (!this.raindropBuffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const panNode = this.audioContext.createStereoPanner();
        const lowPassFilter = this.audioContext.createBiquadFilter();
        
        // Map x position to frequency (200Hz on left to 1000Hz on right)
        const minFreq = 200;
        const maxFreq = 1000;
        const frequency = minFreq + (x / this.canvas.width) * (maxFreq - minFreq);
        
        // Configure low-pass filter with dynamic frequency
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.value = frequency;
        lowPassFilter.Q.value = 2;
        
        // Map x position to pan value (-1 to 1)
        const pan = (x / this.canvas.width) * 2 - 1;
        panNode.pan.value = pan;
        
        // Map x position to playback rate (lower on left, higher on right)
        const playbackRate = 0.4 + (x / this.canvas.width) * 0.4; // Rate between 0.4 and 0.8
        source.playbackRate.value = playbackRate;

        source.buffer = this.raindropBuffer;
        
        // Set initial gain and create envelope
        gainNode.gain.setValueAtTime(2.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2.0); // Longer duration
        
        // Connect audio nodes
        source.connect(lowPassFilter);
        lowPassFilter.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.audioContext.destination);
        
        source.start();
    }

    playBackgroundMusic() {
        if (!this.backgroundBuffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = this.backgroundBuffer;
        source.loop = true;  // Enable looping
        gainNode.gain.value = 0.15;  // Lowered background music volume

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();

        // Store the source for potential future reference
        this.backgroundMusicSource = source;
    }

    setupScene() {
        // Create moon gradient
        this.moonGradient = this.ctx.createRadialGradient(
            this.canvas.width - 100, 100, 0,
            this.canvas.width - 100, 100, 40
        );
        this.moonGradient.addColorStop(0, 'rgba(255, 255, 230, 1)');
        this.moonGradient.addColorStop(1, 'rgba(255, 255, 230, 0)');
    }

    createRaindrop() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * -100,
            speed: 7 + Math.random() * 10,
            length: 15 + Math.random() * 20
        };
    }

    drawStars() {
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * (this.groundLevel - 100);
            const size = Math.random() * 2;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawMoon() {
        // Draw the realistic moon
        const moonSize = 150; // Increased size further
        const x = this.canvas.width - moonSize - 50;
        const y = moonSize;
        
        // Draw glow effect
        const gradient = this.ctx.createRadialGradient(
            x, y, moonSize * 0.8,
            x, y, moonSize * 1.2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 230, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 230, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, moonSize * 1.2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw the moon image
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, moonSize, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.drawImage(this.moonImage, x - moonSize, y - moonSize, moonSize * 2, moonSize * 2);
        this.ctx.restore();
    }

    drawGround() {
        // Draw base ground
        this.ctx.fillStyle = '#004400';
        this.ctx.fillRect(0, this.groundLevel, this.canvas.width, this.canvas.height - this.groundLevel);

        // Draw detailed grass blades
        for (let x = 0; x < this.canvas.width; x += 3) {
            const height = 5 + Math.random() * 15;
            const lean = Math.random() * 4 - 2; // Makes grass lean slightly left or right
            
            this.ctx.strokeStyle = '#008800';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.groundLevel);
            this.ctx.lineTo(x + lean, this.groundLevel - height);
            this.ctx.stroke();
        }
    }

    updateLightning() {
        const now = Date.now();
        if (now - this.lastLightning > 5000 && Math.random() < 0.005) {
            this.lightningAlpha = 0.9; // Increased flash intensity
            this.lastLightning = now;
            
            // Play initial thunder at full volume for lightning strike
            const strikeSource = this.audioContext.createBufferSource();
            const strikeGain = this.audioContext.createGain();
            
            strikeSource.buffer = this.thunderBuffer;
            strikeGain.gain.value = 2.8; // Even louder for initial strike
            
            strikeSource.connect(strikeGain);
            strikeGain.connect(this.audioContext.destination);
            strikeSource.start();
            
            // Delayed thunder rumble
            setTimeout(() => this.playThunder(), 500);
        }
        
        if (this.lightningAlpha > 0) {
            this.lightningAlpha *= 0.9;
        }
    }

    animate() {
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars
        this.drawStars();
        
        // Draw moon
        this.drawMoon();
        
        // Update and draw lightning
        this.updateLightning();
        if (this.lightningAlpha > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Update and draw raindrops
        if (Math.random() < 0.05) { // Decreased from 0.2 to 0.05 for fewer raindrops
            this.raindrops.push(this.createRaindrop());
        }

        // Draw raindrops
        this.ctx.strokeStyle = 'rgba(200, 200, 255, 0.6)';
        this.ctx.lineWidth = 2.5;

        for (let i = this.raindrops.length - 1; i >= 0; i--) {
            const drop = this.raindrops[i];
            
            // Draw raindrop
            this.ctx.beginPath();
            this.ctx.moveTo(drop.x, drop.y);
            this.ctx.lineTo(drop.x, drop.y + drop.length);
            this.ctx.stroke();

            // Update raindrop position
            drop.y += drop.speed;

            // Remove raindrop and play sound when it hits ground
            if (drop.y > this.groundLevel) {
                this.playRaindropSound(drop.x);
                this.raindrops.splice(i, 1);
            }
        }

        // Draw ground and grass last
        this.drawGround();

        // Continue animation
        requestAnimationFrame(() => this.animate());
    }
}

// Start the animation when the page loads
window.addEventListener('load', () => {
    new RainyNightScene();
});
