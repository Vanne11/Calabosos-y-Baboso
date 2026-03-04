// hooks/useBootSequence.ts
// Secuencia de boot estilo Linux

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

interface BootMessage {
  text: string;
  color: string;
  delay: number;
}

const bootSequence: BootMessage[] = [
  { text: 'Iniciando BabosOS v0.1.0...', color: '#8be9fd', delay: 500 },
  { text: 'Verificando hardware baboso...', color: '#f1fa8c', delay: 400 },
  { text: 'CPU: Intel Babium i7 @ 2.5Ghz', color: '#f8f8f2', delay: 200 },
  { text: 'Memoria: 16GB RAM (8GB dedicados a baba)', color: '#f8f8f2', delay: 200 },
  { text: 'Disco: 1TB SSD (99% lleno de memes de babosas)', color: '#f8f8f2', delay: 200 },
  { text: 'Cargando módulos del kernel...', color: '#bd93f9', delay: 300 },
  { text: 'Módulo slime_core.ko.....................[ OK ]', color: '#50fa7b', delay: 150 },
  { text: 'Módulo babos_graphics.ko.................[ OK ]', color: '#50fa7b', delay: 100 },
  { text: 'Módulo sarcasm_engine.ko.................[ OK ]', color: '#50fa7b', delay: 100 },
  { text: 'Módulo disappointment_generator.ko.......[ OK ]', color: '#50fa7b', delay: 100 },
  { text: 'Módulo auto_insult.ko....................[ OK ]', color: '#50fa7b', delay: 100 },
  { text: 'Comprobando sistema de archivos...', color: '#ff79c6', delay: 400 },
  { text: 'Montando /dev/slime1 en /', color: '#f8f8f2', delay: 200 },
  { text: 'Iniciando servicios babosos...', color: '#bd93f9', delay: 300 },
  { text: 'Servicio narrador_sarcastico.........[ OK ]', color: '#50fa7b', delay: 150 },
  { text: 'Servicio generador_de_rutas..........[ OK ]', color: '#50fa7b', delay: 150 },
  { text: 'Servicio gestor_de_dialogos..........[ OK ]', color: '#50fa7b', delay: 150 },
  { text: 'Estableciendo conexión babosa...', color: '#8be9fd', delay: 300 },
  { text: '¡Preparando interfaz viscosa!', color: '#ff79c6', delay: 300 },
  { text: 'BabosOS cargado con éxito.', color: '#50fa7b', delay: 400 },
  { text: 'Bienvenido al sistema.', color: '#f1fa8c', delay: 500 },
];

export function useBootSequence() {
  const phase = useAppStore((s) => s.phase);
  const setPhase = useAppStore((s) => s.setPhase);
  const [messages, setMessages] = useState<BootMessage[]>([]);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (phase !== 'boot') return;

    let index = 0;

    const showNext = () => {
      if (index < bootSequence.length) {
        setMessages((prev) => [...prev, bootSequence[index]]);
        timerRef.current = setTimeout(showNext, bootSequence[index].delay);
        index++;
      } else {
        // Done - fade out
        setTimeout(() => {
          setFading(true);
          setTimeout(() => {
            setPhase('login');
          }, 500);
        }, 1000);
      }
    };

    showNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, setPhase]);

  return { messages, fading, isBooting: phase === 'boot' };
}
