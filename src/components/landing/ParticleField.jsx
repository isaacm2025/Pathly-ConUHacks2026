import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function ParticleField({ isDisintegrating, onComplete }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const isDisintegratingRef = useRef(isDisintegrating);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    isDisintegratingRef.current = isDisintegrating;
  }, [isDisintegrating]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    
    // Initialize particles
    const particleCount = 80;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 100;
    
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      targetX: centerX + (Math.random() - 0.5) * 100,
      targetY: centerY + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.4,
      color: [
        "rgba(147, 197, 253, ", // blue-300
        "rgba(196, 181, 253, ", // purple-300
        "rgba(134, 239, 172, ", // green-300
        "rgba(252, 211, 77, ",  // yellow-300
      ][Math.floor(Math.random() * 4)],
      phase: 0,
      converged: false,
    }));
    
    let time = 0;
    const convergeTime = 180; // frames (~3 seconds at 60fps)
    
    const animate = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      time++;
      
      particlesRef.current.forEach((p) => {
        if (isDisintegratingRef.current) {
          // Explode outward
          if (!p.exploding) {
            p.exploding = true;
            const angle = Math.atan2(p.y - centerY, p.x - centerX);
            p.vx = Math.cos(angle) * 15;
            p.vy = Math.sin(angle) * 15;
          }
          p.x += p.vx;
          p.y += p.vy;
          p.opacity -= 0.02;
        } else if (time < convergeTime) {
          // Converge to center
          const progress = time / convergeTime;
          const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 2) {
            p.x += dx * easeProgress * 0.05;
            p.y += dy * easeProgress * 0.05;
          } else {
            p.converged = true;
          }
        } else {
          // Gentle breathing motion
          p.phase += 0.02;
          const breathe = Math.sin(p.phase) * 2;
          p.x = p.targetX + breathe;
          p.y = p.targetY + breathe;
        }
        
        // Draw particle
        if (p.opacity > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color + p.opacity + ")";
          ctx.fill();
          
          // Draw connections when converged
          if (p.converged && !isDisintegratingRef.current) {
            particlesRef.current.forEach((p2) => {
              if (p2.converged) {
                const dx = p2.x - p.x;
                const dy = p2.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 50) {
                  ctx.beginPath();
                  ctx.moveTo(p.x, p.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.strokeStyle = `rgba(100, 116, 139, ${0.2 * (1 - dist / 50)})`;
                  ctx.lineWidth = 0.5;
                  ctx.stroke();
                }
              }
            });
          }
        }
      });
      
      // Check if disintegration is complete
      if (isDisintegratingRef.current && particlesRef.current.every(p => p.opacity <= 0)) {
        onCompleteRef.current?.();
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener("resize", updateSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)" }}
    />
  );
}
