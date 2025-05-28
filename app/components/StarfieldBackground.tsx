'use client';
import { useEffect, useRef } from 'react';

class Star {
  x: number;
  y: number;
  z: number;

  constructor() {
    this.x = Math.random() * 10000 - 5000; // random(-5000, 5000)
    this.y = Math.random() * 10000 - 5000; // random(-5000, 5000) 
    this.z = Math.random() * 2000; // random(0, 2000)
  }

  update(speed: number) {
    this.z -= speed; // Move star closer to viewport with variable speed
    if (this.z <= 0) { // Reset star if it passes viewport
      this.reset();
    }
  }

  reset() {
    // Reset star to a position far away
    this.x = Math.random() * 10000 - 5000;
    this.y = Math.random() * 10000 - 5000;
    this.z = 2000;
  }

  draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    // Project star onto viewport
    const offsetX = 100 * (this.x / this.z);
    const offsetY = 100 * (this.y / this.z);
    const scaleZ = 0.001 * (2000 - this.z);

    // Calculate final position and size
    const finalX = centerX + offsetX;
    const finalY = centerY + offsetY;
    const finalRadius = Math.max(3 * scaleZ, 0.5);

    // Draw this star
    ctx.save();
    ctx.translate(finalX, finalY);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, 0, finalRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationIdRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize 400 stars
    starsRef.current = Array.from({ length: 400 }, () => new Star());

    // Set canvas size to full window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Reset start time when component mounts
    startTimeRef.current = null;

    // Animation loop
    const animate = (currentTime: number) => {
      // Initialize start time on first frame
      startTimeRef.current ??= currentTime;

      // Calculate acceleration
      const elapsedTime = currentTime - startTimeRef.current;
      const accelerationDuration = 3500; // 3.5 seconds
      const minSpeed = 0.5;
      const maxSpeed = 10;

      let currentSpeed: number;
      if (elapsedTime < accelerationDuration) {
        // Acceleration phase - cubic ease-in for spacecraft feel
        const progress = elapsedTime / accelerationDuration;
        const accelerationFactor = progress * progress * progress; // cubic ease-in
        currentSpeed = minSpeed + (maxSpeed - minSpeed) * accelerationFactor;
      } else {
        // Full speed phase
        currentSpeed = maxSpeed;
      }

      // Draw background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0f172a'); // slate-900
      gradient.addColorStop(0.5, '#1e293b'); // slate-800  
      gradient.addColorStop(1, '#000000'); // black
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw all stars from center of screen
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.5;

      starsRef.current.forEach((star) => {
        star.update(currentSpeed);
        star.draw(ctx, centerX, centerY);
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ opacity: 1 }}
    />
  );
} 