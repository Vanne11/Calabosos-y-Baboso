// hooks/useBootSequence.ts
// Secuencia de boot estilo Linux

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { preloadDemoAssets } from '../utils/preloadAssets';

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
  { text: 'Precargando assets babosos...', color: '#bd93f9', delay: 200 },
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
    let preloadDone = false;
    let sequenceDone = false;

    // Launch asset preload in parallel with boot animation
    const preloadPromise = preloadDemoAssets((loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const progressMsg: BootMessage = {
          text: `  [${bar}] ${pct}% (${loaded}/${total})`,
          color: '#8be9fd',
          delay: 0,
        };
        // Replace last progress message or append
        if (last && last.text.startsWith('  [')) {
          return [...prev.slice(0, -1), progressMsg];
        }
        return [...prev, progressMsg];
      });
    }).then(() => {
      preloadDone = true;
      finishIfReady();
    });

    const finishIfReady = () => {
      if (!sequenceDone || !preloadDone) return;
      setMessages((prev) => [
        ...prev,
        { text: 'Assets cargados..........................[ OK ]', color: '#50fa7b', delay: 0 },
        { text: 'BabosOS cargado con éxito.', color: '#50fa7b', delay: 0 },
        { text: 'Bienvenido al sistema.', color: '#f1fa8c', delay: 0 },
      ]);
      setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setPhase('login');
        }, 500);
      }, 800);
    };

    const showNext = () => {
      if (index < bootSequence.length) {
        const msg = bootSequence[index];
        index++;
        setMessages((prev) => [...prev, msg]);
        timerRef.current = setTimeout(showNext, msg.delay);
      } else {
        sequenceDone = true;
        finishIfReady();
      }
    };

    showNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, setPhase]);

  return { messages, fading, isBooting: phase === 'boot' };
}
